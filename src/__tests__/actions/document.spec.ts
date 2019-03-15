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
