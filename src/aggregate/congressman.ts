import {
    AppCallback,
    CongressmanDocument,
    Issue,
    Speech,
    Document,
    Session,
    VoteItem,
    HttpQuery,
    Constituency, Party, Maybe, MinisterSitting
} from "../../@types";
import {Db, InsertOneWriteOpResult} from "mongodb";


/**
 * Increment speech times for a Congressman in an Assembly.
 *
 * @client: fetch congressman (is not present)
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const incrementAssemblySpeechTime: AppCallback<Speech> = async (message, mongo, elasticsearch, client) => {

    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $inc: {
            // @ts-ignore
            speech_time:  (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
        }
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.incrementAssemblySpeechTime(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.speech_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementAssemblySpeechTime',
            params: message.body
        });
    });
};

/**
 * When a proponent is added to an issue (if that congressman is on the primary document), the congressman collection
 * is updated adding a record that is bound to the congressman ID and the assembly ID and the counter for that
 * Issue type (a, l, m, ...) is incremented.
 *
 * If it is not the primary document, then the `motions` object is incremented on the bases of the document-type
 *
 * @client: fetch congressman (if not present)
 *         fetch all documents by issue
 *         fetch issue
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const incrementAssemblyIssueCount: AppCallback<CongressmanDocument> = async (message, mongo, elasticsearch, client) => {

    if (!message.body.congressman_id) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementAssemblyIssueCount',
            reason: 'no update',
            params: message.body
        });
    }

    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    const documents: Document[] = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);

    if (documents[0].document_id === message.body.document_id) {
        const issue: Issue = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}`);

        const type = {
            [`issues.${issue.type}.type`]:  issue.type,
            [`issues.${issue.type}.category`]: issue.category,
            [`issues.${issue.type}.typeName`]: issue.type_name,
            [`issues.${issue.type}.typeSubName`]: issue.type_subname,
        };

        const counts = {
            [`issues.${issue.type}.count`]: 1,
        };

        return mongo.collection('congressman').updateOne({
            'congressman.congressman_id': message.body.congressman_id,
            'assembly.assembly_id': message.body.assembly_id,
        }, {
            $set: type,
            $inc: counts
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
            }
            return Promise.resolve({
                controller: 'Congressman',
                action: 'incrementAssemblyIssueCount',
                params: message.body
            });
        });
    } else {
        const document: Maybe<Document> = documents.find(doc => doc.document_id === message.body.document_id);
        return mongo.collection('congressman').updateOne({
            'congressman.congressman_id': message.body.congressman_id,
            'assembly.assembly_id': message.body.assembly_id,
        }, {
            $inc: {
                [`motions.${(document && document.type) || 'oflokkad'}`]: 1
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
            }
            return Promise.resolve({
                controller: 'Congressman',
                action: 'incrementAssemblyIssueCount',
                params: message.body
            });
        });
    }
};

/**
 * When ever a Congressman is added to a document and that document is the primary and
 * the Congressman is order:1, then that Issue is added to that Congressman for that Assembly.
 *
 * @client: fetch all documents by issue
 *         fetch congressman (if not present)
 *         fetch issue
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const addProposition: AppCallback<CongressmanDocument> = async (message, mongo, elasticsearch, client) => {

    if (message.body.order !== 1) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addProposition',
            reason: 'no update',
            params: message.body
        });
    }
    if (!message.body.congressman_id) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addProposition',
            reason: 'no update',
            params: message.body
        });
    }

    const documents: Document[] = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);

    if (documents[0].document_id !== message.body.document_id) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addProposition',
            reason: 'no update',
            params: message.body
        });
    }

    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    const issue: Issue = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}`);
    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $addToSet: {
            propositions: issue
        }
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.addProposition(${message.body.assembly_id}, ${message.body.congressman_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addProposition',
            params: message.body
        });
    });
};

/**
 * Whenever a Congressman's session is added this lambda will add it to an array of sessions
 * under the congressman collection under that Assembly.
 *
 * @client: fetch congressman (is not present)
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const addSession: AppCallback<Session> = async (message, mongo, elasticsearch, client) => {
    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    const constituency: Constituency = await client!(`/samantekt/kjordaemi/${message.body.constituency_id}`);
    const party: Party = await client!(`/samantekt/thingflokkar/${message.body.party_id}`);

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $addToSet: {
            constituencies: constituency,
            parties: party,
            sessions:  {
                ...message.body,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: message.body.to ? new Date(`${message.body.to} 00:00:00+00:00`) : null,
            },
        }
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.addSession(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.session_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addSession',
            params: message.body
        });
    });
};

/**
 * Whenever a Congressman's session is updated this lambda will update the item in the `sessions` array that
 * has the given `session_id`.
 * This function will only update the `to` date, it the only real reason for this function to run is to close
 * off a session. The latest session needs to have a `from` date, and will usually not have an `to` date. When
 * it gets updated is to put an `to` date on it
 *
 * @param message
 * @param mongo
 */
export const updateSession: AppCallback<Session> = async (message, mongo) => {
    if (!message.body.to) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'updateSession',
            reason: 'no update',
            params: message.body
        });
    }

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
        'sessions.session_id': message.body.session_id,
    }, {
        $set: {
            'sessions.$.to': new Date(`${message.body.to} 00:00:00+00:00`),
        }
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.updateSession(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.session_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'updateSession',
            params: message.body
        });
    });
};

/**
 * When ever a new VoteItem is created, this lambda will count the types, per each Congressman and Assembly.
 * It will also create all the possible types for a vote and set them to zero.
 *
 * Types are:
 * 'boðaði fjarvist'
 * 'fjarverandi'
 * 'greiðir ekki atkvæði'
 * 'já'
 * 'nei'
 *
 * 'já' and 'nei' are grouped together, as it is irrelevant, we are only interested in if the congressman voted or not.
 *
 * @client: fetch the vote (which is different from the vote_item)
 *          fetch congressman (is not present)
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const incrementVoteTypeCount: AppCallback<VoteItem> = async (message, mongo, elasticsearch, client) => {
    const types = ['boðaði fjarvist', 'fjarverandi', 'greiðir ekki atkvæði', 'já', 'nei'];

    if (types.indexOf(message.body.vote) < 0) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementVoteTypeCount',
            reason: 'no update',
            params: message.body
        });
    }

    const vote: {assembly_id: number} = await client!(`/samantekt/atkvaedi/${message.body.vote_id}`);

    await createNewCongressmanIfNeeded(mongo, client!, vote.assembly_id, message.body.congressman_id);

    const fieldName: {[key: string]: string} = {
        'boðaði fjarvist': 'vote_type.announced_absence',
        'fjarverandi': 'vote_type.absence',
        'greiðir ekki atkvæði': 'vote_type.neutral',
        'já': 'vote_type.partisan',
        'nei': 'vote_type.partisan',
    };

    const values: {[key: string]: number} = Object.assign({}, {
        'vote_type.announced_absence': 0,
        'vote_type.absence': 0,
        'vote_type.neutral': 0,
        'vote_type.partisan': 0,
    }, {
        [fieldName[message.body.vote]]: 1,
    });

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': vote.assembly_id,
    }, {
        $inc: values
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.incrementVoteTypeCount(${vote.assembly_id}, ${message.body.congressman_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementVoteTypeCount',
            params: message.body
        });
    });
};

/**
 * When ever a Document comes in, this lambda will increment a counter based off of the super_type that
 * Issue that this Document belongs to. It doesn't care if the Congressman is the first proponent or not.
 *
 * @client fetch Issue's super categories
 *         fetch congressman (is not present)
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const incrementSuperCategoryCount: AppCallback<CongressmanDocument> = async (message, mongo, elasticsearch, client) => {
    if (!message.body.congressman_id) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            reason: 'no update',
            params: message.body
        });
    }
    const superCategories: Array<{super_category_id: number, title: string}> =
        await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/yfir-malaflokkar`);

    if (!superCategories || superCategories.length === 0) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            reason: 'no update',
            params: message.body
        });
    }

    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    const titleArray = superCategories.reduce((previous: any, current) => {
        return {
            ...previous,
            [`super_categories.${current.super_category_id}.title`]: current.title,
            [`super_categories.${current.super_category_id}.id`]: current.super_category_id,
        }
    }, {});

    const incrementArray = superCategories.reduce((previous: any, current) => {
        return {
            ...previous,
            [`super_categories.${current.super_category_id}.count`]: 1
        };
    }, {});

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $set: titleArray,
        $inc: incrementArray
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.incrementSuperCategoryCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            params: message.body
        });
    });
};

/**
 * When ever a speech is added, this lambda will increment the over all speech time for a give Congressman and a given
 * Assembly based on the super_category of the Issue.
 *
 * @client fetch Issue's super categories
 *         fetch congressman (is not present)
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const incrementSuperCategorySpeechTime: AppCallback<Speech> = async (message, mongo, elasticsearch, client) => {

    await createNewCongressmanIfNeeded(mongo, client!, message.body.assembly_id, message.body.congressman_id);

    const superCategories: Array<{super_category_id: number, title: string}> =
        await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/yfir-malaflokkar`);

    if (superCategories.length === 0) {
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementSuperCategorySpeechTime',
            reason: 'no update',
            params: message.body
        });
    }

    const titleArray = superCategories.reduce((previous: any, current) => {
        return {
            ...previous,
            [`super_categories_speech_time.${current.super_category_id}.title`]: current.title,
            [`super_categories_speech_time.${current.super_category_id}.id`]: current.super_category_id,
        }
    }, {});

    const incrementArray = superCategories.reduce((previous: any, current) => {
        return {
            ...previous,
            // @ts-ignore
            [`super_categories_speech_time.${current.super_category_id}.time`]: (new Date(`${message.body.to}+00:00`) - new Date(`${message.body.from}+00:00`)) / 1000,
        };
    }, {});

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $set: titleArray,
        $inc: incrementArray
    }, {upsert: true}).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.incrementSuperCategorySpeechTime(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.speech_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'incrementSuperCategorySpeechTime',
            params: message.body
        });
    });
};

/**
 * Private function that checks if the Congressman for this Assembly is present, and if not, creates the entry
 * with basic properties.
 *
 * @param mongo
 * @param client
 * @param assemblyId
 * @param congressmanId
 */
const createNewCongressmanIfNeeded = async (mongo: Db, client: HttpQuery, assemblyId: number, congressmanId: number): Promise<InsertOneWriteOpResult|void> => {
    const existingCongressman = await mongo.collection('congressman').findOne({
        'congressman.congressman_id': congressmanId,
        'assembly.assembly_id': assemblyId,
    });

    if (!existingCongressman) {
        const congressman = await client!(
            `/samantekt/thingmenn/${congressmanId}`,
            {loggjafarthing: assemblyId}
        );

        return mongo.collection('congressman').insertOne({
            congressman: congressman,
            assembly: {assembly_id: assemblyId},
            speech_time: 0
        });
    } else {
        return Promise.resolve();
    }
};

/**
 * This lambda will add an item to the `parties` array. This is cor congressman that are Ministers but
 * were not elected to Parliament, they can still be in a party.
 *
 * This adds to the `ministries` array. If the ministry is already present, nothing will be added.
 *
 * This adds to the `ministrySittings` array. It will just push the `message` onto that array.
 *
 * @client fetch Party (if needed)
 *         fetch Ministry
 *
 * @param message
 * @param mongo
 * @param elasticsearch
 * @param client
 */
export const addMinistrySitting: AppCallback<MinisterSitting> = async (message, mongo, elasticsearch, client) => {
    let set = {};

    if (message.body.party_id) {
        const party = await client!(`/samantekt/thingflokkar/${message.body.party_id}`);
        set = Object.assign({}, set, {parties: party});
    }

    const ministry = await client!(`/samantekt/raduneyti/${message.body.ministry_id}`);
    set = Object.assign({}, set, {
        ministries: ministry,
        ministrySittings: {
            ...message.body,
            from: new Date(`${message.body.from}T00:00:00.000Z`),
            to: message.body.to ? new Date(`${message.body.to}T00:00:00.000Z`) : null,
        }
    });

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    }, {
        $addToSet: set
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.addMinistrySitting(${message.body.assembly_id}, ${message.body.congressman_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'addMinistrySitting',
            params: message.body
        });
    });
};

export const updateMinistrySitting: AppCallback<MinisterSitting> = async (message, mongo, elasticsearch, client) => {

    return mongo.collection('congressman').updateOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
        'ministrySittings.minister_sitting_id': message.body.minister_sitting_id
    }, {
        $set: {'ministrySittings.$.to': message.body.to ? new Date(`${message.body.to}T00:00:00.000Z`) : null}
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Congressman.updateMinistrySitting(${message.body.assembly_id}, ${message.body.congressman_id})`);
        }
        return Promise.resolve({
            controller: 'Congressman',
            action: 'updateMinistrySitting',
            params: message.body
        });
    });
};