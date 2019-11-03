import {Channel, Connection, ConsumeMessage, Options} from "amqplib";
import {Db} from "mongodb";
import {AppCallback, HttpQuery, Message} from "../@types";
import {Client} from '@elastic/elasticsearch';

export default class App {
    private _rabbit: Connection;
    private _channel: Channel | undefined = undefined;
    private _httpQuery: HttpQuery;
    private _mongo: Db;
    private _elasticsearch: Client;
    private _options: Options.AssertQueue;

    constructor(rabbit: any, mongo: any, httpQuery: any, elasticsearch: any, options: Options.AssertQueue) {
        this._rabbit = rabbit;
        this._mongo = mongo;
        this._httpQuery = httpQuery;
        this._options = options;
        this._elasticsearch = elasticsearch;
    }

    init() {
        return this._rabbit.createChannel().then((channel: Channel): App => {
            this._channel = channel;
            return this;
        });
    }

/*
{
    log_level: string
    queue: string
    content: json
    error_message: string
    reason: dead-letter-exchange | requeue | initialize | success | error


    controller
    action
    params
}
 */

    use<T>(queue: string, callback: AppCallback<T>) {
        if (!this._channel) {
            return;
        }
        this._channel.assertQueue(queue, this._options)
            .then(() => {
                // console.log(`DEBUG:(${queue}) initialize`);
                console.log(JSON.stringify({
                    log_level: 'DEBUG',
                    queue: queue,
                    content: null,
                    error_message: null,
                    reason: 'initialize',
                    controller: null,
                    action: null,
                    params: {},
                }));
                return this._channel!.consume(queue, (msg: ConsumeMessage | null) => {
                    if (msg !== null) {
                        try {
                            const message: Message<T> = JSON.parse(msg.content.toString());
                            callback(message, this._mongo, this._elasticsearch, this._httpQuery)
                                .then(result => {
                                    this._channel!.ack(msg);
                                    // console.log(`INFO:(${queue}) ${result}`)
                                    console.log(JSON.stringify({
                                        log_level: 'INFO',
                                        queue: queue,
                                        content: JSON.parse(msg.content.toString()),
                                        error_message: null,
                                        reason: 'success',
                                        ...result
                                    }));
                                })
                                .catch(error => {
                                    if (msg.fields.redelivered) {
                                        this._channel!.nack(msg, undefined, false);
                                        // console.error(`WARN:(${queue}) -> dead-letter-exchange | ${error && error.message} | ${msg.content.toString()}`);
                                        console.log(JSON.stringify({
                                            log_level: 'WARN',
                                            queue: queue,
                                            content: JSON.parse(msg.content.toString()),
                                            error_message: error && error.message,
                                            reason: 'dead-letter-exchange',
                                            controller: null,
                                            action: null,
                                            params: {},
                                        }));
                                    } else {
                                        this._channel!.nack(msg, undefined, true);
                                        // console.log(`DEBUG:(${queue}) -> requeue | ${error && error.message} | ${msg.content.toString()}`);
                                        console.log(JSON.stringify({
                                            log_level: 'DEBUG',
                                            queue: queue,
                                            content: JSON.parse(msg.content.toString()),
                                            error_message: error && error.message,
                                            reason: 'requeue',
                                            controller: null,
                                            action: null,
                                            params: {},
                                        }));
                                    }
                                });
                        } catch (e) {
                            this._channel!.ack(msg);
                            // console.log(`ERROR:(${queue}) ${e.message} | ${msg && msg.content && msg.content.toString()}`);
                            console.log(JSON.stringify({
                                log_level: 'ERROR',
                                queue: queue,
                                content: JSON.parse(msg.content.toString()),
                                error_message: e && e.message,
                                reason: 'error',
                                controller: null,
                                action: null,
                                params: {},
                            }));
                        }
                    }
                })
            }).catch((error: Error) => {
                // console.error(`ALERT:(${queue}) ${error.message}`);
                console.log(JSON.stringify({
                    log_level: 'ALERT',
                    queue: queue,
                    content: null,
                    error_message: error && error.message,
                    reason: 'error',
                    controller: null,
                    action: null,
                    params: {},
                }));
            })
    }
}
