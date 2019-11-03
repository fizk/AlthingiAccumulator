import {CongressmanDocument, Message} from "../../../@types";
import MongoMock from "../Mongo";
import {Client as ElasticsearchClient} from '@elastic/elasticsearch';
import ApiServer from "../Server";
import {addProponentDocument} from '../../aggregate/document-congressman'
import {Db} from "mongodb";

describe('addProponentDocument', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/148/thingmal/A/2/thingskjol/1': {
            document_id: 1,
            issue_id: 2,
            category: "A",
            assembly_id: 148,
            date: "2017-12-14 16:03:00",
            url: "http://www.althingi.is/altext/148/s/0001.html",
            type: "stjórnarfrumvarp"
        },
        '/samantekt/thingmenn/652': {
            congressman_id: 652,
            name: 'string',
            birth: '2017-12-14 16:03:00',
            death: null
        },
    });

    beforeAll(async () => {
        await mongo.open('test-documentCongressmanAddProponentDocument');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('document').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<CongressmanDocument> = {
            id: '101-1-1',
            index: '',
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
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            document: {
                document_id: message.body.document_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
                assembly_id: message.body.assembly_id,
            },
            proponents: [{
                congressman: {
                    congressman_id: message.body.congressman_id,
                    name: 'string',
                    birth: '2017-12-14 16:03:00',
                    death: null
                },
                order: message.body.order,
                minister: message.body.minister,
            }]
        };
        const response = await addProponentDocument(message, mongo.db!, {} as ElasticsearchClient, server);
        const document = await mongo.db!.collection('document').findOne({
            'assembly.assembly_id': message.body.assembly_id,
            'document.assembly_id': message.body.assembly_id,
            'document.issue_id': message.body.issue_id,
            'document.document_id': message.body.document_id,
        });

        const {_id, ...rest} = document;

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            controller: 'DocumentCongressman',
            action: 'addProponentDocument',
            params: message.body,
        });
    });

    test('fail', async () => {
        const message: Message<CongressmanDocument> = {
            id: '101-1-1',
            index: '',
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
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };

        try {
            await addProponentDocument(message, (mockDb as unknown as Db), {} as ElasticsearchClient, server);
        } catch (error) {
            expect(error.message).toBe(`DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }

    });
});
