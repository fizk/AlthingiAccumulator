import {CongressmanDocument, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {addProponentDocument, addProponentIssue} from '../../actions/document-congressman'

describe('addProponentDocument', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
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
    });

    beforeAll(async () => {
        await mongo.open('document-congressman-addProponentDocument');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<CongressmanDocument> = {
            id: '101-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: "A",
                assembly_id: 148,
                congressman_id: 652,
                minister: "fjármálaráðherra",
                order: 1
            }
        };
        await addProponentDocument(message, mongo.db!, server);

        const document = await mongo.db!.collection('document').findOne({
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
    const mongo = new MongoMock();
    const server = ApiServer({
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
    });

    beforeAll(async () => {
        await mongo.open('document-congressman-addProponentIssue');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<CongressmanDocument> = {
            id: '101-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 148,
                congressman_id: 652,
                minister: 'fjármálaráðherra',
                order: 1
            }
        };
        await addProponentIssue(message, mongo.db!, server);

        const issue = await mongo.db!.collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.proponent.hasOwnProperty('congressman')).toBe(true);
        expect(issue.proponent.hasOwnProperty('constituency')).toBe(true);
        expect(issue.proponent.hasOwnProperty('party')).toBe(true);
    })
});
