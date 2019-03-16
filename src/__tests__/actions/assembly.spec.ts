import {Assembly, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {add} from '../../actions/assembly';

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('assembly-add');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Assembly> = {
            id: '1',
            body: {
                assembly_id: 2,
                to: '2001-01-01',
                from: '2002-01-01',
            }
        };
        await add(message, mongo.db!, server);

        const assemblies = await mongo.db!.collection('assembly').find({}).toArray();

        expect(assemblies.length).toBe(1);
        expect(assemblies[0].hasOwnProperty('assembly')).toBeTruthy();
    })
});
