# Pub/Sub

The pub/sub feature in [RedisME](https://www.hepengju.com) is built on Redis `PSUBSCRIBE` and `PUBLISH`, so you can manage message publishing and subscriptions in one place.

> SUBSCRIBE, UNSUBSCRIBE, and PUBLISH implement the publish/subscribe messaging pattern in which (as Wikipedia puts it) senders (publishers) are not programmed to send their messages to specific receivers (subscribers). Rather, published messages are characterized into channels, without knowledge of what (if any) subscribers there may be. Subscribers express interest in one or more channels, and only receive messages that are of interest, without knowledge of what (if any) publishers there are. This decoupling of publishers and subscribers allows for greater scalability and a more dynamic network topology.

## Feature Overview

- **Subscribe**: Configure subscription channels (glob-style patterns; default `*` subscribes to all channels).
- **Publish**: Send messages to a given channel.

![main.png](../../../public/images/pubsub/main.png)
