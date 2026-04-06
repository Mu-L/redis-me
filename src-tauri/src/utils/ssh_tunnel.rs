use crate::utils::error::AppError;
use crate::utils::model::SshOption;
use crate::utils::util::AnyResult;
use log::{info, warn};
use russh::client;
use russh::keys::key::PrivateKeyWithHashAlg;
use std::future::Future;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::io::copy_bidirectional;
use tokio::net::TcpListener;
use tokio::runtime::Runtime;
use tokio::time::timeout;

/// SSH 隧道管理器
pub struct SshTunnel {
    pub local_port: u16,
    stop_flag: Arc<AtomicBool>,
    runtime: Option<Runtime>,
}

/// SSH 客户端处理器
struct ClientHandler;

impl client::Handler for ClientHandler {
    type Error = russh::Error;

    fn check_server_key(
        &mut self,
        _server_public_key: &russh::keys::ssh_key::PublicKey,
    ) -> impl Future<Output = Result<bool, Self::Error>> + Send {
        // 接受所有服务器密钥（生产环境应该验证服务器密钥）
        async { Ok(true) }
    }
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
        let runtime = Runtime::new()?;

        // 在运行时中绑定端口并获取端口号
        let local_port = runtime.block_on(async {
            let listener = TcpListener::bind("127.0.0.1:0").await?;
            Ok::<_, std::io::Error>(listener.local_addr()?.port())
        })?;

        info!("SSH 隧道本地监听端口: {}", local_port);

        let ssh_option = ssh_option.clone();
        let target_host = target_host.to_string();
        let stop_flag_clone = stop_flag.clone();

        // 在后台线程中运行异步任务
        runtime.spawn(async move {
            if let Err(e) = Self::run_listener(
                stop_flag_clone,
                ssh_option,
                target_host,
                target_port,
                local_port,
            )
            .await
            {
                warn!("SSH 隧道运行错误: {}", e);
            }
        });

        Ok(SshTunnel {
            local_port,
            stop_flag,
            runtime: Some(runtime),
        })
    }

    async fn run_listener(
        stop_flag: Arc<AtomicBool>,
        ssh_option: SshOption,
        target_host: String,
        target_port: u16,
        local_port: u16,
    ) -> AnyResult<()> {
        let listener = TcpListener::bind(format!("127.0.0.1:{}", local_port)).await?;

        info!("SSH 隧道等待连接...");

        loop {
            if stop_flag.load(Ordering::SeqCst) {
                info!("SSH 隧道停止中...");
                break;
            }

            // 设置接受连接的超时
            match timeout(Duration::from_millis(500), listener.accept()).await {
                Ok(Ok((mut local_stream, _))) => {
                    let opt = ssh_option.clone();
                    let host = target_host.clone();
                    let tport = target_port;

                    tokio::spawn(async move {
                        if let Err(e) =
                            Self::handle_connection(&mut local_stream, &opt, &host, tport).await
                        {
                            warn!("SSH 隧道连接失败: {}", e);
                        }
                    });
                }
                Ok(Err(e)) => {
                    warn!("接受连接失败: {}", e);
                }
                Err(_) => {
                    // 超时，继续循环
                }
            }
        }

        Ok(())
    }

    async fn handle_connection(
        local_stream: &mut tokio::net::TcpStream,
        ssh_option: &SshOption,
        target_host: &str,
        target_port: u16,
    ) -> AnyResult<()> {
        info!(
            "SSH 隧道新连接，目标: {}:{}",
            target_host, target_port
        );

        // 连接到 SSH 服务器
        let ssh_config = client::Config::default();
        let ssh_config = Arc::new(ssh_config);

        let handler = ClientHandler;
        let mut session = client::connect(
            ssh_config,
            format!("{}:{}", ssh_option.host, ssh_option.port),
            handler,
        )
        .await?;

        // 认证
        Self::authenticate(&mut session, ssh_option).await?;

        // 打开 TCP 转发通道
        let channel = session
            .channel_open_direct_tcpip(
                target_host,
                target_port as u32,
                "127.0.0.1",
                0, // 本地端口，russh 会忽略这个值
            )
            .await?;

        let mut ssh_stream = channel.into_stream();

        // 双向数据转发
        match copy_bidirectional(local_stream, &mut ssh_stream).await {
            Ok((to_remote, to_local)) => {
                info!(
                    "SSH 隧道连接关闭，传输: 上行 {} 字节, 下行 {} 字节",
                    to_remote, to_local
                );
            }
            Err(e) => {
                warn!("SSH 隧道数据传输错误: {}", e);
            }
        }

        Ok(())
    }

    async fn authenticate(
        session: &mut client::Handle<ClientHandler>,
        ssh_option: &SshOption,
    ) -> AnyResult<()> {
        let username = if ssh_option.username.is_empty() {
            "root"
        } else {
            &ssh_option.username
        };

        match ssh_option.login_type.as_str() {
            "pwd" | "" => {
                // 密码认证
                session
                    .authenticate_password(username, &ssh_option.password)
                    .await?;
            }
            "pkfile" => {
                // 私钥文件认证
                if ssh_option.pkfile.is_empty() {
                    anyhow::bail!(AppError::SshKeyFileEmpty);
                }

                let passphrase = if ssh_option.passphrase.is_empty() {
                    None
                } else {
                    Some(ssh_option.passphrase.as_str())
                };

                // 加载私钥文件
                let key_pair = russh::keys::load_secret_key(
                    std::path::Path::new(&ssh_option.pkfile),
                    passphrase,
                )?;

                let key_pair = PrivateKeyWithHashAlg::new(Arc::new(key_pair), None);

                session
                    .authenticate_publickey(username, key_pair)
                    .await?;
            }
            other => {
                anyhow::bail!(AppError::SshLoginMethodNotSupported {
                    method: other.into()
                });
            }
        }

        info!("SSH 认证成功，用户: {}", username);
        Ok(())
    }
}

impl Drop for SshTunnel {
    fn drop(&mut self) {
        info!("SSH 隧道关闭，本地端口: {}", self.local_port);
        self.stop_flag.store(true, Ordering::SeqCst);

        // 等待运行时任务完成
        if let Some(runtime) = self.runtime.take() {
            // 给一点时间让循环检测到 stop_flag
            std::thread::sleep(Duration::from_millis(100));
            runtime.shutdown_timeout(Duration::from_secs(2));
        }
    }
}
