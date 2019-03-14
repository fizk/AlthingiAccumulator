import {Db} from "mongodb";
import {HttpQuery} from "../../@types";

interface CongressmanDocument {
    document_id: number,
    issue_id: number,
    category: 'A' | 'B',
    assembly_id: number,
    congressman_id: number | null,
    minister: string | null,
    order: number | null
}

interface Document {
    document_id: number,
    issue_id: number,
    category: 'A' | 'B',
    assembly_id: number,
    date: Date,
    url: string | null,
    type: string
}

interface Congressman {
    congressman_id: number,
    name: string,
    birth: Date,
    death: null
}

interface Constituency {
    constituency_id: number,
    name: string,
    abbr_short: string,
    abbr_long: string,
    description: string,
    date: Date
}

interface Party {
    party_id: number,
    name: string,
    abbr_short: string,
    abbr_long: string,
    color: string | null
}

export const createUpdate = (
    message: {body: Document, id: string},
    mongo: Db,
    client: HttpQuery,
    ack: () => void) => {

    Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjalahopar`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/ferill`),
    ]).then(([groups, document, documents, progress]: [Array<{count: number, value: string}>, Document, Document[], any[]]) => {
        return Promise.all([
            mongo.collection('document').updateOne({
                'document.assembly_id': message.body.assembly_id,
                'document.issue_id': message.body.issue_id,
                'document.document_id': message.body.issue_id,
            }, {
                $set: {
                    document: {
                        ...message.body,
                        date: message.body.date && new Date(message.body.date), //@todo timezone issues
                    }
                }
            }, {
                upsert: true
            }),
            mongo.collection('issue')
                .updateOne({
                    'issue.assembly_id': message.body.assembly_id,
                    'issue.issue_id': message.body.issue_id,
                    'issue.category': 'A',
                }, {
                    $set: {
                        date: documents.length > 0 ? new Date(documents[0].date) : null,
                        isGovernmentIssue: documents.some(item => item.type === 'stjórnarfrumvarp'),
                        progress: progress,
                        documents: {
                            documentCategories: groups,
                            documentCount: documents.length,
                        }
                    }
                }, {
                    upsert: true
                })
        ]).then(([documentResult, issueResult]) => {

            if (!documentResult.result.ok) {
                throw new Error(`Could not create/update document.documents [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id}]`);
            }
            if (!issueResult.result.ok) {
                throw new Error(`Could not create/update issue.documents [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id}]`);
            }

            ack();

            console.log(`issue.document [${message.body.assembly_id}, ${message.body.issue_id}, A] created/updated`);
            console.log(`document.document [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id}] created/updated`);
        });
    });

};

export const createUpdateCongressmanDocument = async (
    message: {body: CongressmanDocument, id: string},
    mongo: Db,
    client: HttpQuery,
    ack: () => void) => {


    const documents: {current: Document, all: Document[]} = await Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
    ]).then(([current, all]) => ({current, all}));

    const congressman: {congressman: Congressman, constituency: Constituency, party: Party} = await Promise.all([
        client(`/samantekt/thingmenn/${message.body.congressman_id}`),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/kjordaemi`, {dags: documents.current.date}),
        client(`/samantekt/thingmenn/${message.body.congressman_id}/thingflokkar`, {dags: documents.current.date}),
    ]).then(([congressman, constituency, party]) => ({congressman, constituency, party}));


    //
    await mongo.collection('document').updateOne({
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.issue_id,
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
    });

    // Is this document the initial document,
    // ..and is this the proponent for this document?
    if (documents.all && documents.all[0] && documents.all[0].document_id === message.body.document_id && message.body.order === 1) {
        await mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {proponent: congressman}
            }, {
                upsert: true
            })
    }

    // Is this document the initial document?
    if (documents.all && documents.all[0] && documents.all[0].document_id === message.body.document_id) {
        const proponentsCount: number = await client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}/thingmenn`);

        await mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {proponentCount: proponentsCount}
            }, {
                upsert: true
            });
    }

    // Can I give the Issue a date
    if (documents.all && documents.all[0] && documents.all[0].document_id === message.body.document_id) {
        await mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {date: documents.all[0].date}
            }, {
                upsert: true
            });
    }

    ack();
    console.log(`document.congressman [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id}, ${message.body.congressman_id}] created/updated`);
};
