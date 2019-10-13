
## What is this?
This is a Node process that listens to RabbitMQ messages and delegates them to a MongoDB and Elasticsearch.

As part of the [Loggjafarthing](https://github.com/fizk/AlthingiMaster) project. This part of the system is
listening for changes in the [API](https://github.com/fizk/Loggjafarthing) and will update other services.

## The longer story.
When ever there is a CUD (create/update/delete) operation in the [API](https://github.com/fizk/Loggjafarthing) it will
notify a message broker (RabbitMQ).

This system sits on the other side of this broker. It's listening for incoming messages and will act on these messages.

## Architecture.
This system is dependent on a MongoDB instance and an Elasticsearch instance as well. This system will also make
requests back to [API](https://github.com/fizk/Loggjafarthing) for some additional data.

[API](https://github.com/fizk/Loggjafarthing) will only send a single message to RabbitMD's `service` exchange. The API
is just letting know that something happened, it does'nt really care what happens to the message.

RabbitMD's `service` exchange will `fanout` that message to two other exchanges. These exchanges are:

* aggregate
* search

They are attach to queues that, this system is listening to. The system will process the incoming message,
decorate it with additional information and then store it in appropriate Service. 

![diagram](https://user-images.githubusercontent.com/386336/66708148-b12ef500-ed97-11e9-8983-4054cd0942a6.png)


## Development.
This repo comes with a `docker-compose` file. It will start Elasticsearch, MongoDB, RabbitMQ as well as the 
NodeJS application itself.

To run in development mode. That is: having [nodemon](https://nodemon.io/) listening to changes and will restarting 
the Node server when file changes, run the `run` service. (This would not fly in production).

```bash
$ docker-compose up run
``` 

Because the app needs to call back to the [API](https://github.com/fizk/Loggjafarthing), you either need to spin it up
locally, in which case the app will use `host.docker.internal` which defaults to `localhost`. Or, you can use the
[production API](http://loggjafarthing.einarvalur.co:8080), but then you need to set an **env var** 
to `ENV_API_HOST=loggjafarthing.einarvalur.co`. I also find it good to do a complete build when I start the service. 
The whole thing could look like this:

```bash
$ export ENV_API_HOST=loggjafarthing.einarvalur.co 
$ docker-compose up --build run
``` 

There are other variables you can set in your environment to control the Docker container, see table below.

**WARNING**
No storage is persisted, so once the containers come down, so does the data.

### Inspecting services

**RabbitMQ's** web UI is available at [localhost:15672](http://localhost:15672)

**Elasticsearch** does'nt come with a web UI, but you can run the `kibana` service from docker-compose to get inside the
cluster.

```bash
$ docker-compose up -d kibana
``` 

**MongoDB** exposes port `27017`, so fire up your favourite GUI client there.

**The App** is `console.log`ing to stdOut.

## Testing
There is a dedicated service for running tests in the `docker-compose`.

```bash
$ docker-compose run test
``` 

This command is also used by [Travis CI](https://travis-ci.com)

## Configuring the services.

**MongoDB** needs to create indexes and users, this is done when the service starts up for the first time by scooping up
`config/mongo/001.collections.sh`

**RabbitMQ** needs to create definitions, this is done when the service starts up for the first time by scooping up
`config/rabbitmq/definitions.json`

**Elasticsearch** does'nt have a way of creating index templates on service startup, what you can do it start up the
service, then start up the Kibana service, go into the Dev Tools panel and paste in what in the 
`config/elasticsearch/templates.txt` and run.

## Configuring the application
The JavaScript code is expecting these environment variables. They are all set in the `docker-compose` file. If you
are running this locally, it's best to set these values in your environment.


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


## Configure Docker container
There are environment variables that can be set before stating the Docker container to control it. They will be picked
up by the `docker-compose` file. They do have default values, so non of them need to be set before running the
container, but those default values might not be what you want them to be.

| key                  | value |
| -------------------- | ----- |
| ENV_STORE_HOST       |       |
| ENV_STORE_USER       |       |
| ENV_STORE_PASSWORD   |       |
| ENV_API_HOST         |       |
| ENV_API_PORT         |       |
| ENV_QUEUE_HOST       |       |
| ENV_QUEUE_USER       |       |
| ENV_QUEUE_PASSWORD   |       |
| ENV_SEARCH_PROTOCOL  |       |
| ENV_SEARCH_HOST      |       |
| ENV_SEARCH_PORT      |       |



### Useful commands from the cli

Importing and exporting data from MongoDB. 
```bash
$ mongoimport --username=wo --password='long@pass!123' -d althingi -c vote /home/<file-name>.json
$ mongoexport --username=wo --password='long@pass!123' -d althingi -c vote --out /home/<file-name>.json
```
