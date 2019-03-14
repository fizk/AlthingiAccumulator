import {Channel, Connection, ConsumeMessage} from "amqplib";
import {Db} from "mongodb";
import {HttpQuery, QueueMessage} from "../@types";

export default class App {
    _rabbit: Connection;
    _channel: Channel | undefined = undefined;
    _httpQuery: HttpQuery;
    _mongo: Db;

    constructor(rabbit: any, mongo: any, httpQuery: any) {
        this._rabbit = rabbit;
        this._mongo = mongo;
        this._httpQuery = httpQuery;
    }

    init() {
        return this._rabbit.createChannel().then((channel: Channel): App => {
            this._channel = channel;
            return this;
        });
    }

    use(queue: string, callback: (message: QueueMessage, db: Db, httpQuery: HttpQuery, ack: () => void) => Promise<any> | void) {
        if (!this._channel) {
            return;
        }
        this._channel.assertQueue(queue)
            .then(() => {
                console.log(`assertQueue: ${queue}`);
                return this._channel!.consume(queue, (msg: ConsumeMessage | null) => {
                    if (msg !== null) {
                        try {
                            const message: QueueMessage = JSON.parse(msg.content.toString());
                            callback(message, this._mongo, this._httpQuery, () => this._channel!.ack(msg));
                        } catch (e) {
                            this._channel!.ack(msg);
                            console.log(e.message);
                        }
                    }
                })
            }).catch(console.error)
    }
}
