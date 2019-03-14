import {MongoClient} from 'mongodb';
import {addDocument, addDocumentToIssue} from '../../actions/document';
import {Document} from "../../../@types";

const mongoURL = `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
const mongoOptions = {
    useNewUrlParser: true,
    // auth: {user: '', password: ''}
};
const HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => {
    const map: any = {
        '/samantekt/loggjafarthing/3/thingmal/2/thingskjalahopar': [
            {count: 1, value: 'string'}
        ],
        '/samantekt/loggjafarthing/3/thingmal/2/thingskjol/1': {
            document_id: 1,
            issue_id: 2,
            category: 'A',
            assembly_id: 3,
            date: '2001-01-01',
            url: 'string | null',
            type: 'string',
        },
        '/samantekt/loggjafarthing/3/thingmal/2/thingskjol': [
            {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-01',
                url: 'string | null',
                type: 'stjórnarfrumvarp',
            },
            {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-02',
                url: 'string | null',
                type: 'string',
            }
        ],
    };

    return Promise.resolve(map[url])
};

describe('addDocument', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: {id: string, body: Document} = {
            id: '1-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-01',
                url: 'string | null',
                type: 'string',
            }
        };
        const result = await addDocument(message, mongo.db('althingi-test'), HttpQuery);
        const issues = await mongo.db('althingi-test').collection('document').find({}).toArray();

        expect(issues.length).toBe(1);
    });
});

describe('addDocumentToIssue', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: {id: string, body: Document} = {
            id: '1-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-01',
                url: 'string | null',
                type: 'string',
            }
        };
        await addDocumentToIssue(message, mongo.db('althingi-test'), HttpQuery);
        const issues = await mongo.db('althingi-test').collection('issue').find({}).toArray();

        expect(issues.length).toBe(1);

        expect(issues[0].date.toISOString()).toEqual(new Date('2001-01-01').toISOString());
        expect(issues[0].documents).toEqual({documentCategories: [{count: 1,value: 'string'}],documentCount: 2});
        expect(issues[0].issue).toEqual({assembly_id: 3,category: 'A',issue_id: 2});
        expect(issues[0].isGovernmentIssue).toBe(true);

    });
});

















// describe('createUpdate', () => {
//     let mongo: MongoClient;
//
//     beforeAll(async () => {
//         mongo = await MongoClient.connect(mongoURL, mongoOptions);
//     });
//
//     afterAll(async () => {
//         await mongo.db('althingi-test').dropDatabase();
//         await mongo.close();
//     });
//
//     test('success', async () => {
//         const message: {id: string, body: Document} = {
//             id: '1-1-1',
//             body: {
//                 document_id: 1,
//                 issue_id: 2,
//                 category: 'A',
//                 assembly_id: 3,
//                 date: '2001-01-01',
//                 url: 'string | null',
//                 type: 'string',
//             }
//         };
//
//         const result = await createUpdate(message, mongo.db('althingi-test'), HttpQuery, () => {});
//
//         const document = await mongo.db('althingi-test').collection('document').findOne({
//             'document.assembly_id': message.body.assembly_id,
//             'document.issue_id': message.body.issue_id,
//             'document.document_id': message.body.document_id,
//         });
//
//         const issue = await mongo.db('althingi-test').collection('issue').findOne({
//             'issue.assembly_id': message.body.assembly_id,
//             'issue.issue_id': message.body.issue_id,
//             'issue.category': 'A',
//         });
//
//
//         expect(document.hasOwnProperty('document')).toBe(true);
//         expect(document.document.date.toISOString()).toBe(new Date('2001-01-01').toISOString());
//
//         expect(issue.date.toISOString()).toBe(new Date('2001-01-01').toISOString());
//         expect(issue.isGovernmentIssue).toBe(true);
//         expect(issue.progress.length).toBe(1);
//         expect(issue.documents.documentCount).toBe(2);
//
//     })
// });
