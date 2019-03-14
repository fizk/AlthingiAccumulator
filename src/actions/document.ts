import {Db} from "mongodb";
import {HttpQuery, Document, Message} from "../../@types";

/**
 * When a document is created, this Lambda stores it in MongoDB.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addDocument = (message: Message<Document>, mongo: Db, client: HttpQuery): Promise<any> => {
    return mongo.collection('document').updateOne({
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.document_id,
        'document.category': message.body.category,
    }, {
        $set: {
            document: {
                ...message.body,
                date: message.body.date && new Date(message.body.date), //@todo timezone issues
            }
        }
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`ERROR: Document.addDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }
        return `Document.addDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
    });
};

/**
 * When a document is added, we can add some stats to Issue.
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addDocumentToIssue = (message: Message<Document>, mongo: Db, client: HttpQuery): Promise<any> => {
    return Promise.all([
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjalahopar`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol/${message.body.document_id}`),
        client(`/samantekt/loggjafarthing/${message.body.assembly_id}/thingmal/${message.body.issue_id}/thingskjol`),
    ]).then(([groups, document, documents]: [Array<{count: number, value: string}>, Document, Document[]]) => {

        return mongo.collection('issue')
            .updateOne({
                'issue.assembly_id': message.body.assembly_id,
                'issue.issue_id': message.body.issue_id,
                'issue.category': message.body.category,
            }, {
                $set: {
                    date: documents.length > 0 ? new Date(documents[0].date) : null,
                    isGovernmentIssue: documents.some(item => item.type === 'stjórnarfrumvarp'),
                    documents: {
                        documentCategories: groups,
                        documentCount: documents.length,
                    }
                }
            }, {
                upsert: true
            }).then(result => {
                if (!result.result.ok) {
                    throw new Error(`ERROR: Document.addDocumentToIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
                }
                return `Document.addDocumentToIssue(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
            });
    });
};
