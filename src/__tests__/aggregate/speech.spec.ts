import {Message, Speech} from "../../../@types";
import MongoMock from "../Mongo";
import {Client as ElasticsearchClient} from '@elastic/elasticsearch';
import ApiServer from "../Server";
import {add, update} from '../../aggregate/speech';
import {Db} from "mongodb";

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/10': {congressman_id: 10}
    });

    beforeAll(async () => {
        await mongo.open('test-speechAdd');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('issue').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Speech> = {
            id: '1-1-1',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                from: '2001-01-01 00:00:00',
                to: '2001-01-01 00:01:00',
                validated: true,
                text: 'text',
                speech_id: '20010101',
                congressman_id: 10,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
            }
        };
        const expected = {
            assembly: {
                assembly_id: 1,
            },
            issue: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
            },
            congressman: {
                congressman_id: 10
            },
            time: 60,
            speech: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                from: new Date('2001-01-01 00:00:00+00:00'),
                to: new Date('2001-01-01 00:01:00+00:00'),
                validated: true,
                text: 'text',
                speech_id: '20010101',
                congressman_id: 10,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
            }

        };

        const response = await add(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('speech').find({}).toArray();

        const {_id, ...rest} = issues[0];

        expect(issues.length).toBe(1);
        expect(rest).toEqual(expected);
        expect(response).toBe('Speech.add(20010101)');
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };
        const message: Message<Speech> = {
            id: '1-1-1',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                from: '2001-01-01 00:00:00',
                to: '2001-01-01 00:01:00',
                validated: true,
                text: 'text',
                speech_id: '20010101',
                congressman_id: 10,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
            }
        };

        try {
            await add(message, (mockDb as unknown as Db), {} as ElasticsearchClient, server);
        } catch (error) {
            expect(error.message).toBe('Speech.add(20010101)');
        }
    })
});

describe('update', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-speechAdd');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('issue').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Speech> = {
            id: '1-1-1',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                from: '2001-01-01 00:00:00',
                to: '2001-01-01 00:01:00',
                validated: false,
                text: 'this is the new text',
                speech_id: '20010101',
                congressman_id: 10,
                congressman_type: 'should not update',
                iteration: 'should not update',
                plenary_id: 3,
                type: 'should not update',
                word_count: 0
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            issue: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
            },
            congressman: {
                congressman_id: message.body.congressman_id
            },
            time: 60,
            speech: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
                from: new Date(`${message.body.from}+00:00`),
                to: new Date(`${message.body.to}+00:00`),
                validated: true,
                text: message.body.text,
                speech_id: message.body.speech_id,
                congressman_id: message.body.congressman_id,
                congressman_type: message.body.congressman_type,
                iteration: message.body.iteration,
                plenary_id: message.body.plenary_id,
                type: message.body.type,
                word_count: message.body.word_count
            }

        };

        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            issue: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
            },
            congressman: {
                congressman_id: message.body.congressman_id
            },
            time: 60,
            speech: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
                from: new Date(`${message.body.from}+00:00`),
                to: new Date(`${message.body.to}+00:00`),
                validated: false,
                text: message.body.text,
                speech_id: message.body.speech_id,
                congressman_id: message.body.congressman_id,
                congressman_type: message.body.congressman_type,
                iteration: message.body.iteration,
                plenary_id: message.body.plenary_id,
                type: message.body.type,
                word_count: message.body.word_count
            }

        };

        await mongo.db!.collection('speech').insertOne(initialState);
        const response = await update(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('speech').find({}).toArray();

        const {_id, ...rest} = issues[0];

        expect(issues.length).toBe(1);
        expect(rest).toEqual(expected);
        expect(response).toBe(`Speech.update(${message.body.speech_id})`);
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };
        const message: Message<Speech> = {
            id: '1-1-1',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                from: '2001-01-01 00:00:00',
                to: '2001-01-01 00:01:00',
                validated: true,
                text: 'text',
                speech_id: '20010101',
                congressman_id: 10,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
            }
        };

        try {
            await update(message, (mockDb as unknown as Db), {} as ElasticsearchClient, server);
        } catch (error) {
            expect(error.message).toBe(`Speech.update(${message.body.speech_id})`);
        }
    })
});
