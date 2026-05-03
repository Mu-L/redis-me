# Command Monitor

The command monitoring feature in [RedisME](https://www.hepengju.com) is built on the Redis `MONITOR` command, which helps you troubleshoot issues.

> MONITOR is a debugging command that streams back every command processed by the Redis server. This helps you see what is happening in the database.
> The ability to see all requests the server is handling can be very useful for spotting bugs in an application when using Redis as a database or a distributed cache.
> For security reasons, MONITOR does not echo administrative commands, and sensitive data in the AUTH command is redacted.
> Because MONITOR streams all commands, it has a cost to use. In some cases, a single MONITOR client can reduce throughput by more than 50%. Running more MONITOR clients reduces throughput further.

![main.png](../../../public/images/monitor/main.png)
