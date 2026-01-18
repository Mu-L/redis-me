pub mod client_trait;
pub mod impl_cluster;
pub mod impl_single;
pub mod state;
pub mod unified;

// ~~~~~~~~~~~~~~~~~~~~~模块测试~~~~~~~~~~~~~~~~~~~~~
#[cfg(test)]
mod tests {
    use crate::client::client_trait::RedisMeClient;
    use crate::client::impl_cluster::RedisMeCluster;
    use crate::client::unified::UnifiedClient;
    use crate::utils::model::*;
    use redis::cluster::ClusterClient;

    async fn client() -> UnifiedClient {
        let conn = RedisConn {
            id: "test".into(),
            name: "test".into(),
            host: "192.168.1.111".into(),
            port: 7001,
            username: "".into(),
            password: "hepengju".into(),
            db: 0,
            cluster: true,
            ssl: false,
            ssl_option: None,
        };
        RedisMeCluster::init(&conn).await.unwrap()
    }

    #[tokio::test]
    async fn test_info() {
        let result = client().await.info(None).await.unwrap();
        dbg!(result);
    }

    #[tokio::test]
    async fn test_info_node() {
        let result = client().await.info(Some("47.100.130.153:7006".into())).await.unwrap();
        dbg!(result);
    }

    #[tokio::test]
    async fn test_info_list() {
        let vec = client().await.info_list().await.unwrap();
        dbg!(vec);
    }

    #[tokio::test]
    async fn test_node_list() {
        let vec = client().await.node_list().await.unwrap();
        dbg!(vec);
    }

    #[tokio::test]
    async fn test_scan() {
        let param = ScanParam {
            pattern: "*".into(),
            count: 10,
            scan_type: None,

            cursor: Some(ScanCursor {
                ready_nodes: vec![],
                now_node: "".into(),
                now_cursor: 0,
                finished: false,
            }),
            load_all: false,
        };
        let result1 = client().await.scan(param).await.unwrap();
        dbg!(result1.clone());

        let param2 = ScanParam {
            pattern: "*".into(),
            count: 10,
            scan_type: None,
            cursor: Some(result1.cursor),
            load_all: false,
        };
        let result2 = client().await.scan(param2).await.unwrap();
        dbg!(result2);
    }

    #[tokio::test]
    async fn test_get() {
        let value = client().await.get("hepengju:list".into(), None).await.unwrap();
        println!("{value:#?}");
        println!("{}", serde_json::to_string(&value).unwrap());

        let value = client().await.get("hepengju:string".into(), None).await.unwrap();
        println!("{}", serde_json::to_string(&value).unwrap());
    }

    #[tokio::test]
    async fn test_field_add() {
        client().await.del("redis_me:string".into()).await.unwrap();

        client().await
            .field_add(RedisFieldAdd {
                key: "redis_me:string".into(),
                mode: "key".into(),
                key_type: "string".into(),
                ttl: -1,
                value: "字符串值".into(),
                list_push_method: "".into(),
                field_value_list: vec![],
            }).await
            .unwrap();

        client().await
            .field_add(RedisFieldAdd {
                key: "redis_me:hash".into(),
                mode: "field".into(),
                key_type: "hash".into(),
                ttl: -1,
                value: "".into(),
                list_push_method: "".into(),
                field_value_list: vec![
                    RedisFieldValue {
                        field_key: "hash_key1".into(),
                        field_value: "value1".into(),
                        field_score: 0.0,
                    },
                    RedisFieldValue {
                        field_key: "hash_key2".into(),
                        field_value: "value2".into(),
                        field_score: 0.0,
                    },
                ],
            }).await
            .unwrap();
    }

    #[tokio::test]
    async fn test_mock_data() {
        client().await.mock_data(10).await.unwrap();
    }

    #[tokio::test]
    async fn test_execute_command() {
        mock_command("ping").await;
        mock_command("cluster info").await;
        mock_command("cluster slots").await;
        mock_command("config get save").await;
        mock_command("config get *").await;
        mock_command(r#"config set save "3600 1 300 100 60 10000" "#).await;
    }

    async fn mock_command(command: &str) {
        let result = client().await
            .execute_command(RedisCommand {
            command: command.into(),
            node: None,
            auto_broadcast: true,
        }).await;
        println!("{result:#?}");
    }

    #[tokio::test]
    async fn test_config_get() {
        let result = client().await.config_get("*", None).await.unwrap();
        println!("{result:#?}");
    }

    #[tokio::test] // TODO 验证
    async fn test_config_set() {
        let result = client().await
            .config_set("save", "3600 2 300 100 60 10000", None).await
            .unwrap();
        println!("{result:#?}");
        let result = client().await
            .config_set(
                "save",
                "3600 2 300 100 60 10000",
                Some("192.168.1.111:7005".into()),
            ).await
            .unwrap();
        println!("{result:#?}");
    }

    #[tokio::test]
    async fn test_slow_log() {
        let result = client().await
            .slow_log(Some(3), Some("192.168.1.111:7005".into())).await
            .unwrap();
        println!("{result:#?}");
    }

    #[tokio::test]
    async fn test_memory_usage() {
        let result = client().await
            .memory_usage(RedisMemoryParam {
                pattern: None,
                size_limit: 1,
                count_limit: 100,
                scan_count: 1000,
                scan_total: 10000,
                sleep_millis: 0,
                need_key_type: Some(true),
            }).await
            .unwrap();
        println!("{result:#?}");
    }

    // https://github.com/redis-rs/redis-rs/issues/1814
    // 修改为异步后抛出异常 Error: Received crossed slots in pipeline - Server(CrossSlot)
    // https://github.com/redis-rs/redis-rs/issues/1348
    // 按照作者的说明时异步没有必要使用pipeline
    #[tokio::test] // 异步集群验证失败
    async fn test_cluster_pipeline_reproduce() -> anyhow::Result<()> {
        let nodes = vec!["redis://192.168.1.111:7001"];
        let client = ClusterClient::builder(nodes)
            .password("hepengju")
            .build()?;
        let mut conn = client.get_async_connection().await?;

        // get
        let mut pipe = redis::pipe();
        pipe.cmd("get").arg("hepengju:string1");
        pipe.cmd("get").arg("hepengju:string2");
        pipe.cmd("get").arg("hepengju:string3");
        let results: Vec<Option<String>> = pipe.query_async(&mut conn).await?;
        println!("{results:?}");
        // ["string1value", "string2value", "string3value"]

        // memory usage
        pipe = redis::pipe();
        pipe.cmd("memory").arg("usage").arg("hepengju:string1");
        pipe.cmd("memory").arg("usage").arg("hepengju:string2");
        pipe.cmd("memory").arg("usage").arg("hepengju:string3");
        let sizes: Vec<Option<u64>> = pipe.query_async(&mut conn).await?;
        // Error: An error was signalled by the server - Moved: 14021 192.168.1.11:7005
        println!("{sizes:?}");

        Ok(())
    }

    #[tokio::test]
    async fn test_client_list() {
        let result = client().await.client_list(None, None).await.unwrap();
        println!("{result:?}");
    }

    #[tokio::test]
    async fn test_publish() {
        let result = client().await.publish("channel", "message").await.unwrap();
        println!("{result:?}");
    }

}
