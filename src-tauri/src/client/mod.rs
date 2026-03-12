pub mod client_trait;
pub mod impl_cluster;
pub mod impl_single;
pub mod state;

// ~~~~~~~~~~~~~~~~~~~~~模块测试~~~~~~~~~~~~~~~~~~~~~
#[cfg(test)]
mod tests {
    use crate::client::client_trait::RedisMeClient;
    use crate::client::impl_cluster::RedisMeCluster;
    use crate::client::impl_single::RedisMeSingle;
    use crate::utils::conn::{get_client_cluster, get_client_single};
    use crate::utils::model::*;
    use crate::utils::util::AnyResult;
    use redis::TlsMode;
    use redis::cluster::{ClusterClient, ClusterPipeline};

    fn client() -> Box<dyn RedisMeClient> {
        // default_provider().install_default()
        //     .expect("Failed to install rustls crypto provider");
        client_single()
        // client_cluster()
    }

    #[allow(unused)]
    fn conf_single() -> RedisConf {
        RedisConf {
            id: "test".into(),
            name: "test".into(),
            host: "ali.hepengju.com".into(),
            port: 6379,
            username: "".into(),
            password: "hepengju".into(),
            db: 0,
            cluster: false,
            ssl: false,
            ssl_option: None,
            sentinel: false,
            master_name: "".to_string(),
            master_username: "".to_string(),
            master_password: "".to_string(),
        }
    }

    #[allow(unused)]
    fn conf_cluster() -> RedisConf {
        RedisConf {
            id: "test".into(),
            name: "test".into(),
            host: "ali.hepengju.com".into(),
            port: 7001,
            username: "".into(),
            password: "hepengju".into(),
            db: 0,
            cluster: true,
            ssl: false,
            ssl_option: None,
            sentinel: false,
            master_name: "".to_string(),
            master_username: "".to_string(),
            master_password: "".to_string(),
        }
    }

    #[allow(unused)]
    fn client_single() -> Box<dyn RedisMeClient> {
        let conf = conf_single();
        RedisMeSingle::init(&conf).unwrap()
    }

    #[allow(unused)]
    fn client_cluster() -> Box<dyn RedisMeClient> {
        let conf = conf_cluster();
        RedisMeCluster::init(&conf).unwrap()
    }

    #[test]
    fn test_info() {
        let result = client().info(None).unwrap();
        println!("{result:#?}");
    }

    #[test]
    fn test_info_node() {
        let result = client().info(Some("ali.hepengju.com:7006".into())).unwrap();
        println!("{result:#?}");
    }

    #[test]
    fn test_info_list() {
        let vec = client().info_list().unwrap();
        println!("vec: {vec:#?}")
    }

    #[test]
    fn test_node_list() {
        let vec = client().node_list().unwrap();
        println!("vec: {vec:#?}")
    }

    #[test]
    fn test_scan() {
        let param = ScanParam {
            pattern: "*".into(),
            count: 10,
            scan_type: None,

            cursor: Some(ScanCursor::default()),
            load_all: false,
        };
        let result1 = client().scan(param).unwrap();
        println!("{result1:#?}");

        let param2 = ScanParam {
            pattern: "*".into(),
            count: 10,
            scan_type: None,
            cursor: Some(result1.cursor),
            load_all: false,
        };
        let result2 = client().scan(param2).unwrap();
        println!("{result2:#?}");
    }

    #[test]
    fn test_field_scan_mock() -> AnyResult<()> {
        let conn_single = conf_single();
        let client = get_client_single(&conn_single)?;
        let mut conn = client.get_connection()?;

        let mut pipe = redis::pipe();
        pipe.del("field-scan:string").ignore();
        pipe.del("field-scan:hash").ignore();
        pipe.del("field-scan:list").ignore();
        pipe.del("field-scan:set").ignore();
        pipe.del("field-scan:zset").ignore();

        pipe.set("field-scan:string", "字段扫描字符串类型 😄")
            .ignore();
        for i in 0..600 {
            // 大于512个
            pipe.hset("field-scan:hash", format!("k{i}"), format!("v{i}"))
                .ignore();
            pipe.rpush("field-scan:list", format!("v{i}")).ignore();
            pipe.sadd("field-scan:set", format!("v{i}")).ignore();
            pipe.zadd("field-scan:zset", format!("v{i}"), i).ignore();
        }
        let _: () = pipe.query(&mut conn)?;

        let conn_cluster = conf_cluster();
        let client = get_client_cluster(&conn_cluster)?;
        let mut conn = client.get_connection()?;

        let mut pipe = ClusterPipeline::new();
        pipe.del("field-scan:string").ignore();
        pipe.del("field-scan:hash").ignore();
        pipe.del("field-scan:list").ignore();
        pipe.del("field-scan:set").ignore();
        pipe.del("field-scan:zset").ignore();

        pipe.set("field-scan:string", "字段扫描字符串类型 😄")
            .ignore();
        for i in 0..555 {
            // 大于512个
            pipe.hset("field-scan:hash", format!("k{i}"), format!("v{i}"))
                .ignore();
            pipe.rpush("field-scan:list", format!("v{i}")).ignore();
            pipe.sadd("field-scan:set", format!("v{i}")).ignore();
            pipe.zadd("field-scan:zset", format!("v{i}"), i).ignore();
        }
        let _: () = pipe.query(&mut conn)?;

        Ok(())
    }

    fn test_field_scan_param(key: &str) -> FieldScanParam {
        FieldScanParam {
            key: RedisKey {
                key: key.to_string(),
                bytes: vec![],
            },
            hash_key: None,
            count: 150,
            cursor: None,
            load_all: false,
        }
    }

    #[test]
    fn test_field_scan() {
        // let mut param = test_field_scan_param("field-scan:string");
        // let mut param = test_field_scan_param("field-scan:hash");
        // param.hash_key = Some("k0".into());
        // let mut param = test_field_scan_param("field-scan:list");
        // let mut param = test_field_scan_param("field-scan:set");
        let mut param = test_field_scan_param("field-scan:zset");
        let result = client().field_scan(param.clone()).unwrap();
        println!("{}", serde_json::to_string_pretty(&result).unwrap());

        if !result.cursor.finished {
            param.cursor = Some(result.cursor.clone());
            let result = client().field_scan(param).unwrap();
            println!("{}", serde_json::to_string_pretty(&result).unwrap());
        }
    }

    #[test]
    fn test_get() {
        let value = client().get("hepengju:list".into(), None).unwrap();
        println!("{value:#?}");
        println!("{}", serde_json::to_string(&value).unwrap());

        let value = client().get("hepengju:string".into(), None).unwrap();
        println!("{}", serde_json::to_string(&value).unwrap());

        let value = client().get("hepengju:stream".into(), None).unwrap();
        println!("{}", serde_json::to_string(&value).unwrap());

        let value = client().get("hepengju:json-obj".into(), None).unwrap();
        println!("{}", serde_json::to_string(&value).unwrap());

        let value = client().get("hepengju:json-array".into(), None).unwrap();
        println!("{}", serde_json::to_string(&value).unwrap());
    }

    #[test]
    fn test_field_add() {
        client().del("redis_me:string".into()).unwrap();

        client()
            .field_add(RedisFieldAdd {
                key: "redis_me:string".into(),
                mode: "key".into(),
                key_type: "string".into(),
                ttl: -1,
                value: "字符串值".into(),
                list_push_method: "".into(),
                field_value_list: vec![],
                stream_id: "".to_string(),
            })
            .unwrap();

        client()
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
                stream_id: "".to_string(),
            })
            .unwrap();
    }

    #[test]
    fn test_mock_data() {
        client().mock_data(10).unwrap();
    }

    #[test]
    fn test_execute_command() {
        mock_command("ping");
        mock_command("cluster info");
        mock_command("cluster slots");
        mock_command("config get save");
        mock_command("config get *");
        mock_command(r#"config set save "3600 1 300 100 60 10000" "#);
    }

    fn mock_command(command: &str) {
        let result = client().execute_command(RedisCommand {
            command: command.into(),
            node: None,
            auto_broadcast: Some(true),
        });
        println!("{result:#?}");
    }

    #[test]
    fn test_config_get() {
        let result = client().config_get("*", None).unwrap();
        println!("{result:#?}");
    }

    #[test]
    fn test_config_set() {
        let result = client()
            .config_set("save", "3600 2 300 100 60 10000", None)
            .unwrap();
        println!("{result:#?}");
        let result = client()
            .config_set(
                "save",
                "3600 2 300 100 60 10000",
                Some("10.106.0.167:7005".into()),
            )
            .unwrap();
        println!("{result:#?}");
    }

    #[test]
    fn test_slow_log() {
        let result = client()
            .slow_log(Some(3), Some("10.106.0.167:7005".into()))
            .unwrap();
        println!("{result:#?}");
    }

    #[test]
    fn test_memory_usage() {
        let result = client()
            .memory_usage(RedisMemoryParam {
                pattern: None,
                size_limit: 1,
                count_limit: 100,
                scan_count: 1000,
                scan_total: 10000,
                sleep_millis: 0,
                need_key_type: Some(true),
            })
            .unwrap();
        println!("{result:#?}");
    }

    // https://github.com/redis-rs/redis-rs/issues/1814
    #[test]
    fn test_cluster_pipeline_reproduce() -> anyhow::Result<()> {
        // redis cluster: 7001 ~ 7006, with ssl and password
        let nodes = vec!["rediss://192.168.1.11:7001"];
        let client = ClusterClient::builder(nodes)
            .tls(TlsMode::Insecure)
            .password("hepengju")
            .build()?;
        let mut conn = client.get_connection()?;

        // get
        let mut pipe = ClusterPipeline::new();
        pipe.cmd("get").arg("hepengju:string1");
        pipe.cmd("get").arg("hepengju:string2");
        pipe.cmd("get").arg("hepengju:string3");
        let results: Vec<Option<String>> = pipe.query(&mut conn)?;
        println!("{results:?}");
        // ["string1value", "string2value", "string3value"]

        // memory usage
        pipe = ClusterPipeline::new();
        pipe.cmd("memory").arg("usage").arg("hepengju:string1");
        pipe.cmd("memory").arg("usage").arg("hepengju:string2");
        pipe.cmd("memory").arg("usage").arg("hepengju:string3");
        let sizes: Vec<Option<u64>> = pipe.query(&mut conn)?;
        // Error: An error was signalled by the server - Moved: 14021 192.168.1.11:7005
        println!("{sizes:?}");

        Ok(())
    }

    #[test]
    fn test_client_list() {
        let result = client().client_list(None, None).unwrap();
        println!("{result:?}");
    }

    // #[test]
    // fn test_monitor() {
    //     let result = client().monitor("192.168.1.11:7001").unwrap();
    //     println!("{result:?}");
    // }

    #[test]
    fn test_publish() {
        let result = client().publish("channel", "message").unwrap();
        println!("{result:?}");
    }

    // #[test]
    // fn test_subscribe() {
    //     let result = client().subscribe(None).unwrap();
    //     println!("{result:?}");
    // }
}
