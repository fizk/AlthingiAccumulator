import {Document, Vote, AppCallback} from "../../@types";

/**
 * When a document is created, this Lambda stores it in MongoDB.
 *
 * @param message
 * @param mongo
 */
export const add: AppCallback<Document> = (message, mongo) => {
    return mongo.collection('document').updateOne({
        'assembly.assembly_id': message.body.assembly_id,
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.document_id,
        'document.category': message.body.category,
    }, {
        $set: {
            votes: [],
            document: {
                ...message.body,
                date: (message.body.date && new Date(`${message.body.date}+00:00`)) || null,
            }
        }
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Document.addDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }
        // return `Document.addDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
        return Promise.resolve({
            controller: 'Document',
            action: 'add',
            params: message.body
        });
    });
};

/**
 *
 * @param message
 * @param mongo
 */
export const addVote: AppCallback<Vote> = (message, mongo) => {
    return mongo.collection('document').updateOne({
        'assembly.assembly_id': message.body.assembly_id,
        'document.assembly_id': message.body.assembly_id,
        'document.issue_id': message.body.issue_id,
        'document.document_id': message.body.document_id,
        'document.category': message.body.category,
    }, {
        $addToSet: {
            votes: {
                ...message.body,
                date: (message.body.date && new Date(`${message.body.date}+00:00`)) || null,
            }
        }
    }, {
        upsert: true
    }).then(result => {
        if (!result.result.ok) {
            throw new Error(`Document.addVote(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }
        // return `Document.addVote(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`;
        return Promise.resolve({
            controller: 'Document',
            action: 'addVote',
            params: message.body
        });
    });
};
