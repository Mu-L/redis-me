use crate::utils::model::SshOption;
use crate::utils::util::AnyResult;
use log::{info, warn};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;

/// SSH 隧道管理器
///
/// 原理：
/// 1. 监听本地随机端口
/// 2. 收到连接后，建立 SSH 到远程服务器
/// 3. 通过 SSH channel 转发数据到目标 Redis
pub struct SshTunnel {
    pub local_port: u16,
    stop_flag: Arc<AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl SshTunnel {
    /// 启动 SSH 隧道，返回本地监听端口
    pub fn start(
        ssh_option: &SshOption,
        target_host: &str,
        target_port: u16,
    ) -> AnyResult<Self> {
        info!("SSH 隧道 {}:{}", ssh_option.host, ssh_option.port);

        let stop_flag = Arc::new(AtomicBool::new(false));
        let listener = TcpListener::bind("127.0.0.1:0")?;
        let local_port = listener.local_addr()?.port();
        info!("SSH 隧道本地监听端口: {}", local_port);

        let ssh_option = ssh_option.clone();
        let target_host = target_host.to_string();
        let stop_flag_clone = stop_flag.clone();

        let handle = thread::spawn(move || {
            Self::run(listener, stop_flag_clone, ssh_option, target_host, target_port);
        });

        Ok(SshTunnel {
            local_port,
            stop_flag,
            handle: Some(handle),
        })
    }

    /// 代理主循环：接受本地连接，交给 handle_connection 处理
    fn run(
        listener: TcpListener,
        stop_flag: Arc<AtomicBool>,
        ssh_option: SshOption,
        target_host: String,
        target_port: u16,
    ) {
        listener.set_nonblocking(true).ok();

        loop {
            if stop_flag.load(Ordering::SeqCst) {
                break;
            }

            match listener.accept() {
                Ok((local_stream, _)) => {
                    let opt = ssh_option.clone();
                    let host = target_host.clone();
                    thread::spawn(move || {
                        if let Err(e) = Self::handle_connection(local_stream, &opt, &host, target_port) {
                            warn!("SSH 隧道连接失败: {}", e);
                        }
                    });
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(std::time::Duration::from_millis(50));
                }
                Err(e) => {
                    warn!("SSH 隧道接受连接失败: {}", e);
                    thread::sleep(std::time::Duration::from_millis(100));
                }
            }
        }
    }

    /// 处理单个连接：SSH 认证 + 创建 channel + 双向转发
    fn handle_connection(
        local_stream: TcpStream,
        ssh_option: &SshOption,
        target_host: &str,
        target_port: u16,
    ) -> AnyResult<()> {
        // 1. 连接 SSH 服务器
        let tcp = TcpStream::connect(format!("{}:{}", ssh_option.host, ssh_option.port))?;
        tcp.set_nodelay(true)?;

        // 2. SSH 握手 + 认证
        let mut sess = ssh2::Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;
        Self::authenticate(&sess, ssh_option)?;

        // 3. 创建直连通道到目标 Redis
        sess.set_blocking(true);
        let channel = sess.channel_direct_tcpip(target_host, target_port, None)?;

        // 4. 双向转发
        Self::bridge(local_stream, channel);
        Ok(())
    }

    /// 双向数据转发（单线程非阻塞轮询）
    fn bridge(mut local: TcpStream, mut channel: ssh2::Channel) {
        let mut local_write = local.try_clone().expect("clone local");
        local.set_nonblocking(true).ok();
        local_write.set_nonblocking(true).ok();

        let mut buf1 = [0u8; 8192];
        let mut buf2 = [0u8; 8192];
        let mut closed1 = false;
        let mut closed2 = false;

        while !closed1 && !closed2 {
            // local → channel
            if !closed1 {
                match local.read(&mut buf1) {
                    Ok(0) => closed1 = true,
                    Ok(n) => {
                        if channel.write_all(&buf1[..n]).is_err() { closed2 = true; }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
                    Err(_) => closed1 = true,
                }
            }

            // channel → local
            if !closed2 {
                match channel.read(&mut buf2) {
                    Ok(0) => closed2 = true,
                    Ok(n) => {
                        if local_write.write_all(&buf2[..n]).is_err() { closed1 = true; }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
                    Err(_) => closed2 = true,
                }
            }

            if !closed1 && !closed2 {
                thread::sleep(std::time::Duration::from_millis(1));
            }
        }
    }

    /// SSH 认证（密码或私钥）
    fn authenticate(sess: &ssh2::Session, ssh_option: &SshOption) -> AnyResult<()> {
        let username = if ssh_option.username.is_empty() {
            "root"
        } else {
            &ssh_option.username
        };

        match ssh_option.login_type.as_str() {
            "pwd" | "" => {
                sess.userauth_password(username, &ssh_option.password)?;
            }
            "pkfile" => {
                if ssh_option.pkfile.is_empty() {
                    anyhow::bail!("私钥文件路径为空");
                }
                let passphrase = if ssh_option.passphrase.is_empty() {
                    None
                } else {
                    Some(ssh_option.passphrase.as_str())
                };
                sess.userauth_pubkey_file(username, None, Path::new(&ssh_option.pkfile), passphrase)?;
            }
            other => {
                anyhow::bail!("不支持的 SSH 登录方式: {}", other);
            }
        }

        if !sess.authenticated() {
            anyhow::bail!("SSH 认证失败");
        }

        info!("SSH 认证成功，用户: {}", username);
        Ok(())
    }
}

impl Drop for SshTunnel {
    fn drop(&mut self) {
        self.stop_flag.store(true, Ordering::SeqCst);
        // 连接一次本地端口唤醒监听器
        let _ = TcpStream::connect(format!("127.0.0.1:{}", self.local_port));
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}
