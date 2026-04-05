use crate::utils::model::{RedisConf, SslOption};
use crate::utils::util::{AnyResult, CONNECTION_CHECK_TIMEOUT};
use anyhow::Context;
use log::info;
use redis::cluster::{ClusterClient, ClusterConfig};
use redis::sentinel::{SentinelClientBuilder, SentinelServerType};
use redis::{
    Client, ClientTlsConfig, Commands, ConnectionAddr, ConnectionLike, TlsCertificates, TlsMode,
};
use std::fs;

// 获取单机连接
pub fn get_client_single(conf: &RedisConf) -> AnyResult<Client> {
    let prefix = if conf.ssl { "rediss" } else { "redis" };
    let suffix = if conf.ssl { "/#insecure" } else { "" };

    let redis_url = format!(
        "{}://{}:{}@{}:{}{}",
        prefix, conf.username, conf.password, conf.host, conf.port, suffix
    );
    let redis_url_log = format!(
        "{}://{}:{}@{}:{}{}",
        prefix, conf.username, "******", conf.host, conf.port, suffix
    );
    // 日志打印中去除密码显示
    info!("redis_url: {redis_url_log}");

    let certs = get_tls_certs(conf.ssl_option.clone())?;
    let mut client = if conf.ssl
        && let Some(tls) = certs
    {
        Client::build_with_tls(redis_url, tls)?
    } else {
        Client::open(redis_url)?
    };
    // 测试连接是否可以成功，注意超时时间比较短，用户可以快速感知到。此连接使用后丢弃即可
    let mut conn = client.get_connection_with_timeout(CONNECTION_CHECK_TIMEOUT)?;
    let _: () = conn.ping()?;
    info!("Redis单机测试连接成功");

    // 哨兵模式 ==> 沿用上面的逻辑（避免默认超时时间太长，影响用户体验）
    if conf.sentinel {
        client = get_client_sentinel(conf)?;
    }
    Ok(client)
}

fn get_client_sentinel(conf: &RedisConf) -> AnyResult<Client> {
    let certs = get_tls_certs(conf.ssl_option.clone())?;
    let conf = conf.clone();
    let sentinel_option = conf.sentinel_option.clone().unwrap_or_default();
    let client = if conf.ssl
        && let Some(tls) = certs
    {
        let addr = ConnectionAddr::TcpTls {
            host: conf.host,
            port: conf.port,
            insecure: true,
            tls_params: None,
        };
        let mut builder =
            SentinelClientBuilder::new(vec![addr], sentinel_option.master_name, SentinelServerType::Master)?
                .set_client_to_redis_db(conf.db as i64)
                .set_client_to_redis_tls_mode(TlsMode::Secure)
                .set_client_to_redis_certificates(tls.clone())
                .set_client_to_sentinel_tls_mode(TlsMode::Secure)
                .set_client_to_sentinel_certificates(tls);
        // TODO ==> danger_accept_invalid_hostnames 改为 true（目前没有这个属性）
        // https://github.com/redis-rs/redis-rs/issues/1931

        if !conf.username.is_empty() {
            builder = builder.set_client_to_sentinel_username(conf.username);
        };
        if !conf.password.is_empty() {
            builder = builder.set_client_to_sentinel_password(conf.password);
        };
        if !sentinel_option.master_username.is_empty() {
            builder = builder.set_client_to_redis_password(sentinel_option.master_username);
        }
        if !sentinel_option.master_password.is_empty() {
            builder = builder.set_client_to_redis_password(sentinel_option.master_password);
        }
        builder.build()?.get_client()?
    } else {
        let addr = ConnectionAddr::Tcp(conf.host, conf.port);
        let mut builder =
            SentinelClientBuilder::new(vec![addr], sentinel_option.master_name, SentinelServerType::Master)?
                .set_client_to_redis_db(conf.db as i64);
        if !conf.username.is_empty() {
            builder = builder.set_client_to_sentinel_username(conf.username);
        };
        if !conf.password.is_empty() {
            builder = builder.set_client_to_sentinel_password(conf.password);
        };
        if !sentinel_option.master_username.is_empty() {
            builder = builder.set_client_to_redis_password(sentinel_option.master_username);
        }
        if !sentinel_option.master_password.is_empty() {
            builder = builder.set_client_to_redis_password(sentinel_option.master_password);
        }
        builder.build()?.get_client()?
    };
    Ok(client)
}

// 获取集群连接
pub fn get_client_cluster(conf: &RedisConf) -> AnyResult<ClusterClient> {
    let prefix = if conf.ssl { "rediss" } else { "redis" };
    let suffix = if conf.ssl { "/#insecure" } else { "" };
    let redis_url = format!("{}://{}:{}{}", prefix, conf.host, conf.port, suffix);
    info!("redis_url: {redis_url}");

    let mut builder = ClusterClient::builder(vec![redis_url]);
    if !conf.username.is_empty() {
        builder = builder.username(conf.username.clone());
    }
    if !conf.password.is_empty() {
        builder = builder.password(conf.password.clone());
    }
    if conf.ssl {
        builder = builder.danger_accept_invalid_hostnames(true);
        let certs = get_tls_certs(conf.ssl_option.clone())?;
        if let Some(certs) = certs {
            builder = builder.certs(certs);
        };
    }
    let client = builder.build()?;
    let cc = ClusterConfig::new().set_connection_timeout(CONNECTION_CHECK_TIMEOUT);
    let mut conn = client.get_connection_with_config(cc)?;
    let _: () = conn.ping()?;
    info!("测试集群测试连接成功");
    Ok(client)
}

// 获取证书
fn get_tls_certs(ssl_option: Option<SslOption>) -> AnyResult<Option<TlsCertificates>> {
    if ssl_option.is_none() {
        return Ok(None);
    }
    let ssl_option = ssl_option.unwrap_or_default();
    if ssl_option.key.is_empty() && ssl_option.cert.is_empty() && ssl_option.ca.is_empty() {
        return Ok(None);
    };
    let cert_vec8 = fs::read(ssl_option.cert).context("公钥文件读取失败")?;
    let key_vec8 = fs::read(ssl_option.key).context("私钥文件读取失败")?;
    let root_cert = if ssl_option.ca.is_empty() {
        None
    } else {
        Some(fs::read(ssl_option.ca).context("授权文件读取失败")?)
    };
    let certs = TlsCertificates {
        client_tls: Some(ClientTlsConfig {
            client_cert: cert_vec8,
            client_key: key_vec8,
        }),
        root_cert,
    };
    Ok(Some(certs))
}

// 设置客户端名称
pub fn set_client_name(conn: &mut dyn ConnectionLike) -> AnyResult<()> {
    let _: () = redis::cmd("client")
        .arg("setname")
        .arg("RedisME")
        .query(conn)?;
    info!("client setname RedisME");
    Ok(())
}
