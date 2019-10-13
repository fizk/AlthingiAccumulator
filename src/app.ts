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

    use<T>(queue: string, callback: AppCallback<T>) {
        if (!this._channel) {
            return;
        }
        this._channel.assertQueue(queue, this._options)
            .then(() => {
                console.log(`DEBUG:(${queue}) initialize`);
                return this._channel!.consume(queue, (msg: ConsumeMessage | null) => {
                    if (msg !== null) {
                        try {
                            const message: Message<T> = JSON.parse(msg.content.toString());
                            callback(message, this._mongo, this._elasticsearch, this._httpQuery)
                                .then(result => {
                                    this._channel!.ack(msg);
                                    console.log(`INFO:(${queue}) ${result}`)
                                })
                                .catch(error => {
                                    if (msg.fields.redelivered) {
                                        this._channel!.nack(msg, undefined, false);
                                        console.error(`WARN:(${queue}) -> dead-letter-exchange | ${error && error.message} | ${msg.content.toString()}`);
                                    } else {
                                        this._channel!.nack(msg, undefined, true);
                                        console.log(`DEBUG:(${queue}) -> requeue | ${error && error.message} | ${msg.content.toString()}`);
                                    }
                                });
                        } catch (e) {
                            this._channel!.ack(msg);
                            console.log(`ERROR:(${queue}) ${e.message} | ${msg && msg.content && msg.content.toString()}`);
                        }
                    }
                })
            }).catch(error => {
                console.error(`ALERT:(${queue}) ${error.message}`);
            })
    }
}
