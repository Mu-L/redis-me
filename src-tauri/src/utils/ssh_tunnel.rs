use crate::utils::model::SshOption;
use crate::utils::util::AnyResult;
use log::{info, warn};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

/// SSH 隧道管理器
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

    fn run(
        listener: TcpListener,
        stop_flag: Arc<AtomicBool>,
        ssh_option: SshOption,
        target_host: String,
        target_port: u16,
    ) {
        listener.set_nonblocking(true).ok();
        loop {
            if stop_flag.load(Ordering::SeqCst) { break; }
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
                    thread::sleep(Duration::from_millis(50));
                }
                Err(_) => break,
            }
        }
    }

    fn handle_connection(
        local_stream: TcpStream,
        ssh_option: &SshOption,
        target_host: &str,
        target_port: u16,
    ) -> AnyResult<()> {
        let tcp = TcpStream::connect(format!("{}:{}", ssh_option.host, ssh_option.port))?;
        tcp.set_nodelay(true)?;

        let mut sess = ssh2::Session::new()?;
        sess.set_tcp_stream(tcp);
        sess.handshake()?;
        Self::authenticate(&sess, ssh_option)?;

        // 创建 channel（阻塞模式）后切非阻塞
        sess.set_blocking(true);
        let channel = sess.channel_direct_tcpip(target_host, target_port, None)?;
        sess.set_blocking(false);

        Self::bridge(local_stream, channel);
        Ok(())
    }

    /// 双向转发：单线程非阻塞轮询
    fn bridge(mut local: TcpStream, mut channel: ssh2::Channel) {
        let mut local_r = local.try_clone().expect("clone local");
        local.set_nonblocking(true).ok();
        local_r.set_nonblocking(true).ok();

        let mut buf1 = [0u8; 8192];
        let mut buf2 = [0u8; 8192];
        let mut done1 = false;
        let mut done2 = false;

        while !done1 || !done2 {
            if !done1 {
                match local.read(&mut buf1) {
                    Ok(0) => done1 = true,
                    Ok(n) => { if channel.write_all(&buf1[..n]).is_err() { done2 = true; } }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
                    Err(_) => done1 = true,
                }
            }
            if !done2 {
                match channel.read(&mut buf2) {
                    Ok(0) => done2 = true,
                    Ok(n) => { if local_r.write_all(&buf2[..n]).is_err() { done1 = true; } }
                    Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
                    Err(_) => done2 = true,
                }
            }
            if !done1 || !done2 {
                thread::sleep(Duration::from_millis(1));
            }
        }
    }

    fn authenticate(sess: &ssh2::Session, ssh_option: &SshOption) -> AnyResult<()> {
        let username = if ssh_option.username.is_empty() {
            "root"
        } else {
            &ssh_option.username
        };
        match ssh_option.login_type.as_str() {
            "pwd" | "" => { sess.userauth_password(username, &ssh_option.password)?; }
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
            other => anyhow::bail!("不支持的 SSH 登录方式: {}", other),
        }
        if !sess.authenticated() { anyhow::bail!("SSH 认证失败"); }
        info!("SSH 认证成功，用户: {}", username);
        Ok(())
    }
}

impl Drop for SshTunnel {
    fn drop(&mut self) {
        self.stop_flag.store(true, Ordering::SeqCst);
        let _ = TcpStream::connect(format!("127.0.0.1:{}", self.local_port));
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}
