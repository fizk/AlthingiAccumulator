import {Issue, AppCallback} from "../../@types";

/**
 * Adds/Updates a Issue to Elasticsearch
 *
 * @param message
 * @param _
 * @param search
 */
export const add: AppCallback<Issue> = (message, _, search) => {
    return search.index({
        id: message.id,
        index: message.index,
        body: message.body
    }).then(result => {
        // return Promise.resolve(`Issue.add(${message.id}:${message.index}:${result.statusCode}:${result.body.result}|${result.warnings})`);
        return Promise.resolve({
            controller: 'Issue',
            action: 'add',
            params: message.body,
            elasticsearch: result
        });
    });
};
