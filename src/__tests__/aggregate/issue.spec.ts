import {CongressmanDocument, Document, Issue, IssueCategory, Message, Speech} from "../../../@types";
import MongoMock from "../Mongo";
import {Client as ElasticsearchClient} from '@elastic/elasticsearch';
import ApiServer from "../Server";
import {
    add,
    update,
    addCategory,
    addGovernmentFlag,
    addDateFlag,
    addProponent,
    incrementSpeechCount,
    incrementIssueSpeakerTime
} from '../../aggregate/issue'

describe('add', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-issueAdd');
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
        const message: Message<Issue> = {
            id: '1-1-1',
            index: '',
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
        await add(message, mongo.db!, {} as ElasticsearchClient, server);

        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues.length).toBe(1);
        expect(issues[0].hasOwnProperty('issue')).toBeTruthy();
    });
});

describe('update', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-issueUpdate');
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
        const message: Message<Issue> = {
            index: '',
            id: '1-1-1',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                congressman_id: 3,
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
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            issue: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
            },
            date: null,
            proponents: [],
            voteRange: [],
            speechRange: [],
            speakers: [],
            speechTime: 0,
            speechCount: 0,
            governmentIssue: false,
            categories: [],
            superCategories: [],
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            issue: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category,
                congressman_id: message.body.congressman_id,
                name: message.body.name,
                sub_name: message.body.sub_name,
                type: message.body.type,
                type_name: message.body.type_name,
                type_subname: message.body.type_subname,
                status: message.body.status,
                question: message.body.question,
                goal: message.body.goal,
                major_changes: message.body.major_changes,
                changes_in_law: message.body.changes_in_law,
                costs_and_revenues: message.body.costs_and_revenues,
                deliveries: message.body.deliveries,
                additional_information: message.body.additional_information,
            },
            date: null,
            proponents: [],
            voteRange: [],
            speechRange: [],
            speakers: [],
            speechTime: 0,
            speechCount: 0,
            governmentIssue: false,
            categories: [],
            superCategories: [],
        };

        await mongo.db!.collection('issue').insertOne(initialState);

        const response = await update(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issues.length).toBe(1);
        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'update',
            params: message.body,
        });
    });
});

describe('addGovernmentFlag', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-issueAddGovernmentFlag');
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

    test('success with flag', async () => {
        const message: Message<Document> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                date: '2001-01-01 00:00',
                type: 'stjórnarfrumvarp',
                url: 'url'
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
            government_issue: false,
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
            government_issue: true,
        };

        await mongo.db!.collection('issue').insertOne(initialState);
        const response = await addGovernmentFlag(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'addGovernmentFlag',
            params: message.body,
        });
    });

    test('success without flag', async () => {
        const message: Message<Document> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                date: '2001-01-01 00:00',
                type: 'some-other-type',
                url: 'url'
            }
        };
        const initialState = {
            issue: {
                assembly_id: message.body.assembly_id,
                issue_id: message.body.issue_id,
                category: message.body.category
            },
            governmentIssue: false,
        };

        await mongo.db!.collection('issue').insertOne(initialState);
        const response = await addGovernmentFlag(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues[0].governmentIssue).toBeFalsy();
        expect(response).toEqual({
            controller: 'Issue',
            action: 'addGovernmentFlag',
            reason: 'no update',
            params: message.body,
        });
    });
});

describe('addDateFlag', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/1/thingmal/A/2/thingskjol': [{
            document_id: 3
        },],
        '/samantekt/loggjafarthing/2/thingmal/A/2/thingskjol': [{
            document_id: 300
        },],
    });

    beforeAll(async () => {
        await mongo.open('test-issueAddDateFlag');
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

    test('success with flag', async () => {
        const message: Message<Document> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                date: '2001-01-01 00:00',
                type: 'type',
                url: 'url'
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
            date: null,
        };

        await mongo.db!.collection('issue').insertOne(initialState);
        const response = await addDateFlag(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues[0].date).toEqual(new Date(`${message.body.date}+00:00`));
        expect(response).toEqual({
            controller: 'Issue',
            action: 'addDateFlag',
            params: message.body,
        });
    });

    test('success without flag', async () => {
        const message: Message<Document> = {
            id: '',
            index: '',
            body: {
                assembly_id: 2,
                issue_id: 2,
                category: 'A',
                document_id: 3,
                date: '2001-01-01 00:00',
                type: 'type',
                url: 'url'
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
            date: null,
        };
        await mongo.db!.collection('issue').insertOne(initialState);
        const response = await addDateFlag(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues[0].date).toBeNull();
        expect(response).toEqual({
            controller: 'Issue',
            action: 'addDateFlag',
            reason: 'no update',
            params: message.body,
        });
    });
});

describe('addProponent', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/1/thingmal/A/2/thingskjol': [{
            document_id: 4
        },],
        '/samantekt/thingmenn/100': {
            congressman_id: 100,
            name: 'name',
            birth: '2001-01-01',
            death: null
        },
    });

    beforeAll(async () => {
        await mongo.open('test-issueAddProponent');
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

    test('success - no proponent present', async () => {
        const message: Message<CongressmanDocument> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                document_id: 4,
                congressman_id: 100,
                minister: 'minister',
                order: 2
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
            proponents: [],
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
            proponents: [{
                congressman: {
                    congressman_id: message.body.congressman_id,
                    name: 'name',
                    birth: '2001-01-01',
                    death: null
                },
                minister: message.body.minister,
                order: message.body.order
            }],
        };
        await mongo.db!.collection('issue').insertOne(initialState);
        await addProponent(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
    });
});

describe('addCategory', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/thingmal/efnisflokkar/0/undirflokkar/2': {super_category_id: 3},
        '/thingmal/efnisflokkar/3': {category_id: 4},
    });

    beforeAll(async () => {
        await mongo.open('test-issueAddCategory');
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
        const message: Message<IssueCategory> = {
            id: '1-1-1',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                category_id: 2,
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
            categories: [{super_category_id: 3}],
            super_categories: [{category_id: 4}],
        };

        const response = await addCategory(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'addCategory',
            params: message.body,
        });
    })
});

describe('incrementSpeechCount', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-issueIncrementSpeechCount');
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
            id: '20010101',
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
                congressman_id: 1,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
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
                speech_time: 60,
                speech_count: 1,
        };

        const response = await incrementSpeechCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'incrementSpeechCount',
            params: message.body,
        });
    });

    test('success increment', async () => {
        const message: Message<Speech> = {
            id: '20010101',
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
                congressman_id: 1,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
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
            speech_time: 10,
            speech_count: 10,
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
            speech_time: 70,
            speech_count: 11,
        };

        await mongo.db!.collection('issue').insertOne(initialState);

        const response = await incrementSpeechCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'incrementSpeechCount',
            params: message.body,
        });
    });
});

describe('incrementIssueSpeakerTime', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/100': {congressman_id: 100,}
    });

    beforeAll(async () => {
        await mongo.open('test-issueIncrementIssueSpeakerTime');
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

    test('success - create congressman, update time', async () => {
        const message: Message<Speech> = {
            id: '20010101',
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
                congressman_id: 100,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
                word_count: 0
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
            speakers: [{
                congressman: {
                    congressman_id: message.body.congressman_id
                },
                time: 60
            }]
        };

        const response = await incrementIssueSpeakerTime(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'incrementIssueSpeakerTime',
            params: message.body,
        });
    });

    test('success - congressman exists, update time', async () => {
        const message: Message<Speech> = {
            id: '20010101',
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
                congressman_id: 200,
                congressman_type: 'congressman_type',
                iteration: 'iteration',
                plenary_id: 3,
                type: 'type',
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
            speakers: [{
                congressman: {
                    congressman_id: message.body.congressman_id
                },
                time: 100
            }]
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
            speakers: [{
                congressman: {
                    congressman_id: message.body.congressman_id
                },
                time: 160
            }]
        };

        await mongo.db!.collection('issue').insertOne(initialState);
        const response = await incrementIssueSpeakerTime(message, mongo.db!, {} as ElasticsearchClient, server);
        const issues = await mongo.db!.collection('issue').find({}).toArray();
        const {_id, ...issue} = issues[0];

        expect(issue).toEqual(expected);
        expect(response).toEqual({
            controller: 'Issue',
            action: 'incrementIssueSpeakerTime',
            params: message.body,
        });
    });
});
