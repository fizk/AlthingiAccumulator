import {AppCallback, Speech} from "../../@types";

/**
 * Adds an Speech to speech collection
 *
 * @param message
 * @param mongo
 * @param client
 */
export const add: AppCallback<Speech> = async (message, mongo, client) => {
    const congressman = await client!(`/samantekt/thingmenn/${message.body.congressman_id}`, {dags: message.body.from});

    return mongo.collection('speech')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {
                congressman: congressman,
                // @ts-ignore
                time: (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
                speech: {
                    ...message.body,
                    from: new Date(`${message.body.from}+00:00`),
                    to: message.body.to ? new Date(`${message.body.to}+00:00`) : null,
                }
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Speech.add(${message.body.speech_id})`);
            }
            return `Speech.add(${message.body.speech_id})`;
        });
};

/**
 * Updates text and validation flag for Speech.
 *
 * @param message
 * @param mongo
 */
export const update: AppCallback<Speech> = async (message, mongo) => {
    return mongo.collection('speech')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {
                "speech.text": message.body.text,
                "speech.validated": message.body.validated,
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Speech.update(${message.body.speech_id})`);
            }
            return `Speech.update(${message.body.speech_id})`;
        });
};
