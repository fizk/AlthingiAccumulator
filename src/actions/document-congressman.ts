import {Db} from "mongodb";
import {Congressman, CongressmanDocument, Constituency, HttpQuery, Party, Document, Message} from "../../@types";

/**
 * Adds a congressman to a document as a proponent.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponentDocument = async (message: Message<CongressmanDocument>, mongo: Db, client: HttpQuery): Promise<any> => {

    const documents: {current: Document, all: Document[]} = await Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
    ]).then(([current, all]) => ({current, all}));

    const congressman: {congressman: Congressman, constituency: Constituency, party: Party} = await Promise.all([
        client(`/samantekt/thingmenn/${message.body.congressman_id}`),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/kjordaemi`, {dags: documents.current.date}),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/thingflokkar`, {dags: documents.current.date}),
    ]).then(([congressman, constituency, party]) => ({congressman, constituency, party}));

    return mongo.collection('document').updateOne({
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.document_id,
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
            throw new Error(`ERROR: DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category} ${message.body.document_id})`);
        }
        return `DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
    });
};

/**
 * If document is the initial document and the congressman is the first proponent, then add him/her to the Issue
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponentIssue = async (message: Message<CongressmanDocument>, mongo: Db, client: HttpQuery): Promise<any> => {
    const documents: {current: Document, all: Document[]} = await Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
    ]).then(([current, all]) => ({current, all}));

    const congressman: {congressman: Congressman, constituency: Constituency, party: Party} = await Promise.all([
        client(`/samantekt/thingmenn/${message.body.congressman_id}`),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/kjordaemi`, {dags: documents.current.date}),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/thingflokkar`, {dags: documents.current.date}),
    ]).then(([congressman, constituency, party]) => ({congressman, constituency, party}));

    if (documents.all && documents.all[0] && documents.all[0].document_id === message.body.document_id && message.body.order === 1) {
        return mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {proponent: congressman}
            }, {
                upsert: true
            }).then(result => {
                if (!result.result.ok) {
                    throw new Error(`ERROR: DocumentCongressman.addProponentIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
                }
                return `DocumentCongressman.addProponentIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
            });
    }

    return Promise.resolve(`DocumentCongressman.addProponentIssue: no-action`);
};

/**
 * When ever a proponent is added to a document, if it's the initial one, then we can update the proponent's count
 * on the Issue
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponentCountIssue = async (message: Message<CongressmanDocument>, mongo: Db, client: HttpQuery): Promise<any> => {
    return Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}/thingmenn`)
    ]).then(async ([document, documents, count]) => {

        if (documents[0] && documents[0].document_id === message.body.document_id) {
            return mongo.collection('issue')
                .updateOne({
                    'issue.assembly_id': message.body.assembly_id,
                    'issue.issue_id': message.body.issue_id,
                    'issue.category': message.body.category,
                }, {
                    $set: {proponentCount: count}
                }, {
                    upsert: true
                }).then(result => {
                    if (!result.result.ok) {
                        throw new Error(`ERROR: DocumentCongressman.addProponentCountIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
                    }
                    return `DocumentCongressman.addProponentCountIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
                });
        }
        return Promise.resolve(`DocumentCongressman.addProponentCountIssue: no-action`);
    });
};
