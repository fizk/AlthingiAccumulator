import {Document, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {addDocument, addDocumentToIssue} from '../../actions/document';

describe('addDocument', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('document-addDocument');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Document> = {
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
        await addDocument(message, mongo.db!, server);
        const issues = await mongo.db!.collection('document').find({}).toArray();

        expect(issues.length).toBe(1);
    });
});

describe('addDocumentToIssue', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
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
    });

    beforeAll(async () => {
        await mongo.open('document-addDocumentToIssue');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Document> = {
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
        await addDocumentToIssue(message, mongo.db!, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues.length).toBe(1);

        expect(issues[0].date.toISOString()).toEqual(new Date('2001-01-01').toISOString());
        expect(issues[0].documents).toEqual({documentCategories: [{count: 1,value: 'string'}],documentCount: 2});
        expect(issues[0].issue).toEqual({assembly_id: 3,category: 'A',issue_id: 2});
        expect(issues[0].isGovernmentIssue).toBe(true);

    });
});
