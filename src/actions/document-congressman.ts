import {CongressmanDocument, AppCallback} from "../../@types";

/**
 * Adds a congressman to a document as a proponent.
 *
 * @client: fetch document
 *         fetch congressman
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponentDocument: AppCallback<CongressmanDocument> = async (message, mongo, client) => {

    const document = await client!(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.category}/${message.body.issue_id}/thingskjol/${message.body.document_id}`);
    const congressman = await client!(`/samantekt/thingmenn/${message.body.congressman_id}`, {dags: document.date});

    return mongo.collection('document').updateOne({
        'assembly.assembly_id': message.body.assembly_id,
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.document_id,
        'document.category': message.body.category,
    }, {
        $addToSet: {
            proponents: {
                congressman: congressman,
                order: message.body.order,
                minister: message.body.minister
            }
        }
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }
        return `DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
    });
};
