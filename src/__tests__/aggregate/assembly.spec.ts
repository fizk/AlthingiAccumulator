import {Assembly, Message} from "../../../@types";
import MongoMock from "../Mongo";
import {Client as ElasticsearchClient} from '@elastic/elasticsearch';
import ApiServer from "../Server";
import {add, update} from '../../aggregate/assembly';

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-add');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('assembly').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Assembly> = {
                id: '101-1-1',
                index: '',
                body: {
                    assembly_id: 1,
                    from: '2001-01-01',
                    to: '2001-01-01',
                }
            };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
                from: new Date(`${message.body.from} 00:00+00:00`),
                to: new Date(`${message.body.to} 00:00+00:00`),
            },
        };

        const response = await add(message, mongo.db!, {} as ElasticsearchClient, server);
        const assembly = await mongo.db!.collection('assembly').find({}).toArray();

        const {_id, ...rest} = assembly[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'add',
            controller: 'Assembly',
            params: message.body
        });
    });
});

describe('update', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-add');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('assembly').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Assembly> = {
                id: '101-1-1',
                index: '',
                body: {
                    assembly_id: 1,
                    from: '2001-01-01',
                    to: '2001-01-01',
                }
            };
        const initialState = {
            assembly: {
                assembly_id: 1,
                from: new Date(`${message.body.from} 00:00+00:00`),
                to: null,
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
                from: new Date(`${message.body.from} 00:00+00:00`),
                to: new Date(`${message.body.to} 00:00+00:00`),
            },
        };

        await mongo.db!.collection('assembly').insertOne(initialState);
        const response = await update(message, mongo.db!, {} as ElasticsearchClient, server);
        const assembly = await mongo.db!.collection('assembly').find({}).toArray();

        const {_id, ...rest} = assembly[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'update',
            controller: 'Assembly',
            params: message.body
        });
    });
});
