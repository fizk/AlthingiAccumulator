import {Document, Message, Vote} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {add, addVote} from '../../actions/document';
import {Db} from "mongodb";

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-documentAdd');
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
        const message: Message<Document> = {
            id: '1-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-01 00:00',
                url: 'string | null',
                type: 'string',
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            document: {
                assembly_id: message.body.assembly_id,
                category: message.body.category,
                date: new Date(`${message.body.date}+00:00`),
                document_id: message.body.document_id,
                issue_id: message.body.issue_id,
                url: message.body.url,
                type: message.body.type,
            },
            votes: [],
        };

        const response = await add(message, mongo.db!, server);
        const issues = await mongo.db!.collection('document').find({}).toArray();

        const {_id, ...rest} = issues[0];

        expect(issues.length).toBe(1);
        expect(rest).toEqual(expected);
        expect(response).toBe(`Document.addDocument(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
    });

    test('fail', async () => {
        const mockDb = {
            collection: (name: string)  => ({
                updateOne: (params: any) => (
                    Promise.resolve({result: {result: {ok: false}}})
                )
            })
        };

        const message: Message<Document> = {
            id: '1-1-1',
            body: {
                document_id: 1,
                issue_id: 2,
                category: 'A',
                assembly_id: 3,
                date: '2001-01-01',
                url: 'string | null',
                type: 'string',
            }
        };

        try {
            await add(message, (mockDb as unknown as Db), server);
        } catch (error) {
            expect(error.message).toBe('Document.addDocument(3, 2, A, 1)');
        }
    })
});

describe('addVote', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-documentAddVote');
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
        const message: Message<Vote> = {
            id: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                document_id: 3,
                category: 'A',
                vote_id: 4,
                date: '2001-01-01 00:00',
                committee_to: 'committee_to',
                inaction: 0,
                no: 100,
                yes: 200,
                method: 'method',
                outcome: 'outcome',
                type: 'type'
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            document: {
                assembly_id: message.body.assembly_id,
                category: message.body.category,
                document_id: message.body.document_id,
                issue_id: message.body.issue_id,
            },
            votes: [{
                assembly_id: message.body.assembly_id,
                category: message.body.category,
                document_id: message.body.document_id,
                issue_id: message.body.issue_id,
                vote_id: message.body.vote_id,
                date: new Date(`${message.body.date}+00:00`),
                committee_to: message.body.committee_to,
                inaction: message.body.inaction,
                no: message.body.no,
                yes: message.body.yes,
                method: message.body.method,
                outcome: message.body.outcome,
                type: message.body.type
            }],
        };

        const response = await addVote(message, mongo.db!, server);
        const issues = await mongo.db!.collection('document').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issues.length).toBe(1);
        expect(issue).toEqual(expected);
        expect(response).toBe(`Document.addVote(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`)
    });

    test('fail', async () => {
        const message: Message<Vote> = {
            id: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                document_id: 3,
                category: 'A',
                vote_id: 4,
                date: '2001-01-01 00:00',
                committee_to: 'committee_to',
                inaction: 0,
                no: 100,
                yes: 200,
                method: 'method',
                outcome: 'outcome',
                type: 'type'
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
            await addVote(message, (mockDb as unknown as Db), server);
        } catch (error) {
            expect(error.message).toBe(`Document.addVote(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}, ${message.body.document_id})`);
        }
    });
});
