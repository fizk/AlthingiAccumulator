import {Db} from "mongodb";
import {Category, HttpQuery, Issue, IssueCategory, Message} from "../../@types";

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
                throw new Error(`ERROR: Issue.addIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.addIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
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

/**
 * When an issue is added, accumulated states can be placed on the Assembly collection.
 * This includes: count each type of A issues, count each type of B issues, count each
 * status of A issues and the status of government issues.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addIssueToAssembly = (message: Message<Issue>, mongo: Db, client: HttpQuery): Promise<any> => {
    return Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/flokkar-stada`, {tegund: 'A'}),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/flokkar-stada`, {tegund: 'B'}),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/stjornarfrumvorp`),
    ]).then(([typeA, typeB, issues]) => {
        return mongo.collection('assembly')
            .updateOne({
                'assembly.assembly_id': message.body.assembly_id,
            }, {
                $set: {
                    issues: {
                        government: issues,
                        typeA: typeA,
                        typeB: typeB,
                    }
                }
            }, {
                upsert: true
            }).then(result => {
                if (!result.result.ok) {
                    throw new Error(`ERROR: Issue.addIssueToAssembly(${message.body.assembly_id})`);
                }
                return `Issue.addIssueToAssembly(${message.body.assembly_id})`;
            });
    });
};


/**
 * When every a category is added to an Issue (málaflokkur)
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addCategory = (message: Message<IssueCategory>, mongo: Db, client: HttpQuery): Promise<any> => {
    return Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/malaflokkar`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/yfir-malaflokkar`)
    ]).then(([categories, superCategories]) => {
        return mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {
                    superCategories: superCategories,
                    categories: categories
                }
            }, {
                upsert: true
            }).then(result => {
                if (!result.result.ok) {
                    throw new Error(`ERROR: Issue.addCategory(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
                }
                return `Issue.addCategory(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
            });
    });
};
