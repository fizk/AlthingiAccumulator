import {MongoClient} from 'mongodb';
import {addProponentCountIssue, addProponentDocument, addProponentIssue} from '../../actions/document-congressman'
import {CongressmanDocument, Issue, Message} from "../../../@types";

const mongoURL = `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
const mongoOptions = {
    useNewUrlParser: true,
    // auth: {user: '', password: ''}
};

const HttpQuery = (url: string, query?: {[key: string]: string | number | Date | null}) => {
    const map: any = {
        '/samantekt/loggjafarthing/148/thingmal/2/thingskjol/1': {
            document_id: 1,
            issue_id: 2,
            category: "A",
            assembly_id: 148,
            date: "2017-12-14 16:03:00",
            url: "http://www.althingi.is/altext/148/s/0001.html",
            type: "stjórnarfrumvarp"
        },
        '/samantekt/loggjafarthing/148/thingmal/2/thingskjol': [{
            document_id: 1,
            issue_id: 2,
            category: "A",
            assembly_id: 148,
            date: "2017-12-14 16:03:00",
            url: "http://www.althingi.is/altext/148/s/0001.html",
            type: "stjórnarfrumvarp"
        },{
            document_id: 2,
            issue_id: 2,
            category: "A",
            assembly_id: 148,
            date: "2017-12-14 16:03:00",
            url: "http://www.althingi.is/altext/148/s/0001.html",
            type: "type"
        }],
        '/samantekt/thingmenn/652': {
            congressman_id: 652,
            name: 'string',
            birth: '2017-12-14 16:03:00',
            death: null
        },
        '/samantekt/thingmenn/652/kjordaemi': {
            constituency_id: 1,
            name: 'string',
            abbr_short: 'string',
            abbr_long: 'string',
            description: 'string',
            date: "2017-12-14 16:03:00",
        },
        '/samantekt/thingmenn/652/thingflokkar':{
            party_id: 1,
            name: 'string',
            abbr_short: 'string',
            abbr_long: 'string',
            color: null
        },
        '/samantekt/loggjafarthing/148/thingmal/2/thingskjol/1/thingmenn': 2
    };

    return Promise.resolve(map[url])
};

describe('addProponentDocument', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<CongressmanDocument> = {
            "id": "101-1-1",
            "body": {
                "document_id": 1,
                "issue_id": 2,
                "category": "A",
                "assembly_id": 148,
                "congressman_id": 652,
                "minister": "fjármálaráðherra",
                "order": 1
            }
        };
        await addProponentDocument(message, mongo.db('althingi-test'), HttpQuery);

        const document = await mongo.db('althingi-test').collection('document').findOne({
            'document.assembly_id': message.body.assembly_id,
            'document.issue_id': message.body.issue_id,
            'document.document_id': message.body.document_id,
        });

        expect(document.proponents.length).toBe(1);
        expect(document.proponents[0].hasOwnProperty('congressman')).toBe(true);
        expect(document.proponents[0].order).toBe(1);
        expect(document.proponents[0].hasOwnProperty('minister')).toBe(true);
    })
});

describe('addProponentIssue', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<CongressmanDocument> = {
            "id": "101-1-1",
            "body": {
                "document_id": 1,
                "issue_id": 2,
                "category": "A",
                "assembly_id": 148,
                "congressman_id": 652,
                "minister": "fjármálaráðherra",
                "order": 1
            }
        };
        await addProponentIssue(message, mongo.db('althingi-test'), HttpQuery);

        const issue = await mongo.db('althingi-test').collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.proponent.hasOwnProperty('congressman')).toBe(true);
        expect(issue.proponent.hasOwnProperty('constituency')).toBe(true);
        expect(issue.proponent.hasOwnProperty('party')).toBe(true);
    })
});

describe('addProponentCountIssue', () => {
    let mongo: MongoClient;

    beforeAll(async () => {
        mongo = await MongoClient.connect(mongoURL, mongoOptions);
    });

    afterAll(async () => {
        await mongo.db('althingi-test').dropDatabase();
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<CongressmanDocument> = {
            "id": "101-1-1",
            "body": {
                "document_id": 1,
                "issue_id": 2,
                "category": "A",
                "assembly_id": 148,
                "congressman_id": 652,
                "minister": "fjármálaráðherra",
                "order": 1
            }
        };
        await addProponentCountIssue(message, mongo.db('althingi-test'), HttpQuery);

        const issue = await mongo.db('althingi-test').collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.proponentCount).toBe(2);
    })
});
