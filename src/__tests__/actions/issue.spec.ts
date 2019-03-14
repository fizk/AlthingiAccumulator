import {MongoClient} from 'mongodb';
import {addIssue, addProgressToIssue} from '../../actions/issue'
import {Issue} from "../../../@types";

const mongoURL = `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
const mongoOptions = {
    useNewUrlParser: true,
    // auth: {user: '', password: ''}
};

const HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => {
    const map: any = {

        '/samantekt/loggjafarthing/2/thingmal/1/ferill': [
            {
                assembly_id: 2,
                issue_id: 1,
                committee_id: null,
                speech_id:  null,
                document_id: null,
                date: null,
                title: null,
                type: null,
                committee_name: null,
                completed: null,
            }
        ],
    };

    return Promise.resolve(map[url])
};

describe('addIssue', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: {id: string, body: Issue} = {
            id: '1-1-1',
            body: {
                issue_id: 1,
                assembly_id: 2,
                congressman_id: 3,
                category: 'A',
                name: 'string',
                sub_name: 'string',
                type: 'string',
                type_name: 'string',
                type_subname: 'string',
                status: 'string | null',
                question: 'string | null',
                goal: 'string | null',
                major_changes: 'string | null',
                changes_in_law: 'string | null',
                costs_and_revenues: 'string | null',
                deliveries: 'string | null',
                additional_information: 'string | null',
            }
        };
        await addIssue(message, mongo.db('althingi-test'), HttpQuery);

        const issues = await mongo.db('althingi-test').collection('issue').find({}).toArray();

        expect(issues.length).toBe(1);
        expect(issues[0].hasOwnProperty('issue')).toBeTruthy();
    })
});

describe('addProgressToIssue', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: {id: string, body: Issue} = {
            id: '1-1-1',
            body: {
                issue_id: 1,
                assembly_id: 2,
                congressman_id: 3,
                category: 'A',
                name: 'string',
                sub_name: 'string',
                type: 'string',
                type_name: 'string',
                type_subname: 'string',
                status: 'string | null',
                question: 'string | null',
                goal: 'string | null',
                major_changes: 'string | null',
                changes_in_law: 'string | null',
                costs_and_revenues: 'string | null',
                deliveries: 'string | null',
                additional_information: 'string | null',
            }
        };
        await addProgressToIssue(message, mongo.db('althingi-test'), HttpQuery);

        const issue = await mongo.db('althingi-test').collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.progress.length).toBe(1);
    })
});
