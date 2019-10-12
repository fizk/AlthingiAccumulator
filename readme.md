
## What is this?
This is a Node process that listens to RabbitMQ messages and delegates them to a MongoDB and Elasticsearch.

As part of the [Loggjafarthing](https://github.com/fizk/AlthingiMaster) project. This part of the system is
listening for changes in the [API](https://github.com/fizk/Loggjafarthing) and will update other services.

## The longer story.
When ever there is a CUD (create/update/delete) operation in the [API](https://github.com/fizk/Loggjafarthing) it will
notify a message broker (RabbitMQ).

This system sits on the other side of this broker. It's listening for incoming messages and will act on these messages.

## Architecture.
This system is dependent on a MongoDB instance and an Elesticsearch instance as well. This system will also make
requests back to [API](https://github.com/fizk/Loggjafarthing) for some additional data.

[API](https://github.com/fizk/Loggjafarthing) will only send a single message to RabbitMD's `service` exchange. The API
is just letting know that something happened, it does'nt really care what happens to the message.

RabbitMD's `service` exchange will `fanout` that message to two other exchanges: 

* aggregate
* search

These exchanges are attach to queues that, this system is listening to. The system will process the incoming message,
decorate it with additional information and then store it in appropriate Service. 

```
                                                            +--------------------+    +-------+    +-------------+    +---------------+
                                                       +--->| aggregate exchange |--->| queue |--->| this system |--->| MongoDB       |
 +-----+      +----------+      +------------------+   |    +--------------------+    +-------+    +-------------+    +---------------+
 | API | ---> | RabbitMQ | ---> | service exchange | --+
 +-----+      +----------+      +------------------+   |    +--------------------+    +-------+    +-------------+    +---------------+
                                                       +--->| search exchange    |--->| queue |--->| this system |--->| Elasticsearch |
                                                            +--------------------+    +-------+    +-------------+    +---------------+
```


## This system.


| Key               | Default       |
| ----------------- | ------------- |
| STORE_HOST        | localhost     |
| STORE_DB          | althingi      |
| STORE_PORT        | 27017         |
| STORE_USER        | wo            |
| STORE_PASSWORD    | long@pass!123 |
| QUEUE_PROTOCOL    | amqp          |
| QUEUE_HOST        | localhost     |
| QUEUE_PORT        | 5672          |
| QUEUE_USER        | guest         |
| QUEUE_PASSWORD    | guest         |
| API_HOST          | localhost     |
| SEARCH_PROTOCOL   | http          |
| SEARCH_HOST       | search        |
| SEARCH_PORT       | 9200          |



mongoimport --username=wo --password='long@pass!123' -d althingi -c vote /home/vote-149.json


mongoexport --username=wo --password='long@pass!123' -d althingi -c vote --out /home/vote-149.json

scp althingi:/root/AlthingiMaster/assets/vote-149.json /Users/einar.adalsteinsson/Desktop/dump
