import {AppCallback, Speech} from "../../@types";

/**
 * Adds/Updates a Speech to Elasticsearch
 *
 * @param message
 * @param _
 * @param search
 */
export const add: AppCallback<Speech> = (message, _, search) => {
    return search.index({
        id: message.id,
        index: message.index,
        body: {
            ...message.body,
            from: new Date(`${message.body.from}+00:00`),
            to: new Date(`${message.body.to}+00:00`),
        }
    }).then(result => {
        return Promise.resolve(`Speech.add(${message.id}:${message.index}:${result.statusCode}:${result.body.result}|${result.warnings})`);
    });
};
