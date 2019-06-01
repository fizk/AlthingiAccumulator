import {AppCallback, CongressmanDocument, Issue, Speech, Document} from "../../@types";

/**
 * Increment speech times for a Congressman in an Assembly.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const incrementAssemblySpeechTime: AppCallback<Speech> = async (message, mongo, client) => {
    const existingCongressman = await mongo.collection('congressman').findOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    });

    if (!existingCongressman) {
        const congressman = await client!(
            `/samantekt/thingmenn/${message.body.congressman_id}`,
            {loggjafarthing: message.body.assembly_id}
        );

        await mongo.collection('congressman').insertOne({
            congressman: congressman,
            assembly: {assembly_id: message.body.assembly_id},
            speech_time: 0
        });
    }

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
        return Promise.resolve(`Congressman.incrementAssemblySpeechTime(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.speech_id})`)
    });
};

/**
 * When a proponent is added to an issue (if that congressman is on the primary document), the congressman collection
 * is updated adding a record that is bound to the congressman ID and the assembly ID and the counter for that
 * Issue type (a, l, m, ...) is incremented.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const incrementAssemblyIssueCount: AppCallback<CongressmanDocument> = async (message, mongo, client) => {

    const existingCongressman = await mongo.collection('congressman').findOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    });

    if (!existingCongressman) {
        const congressman = await client!(
            `/samantekt/thingmenn/${message.body.congressman_id}`,
            {loggjafarthing: message.body.assembly_id}
        );

        await mongo.collection('congressman').insertOne({
            congressman: congressman,
            assembly: {assembly_id: message.body.assembly_id},
            issues: {}
        });
    }

    const documents: Document[] = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);

    if (documents[0].document_id === message.body.document_id) {
        const issue: Issue = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}`);
        return mongo.collection('congressman').updateOne({
            'congressman.congressman_id': message.body.congressman_id,
            'assembly.assembly_id': message.body.assembly_id,
        }, {
            $inc: {
                [`issues.${issue.type}`]: 1,
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
            }
            return Promise.resolve(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`)
        });
    } else {
        return Promise.resolve('Congressman.incrementAssemblyIssueCount no update');
    }
};

/**
 * When ever a Congressman is added to a document and that document is the primary and
 * the Congressman is order:1, then that Issue is added to that Congressman for that Assembly.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProposition: AppCallback<CongressmanDocument> = async (message, mongo, client) => {

    if (message.body.order !== 1) {
        return Promise.resolve('Congressman.addProposition no update');
    }

    const documents: Document[] = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol`);

    if (documents[0].document_id !== message.body.document_id) {
        return Promise.resolve('Congressman.addProposition no update');
    }

    const existingCongressman = await mongo.collection('congressman').findOne({
        'congressman.congressman_id': message.body.congressman_id,
        'assembly.assembly_id': message.body.assembly_id,
    });

    if (!existingCongressman) {
        const congressman = await client!(
            `/samantekt/thingmenn/${message.body.congressman_id}`,
            {loggjafarthing: message.body.assembly_id}
        );

        await mongo.collection('congressman').insertOne({
            congressman: congressman,
            assembly: {assembly_id: message.body.assembly_id},
        });
    }

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
        return Promise.resolve(`Congressman.addProposition(${message.body.assembly_id}, ${message.body.congressman_id})`)
    });
};
