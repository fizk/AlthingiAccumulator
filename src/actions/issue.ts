import {Db} from "mongodb";
import {HttpQuery, Issue, Message} from "../../@types";

/**
 * Adds a Issue to issue collection
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addIssue = (message: Message<Issue>, mongo: Db, client: HttpQuery) => {
    return mongo.collection('issue')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {issue: message.body}
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`ERROR: Issue.addIssue [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}]`);
            }
            return `Issue.addIssue: ${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}`;
        })
};


/**
 * When document, speech etc is added to Issue, its progress can be updated.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProgressToIssue = (message: Message<Issue>, mongo: Db, client: HttpQuery): Promise<any> => {
    return client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/ferill`)
        .then(progress => {
            return mongo.collection('issue')
                .updateOne({
                    'issue.assembly_id': message.body.assembly_id,
                    'issue.issue_id': message.body.issue_id,
                    'issue.category': message.body.category,
                }, {
                    $set: {progress: progress}
                }, {
                    upsert: true
                })
    }).then(result => {
            if (!result.result.ok) {
                throw new Error(`ERROR: Issue.addProgressToIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.addProgressToIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
};
