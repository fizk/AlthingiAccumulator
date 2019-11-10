import {AppCallback, Assembly} from "../../@types";

/**
 * Adds an assembly to the assembly collection
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const add: AppCallback<Assembly> = async (message, mongo, elasticsearch, client) => {
    return mongo.collection('assembly').updateOne({
        'assembly.assembly_id': message.body.assembly_id
    }, {
        $set: {
            assembly: {
                ...message.body,
                from: message.body.from ? new Date(`${message.body.from} 00:00+00:00`) : null,
                to: message.body.to ? new Date(`${message.body.to} 00:00+00:00`) : null,
            }
        }
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Assembly.add(${message.body.assembly_id})`)
        }
        return Promise.resolve({
            controller: 'Assembly',
            action: 'add',
            params: message.body
        });
    });
};

/**
 * Updates Assembly's to date
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const update: AppCallback<Assembly> = async (message, mongo, elasticsearch, client) => {
    return mongo.collection('assembly').updateOne({
        'assembly.assembly_id': message.body.assembly_id
    }, {
        $set: {
            'assembly.to': message.body.to ? new Date(`${message.body.to} 00:00+00:00`) : null,
        }
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Assembly.update(${message.body.assembly_id})`)
        }
        return Promise.resolve({
            controller: 'Assembly',
            action: 'update',
            params: message.body
        });
    });
};
