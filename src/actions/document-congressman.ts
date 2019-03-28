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
 * If document is the initial document, add the proponents to the Issue
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addProponentIssue = async (message: Message<CongressmanDocument>, mongo: Db, client: HttpQuery): Promise<any> => {
    const documents: {current: Document, all: Document[], congressmen: CongressmanDocument[]} = await Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}/thingmenn`),
    ]).then(([current, all, congressmen]) => ({current, all, congressmen}));

    if (documents.all && documents.all[0] && documents.all[0].document_id === message.body.document_id) {
        return await Promise.all(documents.congressmen.map(congressmanDocument => {
            return Promise.all([
                client(`/samantekt/thingmenn/${congressmanDocument.congressman_id}`),
                client(`/samantekt/thingmenn/${congressmanDocument.congressman_id}/kjordaemi`, {dags: documents.current.date}),
                client(`/samantekt/thingmenn/${congressmanDocument.congressman_id}/thingflokkar`, {dags: documents.current.date}),
                congressmanDocument,
            ])
        })).then(all => all.map(([congressman, constituency, party, document]) => ({congressman, constituency, party, document})))
            .then(proponents => {
                return mongo.collection('issue')
                    .updateOne({
                        'issue.assembly_id': message.body.assembly_id,
                        'issue.issue_id': message.body.issue_id,
                        'issue.category': message.body.category,
                    }, {
                        $set: {proponents: proponents.slice().sort((first, second) => (first.document.order || 0) - (second.document.order || 0))}
                    }, {
                        upsert: true
                    }).then(result => {
                        if (!result.result.ok) {
                            throw new Error(`ERROR: DocumentCongressman.addProponentIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
                        }
                        return `DocumentCongressman.addProponentIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
                    });
            });
    }

    return Promise.resolve(`DocumentCongressman.addProponentIssue: no-action`);
};
