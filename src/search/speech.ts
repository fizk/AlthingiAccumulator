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
        body: message.body
    }).then(result => {
        return Promise.resolve(`Speech.add(${message.id}:${message.index}:${result.statusCode}:${result.body.result}|${result.warnings})`);
    });
};
