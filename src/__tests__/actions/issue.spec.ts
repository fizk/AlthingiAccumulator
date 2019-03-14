import {MongoClient} from 'mongodb';
import {createUpdate} from '../../actions/issue'
import {Issue} from "../../../@types";

const mongoURL = `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
const mongoOptions = {
    useNewUrlParser: true,
    // auth: {user: '', password: ''}
};


const HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => {
    return Promise.resolve({})
};

describe('test', () => {
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

        await createUpdate(message, mongo.db('althingi-test'), HttpQuery, () => {});

        const fetch = await mongo.db('althingi-test').collection('issue').find({}).toArray();

        expect(fetch.length).toBe(1);
    })


});
