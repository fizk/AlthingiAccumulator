import {Issue, IssueCategory, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {addIssue, addProgressToIssue, addIssueToAssembly, addCategory} from '../../actions/issue'

describe('addIssue', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('issue-addIssue');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Issue> = {
            id: '1-1-1',
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
        await addIssue(message, mongo.db!, server);

        const issues = await mongo.db!.collection('issue').find({}).toArray();

        expect(issues.length).toBe(1);
        expect(issues[0].hasOwnProperty('issue')).toBeTruthy();
    })
});

describe('addProgressToIssue', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/2/thingmal/1/ferill': [
            {
                assembly_id: 2,
                issue_id: 1,
                committee_id: null,
                speech_id:  null,
                document_id: null,
                date: null,
                title: null,
                type: null,
                committee_name: null,
                completed: null,
            }
        ]
    });

    beforeAll(async () => {
        await mongo.open('issue-addProgressToIssue');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Issue> = {
            id: '1-1-1',
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
        await addProgressToIssue(message, mongo.db!, server);

        const issue = await mongo.db!.collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.progress.length).toBe(1);
    })
});

describe('addIssueToAssembly', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/2/thingmal/flokkar-stada': [],
        '/samantekt/loggjafarthing/2/thingmal/stjornarfrumvorp': [],
    });

    beforeAll(async () => {
        await mongo.open('issue-addIssueToAssembly');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<Issue> = {
            id: '1-1-1',
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
        await addIssueToAssembly(message, mongo.db!, server);

        const assembly = await mongo.db!.collection('assembly').findOne({
            'assembly.assembly_id': message.body.assembly_id,
        });

        expect(assembly.issues.government.length).toBe(0);
        expect(assembly.issues.typeA.length).toBe(0);
        expect(assembly.issues.typeB.length).toBe(0);
    })
});

describe('addCategory', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/1/thingmal/2/malaflokkar': [],
        '/samantekt/loggjafarthing/1/thingmal/2/yfir-malaflokkar': [],
    });

    beforeAll(async () => {
        await mongo.open('issue-addCategory');
    });

    afterAll(async () => {
        await mongo.close();
    });

    test('test', async () => {
        const message: Message<IssueCategory> = {
            id: '1-1-1',
            body: {
                assembly_id: 1,
                issue_id: 2,
                category: 'A',
                category_id: 3,
            }
        };
        await addCategory(message, mongo.db!, server);

        const issue = await mongo.db!.collection('issue').findOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        });

        expect(issue.categories).toBeInstanceOf(Array);
        expect(issue.superCategories).toBeInstanceOf(Array);
    })
});
