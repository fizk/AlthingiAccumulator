import {Message, Vote, VoteItem} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {add, addItem} from '../../actions/vote';
import {Db} from "mongodb";

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/10': {congressman_id: 10}
    });

    beforeAll(async () => {
        await mongo.open('test-voteAdd');
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
        const message: Message<Vote> = {
            id: '1-1-1',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                vote_id: 4,
                type: 'type',
                outcome: 'outcome',
                method: 'method',
                yes: 10,
                no: 20,
                inaction: 30,
                committee_to: 'committee_to',
                date: '2001-01-01 00:00'
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            vote: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                document_id: message.body.document_id,
                category: message.body.category,
                vote_id: message.body.vote_id,
                type: message.body.type,
                outcome: message.body.outcome,
                method: message.body.method,
                yes: message.body.yes,
                no: message.body.no,
                inaction: message.body.inaction,
                committee_to: message.body.committee_to,
                date: new Date(`${message.body.date}+00:00`)
            },
            votes: []
        };

        const response = await add(message, mongo.db!, server);
        const issues = await mongo.db!.collection('vote').find({}).toArray();

        const {_id, ...rest} = issues[0];

        expect(issues.length).toBe(1);
        expect(rest).toEqual(expected);
        expect(response).toBe(`Vote.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id})`);
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };
        const message: Message<Vote> = {
            id: '1-1-1',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                vote_id: 4,
                type: 'type',
                outcome: 'outcome',
                method: 'method',
                yes: 10,
                no: 20,
                inaction: 30,
                committee_to: 'committee_to',
                date: '2001-01-01 00:00'
            }
        };

        try {
            await add(message, (mockDb as unknown as Db), server);
        } catch (error) {
            expect(error.message).toBe(`Vote.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id})`);
        }
    })
});

describe('addItem', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/atkvaedi/4': {
            assembly_id: 1,
            issue_id: 2,
            document_id: 3,
            category: 'A',
        },
        '/samantekt/thingmenn/3': {
            congressman_id: 3
        }
    });

    beforeAll(async () => {
        await mongo.open('test-voteItem');
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
        const message: Message<VoteItem> = {
            id: '1-1-1',
            body: {
                vote_id: 4,
                vote_item_id: 2,
                congressman_id: 3,
                vote: 'ja'
            }
        };
        const expected = {
            assembly: {
                assembly_id: 1,
            },
            vote: {
                assembly_id: 1,
                issue_id: 2,
                document_id: 3,
                category: 'A',
                vote_id: 4,
            },
            votes: [{
                vote: {
                    vote_id: message.body.vote_id,
                    vote_item_id: message.body.vote_item_id,
                    congressman_id: message.body.congressman_id,
                    vote: message.body.vote
                },
                congressman: {
                    congressman_id: message.body.congressman_id,
                }
            }]
        };

        const response = await addItem(message, mongo.db!, server);
        const issues = await mongo.db!.collection('vote').find({}).toArray();

        const {_id, ...rest} = issues[0];

        expect(issues.length).toBe(1);
        expect(rest).toEqual(expected);
        expect(response).toBe(`Vote.addItem(${message.body.vote_id})`);
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };
        const message: Message<VoteItem> = {
            id: '1-1-1',
            body: {
                vote_id: 4,
                vote_item_id: 2,
                congressman_id: 3,
                vote: 'ja'
            }
        };

        try {
            await addItem(message, (mockDb as unknown as Db), server);
        } catch (error) {
            expect(error.message).toBe('Vote.addItem(4)');
        }
    })
});
