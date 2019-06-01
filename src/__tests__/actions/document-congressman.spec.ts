import {CongressmanDocument, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {addProponentDocument} from '../../actions/document-congressman'
import {Db} from "mongodb";

describe('addProponentDocument', () => {
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
        await mongo.open('document-congressman-addProponentDocument');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('success', async () => {

        const expected = {
            document: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 148,
            },
            proponents: [{
                congressman: {
                    congressman_id: 652,
                    name: 'string',
                    birth: '2017-12-14 16:03:00',
                    death: null
                },
                order: 1,
                minister: 'fjármálaráðherra'
            }]
        };
        const response = await addProponentDocument(message, mongo.db!, server);

        const document = await mongo.db!.collection('document').findOne({
            'document.assembly_id': message.body.assembly_id,
            'document.issue_id': message.body.issue_id,
            'document.document_id': message.body.document_id,
        });

        const {_id, ...rest} = document;
        expect(response).toBe(`DocumentCongressman.addProponentDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        expect(rest).toEqual(expected);
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };

        try {
            await addProponentDocument(message, (mockDb as unknown as Db), server);
        } catch (error) {
            expect(error.message).toBe('DocumentCongressman.addProponentDocument(148, 2, A 1)');
        }

    });
});
