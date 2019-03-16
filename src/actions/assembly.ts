import {Db} from "mongodb";
import {Assembly, HttpQuery, Message} from "../../@types";

/**
 * Adds an Assembly to assembly collection
 *
 * @param message
 * @param mongo
 * @param client
 */
export const add = (message: Message<Assembly>, mongo: Db, client: HttpQuery) => {
    return mongo.collection('assembly')
        .updateOne({
            'assembly.assembly_id': message.body.assembly_id,
        }, {
            $set: {
                assembly: {
                    ...message.body,
                    from: new Date(message.body.from),
                    to: message.body.to ? new Date(message.body.to) : null,
                }
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`ERROR: Assembly.add(${message.body.assembly_id})`);
            }
            return `Assembly.add(${message.body.assembly_id})`;
        })
};
