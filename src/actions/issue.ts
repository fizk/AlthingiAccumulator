import {Issue, IssueCategory, Document, CongressmanDocument, Speech, AppCallback} from "../../@types";

/**
 * Adds a Issue to issue collection
 *
 * @param message
 * @param mongo
 */
export const add: AppCallback<Issue> = (message, mongo) => {
    return mongo.collection('issue')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {
                issue: message.body,
                date: null,
                proponents: [],
                speakers: [],
                speech_time: 0,
                speech_count: 0,
                government_issue: false,
                categories: [],
                super_categories: [],
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
};

/**
 * Update Issue in issue collection
 *
 * @param message
 * @param mongo
 */
export const update: AppCallback<Issue> = (message, mongo) => {
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
                throw new Error(`Issue.update(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.update(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
};

/**
 * Checks if a document is government-bill (stjórnarfrumvarp) and if so,
 * sets a flag on the Issue.
 *
 * @param message
 * @param mongo
 */
export const addGovernmentFlag: AppCallback<Document> = (message, mongo) => {
    if (message.body.type === 'stjórnarfrumvarp') {
        return mongo.collection('issue').updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {
                government_issue: true,
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.addGovernmentFlag(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.addGovernmentFlag(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
    } else {
        return Promise.resolve('Issue.addGovernmentFlag no update');
    }
};

/**
 * Check if a document is the original document, and if so
 * use its date as the date for the Issue.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addDateFlag: AppCallback<Document> = async (message, mongo, client) => {
    const documents = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);
    if (documents[0].document_id === message.body.document_id) {
        return mongo.collection('issue').updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {
                date: (message.body.date && new Date(`${message.body.date}+00:00`)) || null,
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.addDateFlag(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.addDateFlag(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
    } else {
        return Promise.resolve('Issue.addDateFlag no update')
    }
};

/**
 * When a proponent is added to a document, if this is the original document,
 * then that congressman is also the proponent of the Issue and should be added to the Issue.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponent: AppCallback<CongressmanDocument> = async (message, mongo, client) => {
    const documents = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);
    if (documents[0].document_id === message.body.document_id) {
        const congressman = await client!(`/samantekt/thingmenn/${message.body.congressman_id}`, {dags: documents[0].date});
        return mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $addToSet: {
                    proponents: {
                        congressman,
                        order: message.body.order,
                        minister: message.body.minister
                    },
                }
            }, {
                upsert: true
            }).then(result => {
                if (!result.result.ok) {
                    throw new Error(`Issue.addProponent(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
                }
                return `Issue.addProponent(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
            })
    } else {
        return Promise.resolve('Issue.addProponent no update');
    }
};

/**
 * When every a category is added to an Issue (málaflokkur)
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addCategory: AppCallback<IssueCategory> = async (message, mongo, client) => {
    const category = await client!(`/thingmal/efnisflokkar/0/undirflokkar/${message.body.category_id}`);
    const superCategory = await client!(`/thingmal/efnisflokkar/${category.super_category_id}`);

    return mongo.collection('issue')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $addToSet: {
                categories: category,
                super_categories: superCategory,
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.addCategory(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.addCategory(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
};

/**
 * Updates the total speech time and number of speeches for an issue
 *
 * @param message
 * @param mongo
 */
export const incrementSpeechCount: AppCallback<Speech> = async (message, mongo) => {
    return mongo.collection('issue')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $inc: {
                // @ts-ignore
                speech_time: (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
                speech_count: +1
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.incrementSpeechCount(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.incrementSpeechCount(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });

};

/**
 * When ever a speech is added, the time for that speaker is incremented on the Issue Collection.
 * @param message
 * @param mongo
 * @param client
 */
export const incrementIssueSpeakerTime: AppCallback<Speech> = async (message, mongo, client) => {
    const isCongressman = await mongo.collection('issue').findOne({
        'issue.assembly_id': message.body.assembly_id,
        'issue.issue_id': message.body.issue_id,
        'issue.category': message.body.category,
        speakers: {
            $elemMatch:{
                'congressman.congressman_id': message.body.congressman_id
            }
        }
    });

    if (!isCongressman) {
        const congressman = await client!(
            `/samantekt/thingmenn/${message.body.congressman_id}`,
            {loggjafarthing: message.body.assembly_id}
        );

        return mongo.collection('issue').updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $push: {
                speakers: {
                    congressman: congressman,
                    // @ts-ignore
                    time: (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
                }
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.incrementIssueSpeakerTime(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.incrementIssueSpeakerTime(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });

    } else {
        return mongo.collection('issue').updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
            speakers: {
                    $elemMatch:{
                        'congressman.congressman_id': message.body.congressman_id
                    }
                }
            },{
                $inc: {
                    // @ts-ignore
                    'speakers.$.time': (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
                }
        }, {
            upsert: true
        }
        ).then(result => {
            if (!result.result.ok) {
                throw new Error(`Issue.incrementIssueSpeakerTime(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`);
            }
            return `Issue.incrementIssueSpeakerTime(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category})`;
        });
    }
};
