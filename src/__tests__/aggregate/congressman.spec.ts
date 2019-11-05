import {CongressmanDocument, Message, Session, Speech, VoteItem} from "../../../@types";
import MongoMock from "../Mongo";
import {Client as ElasticsearchClient} from '@elastic/elasticsearch';
import ApiServer from "../Server";
import {
    incrementAssemblyIssueCount,
    addProposition,
    addSession,
    updateSession,
    incrementVoteTypeCount,
    incrementSuperCategoryCount,
    incrementSuperCategorySpeechTime
} from '../../aggregate/congressman';

describe('incrementAssemblyIssueCount', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/100': {congressman_id: 100,},
        '/samantekt/loggjafarthing/1/thingmal/A/2/thingskjol': [{document_id: 1,}, {document_id: 2, type: 'non primary'}],
        '/samantekt/loggjafarthing/1/thingmal/A/3/thingskjol': [{document_id: 1,}, {document_id: 2, type: 'non primary'}],
        '/samantekt/loggjafarthing/1/thingmal/A/2': {type: 'a'},
        '/samantekt/loggjafarthing/1/thingmal/A/3': {type: 'c'}
    });

    beforeAll(async () => {
        await mongo.open('test-congressmanIncrementAssemblyIssueCount');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success - creates new congressman, adds document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 1,
                    issue_id: 2,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 100,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            speech_time: 0,
            issues: {
                a: {
                    type:  'a',
                    category: null,
                    typeName: null,
                    typeSubName: null,
                    count: 1
                }
            },
        };

        const response = await incrementAssemblyIssueCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'incrementAssemblyIssueCount',
            controller: 'Congressman',
            params: message.body
        });
    });

    test('success - creates new congressman, not primary document, add motions', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 2,
                    issue_id: 2,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 100,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            speech_time: 0,
            motions: {
                "non primary": 1
            }
        };

        const response = await incrementAssemblyIssueCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'incrementAssemblyIssueCount',
            controller: 'Congressman',
            params: message.body,
        });
    });

    test('success - existing congressman, adds document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 1,
                    issue_id: 3,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 200,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const initialState = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {},
        };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {
                c: {
                    type: 'c',
                    count: 1,
                    category: null,
                    typeName: null,
                    typeSubName: null,
                }
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'incrementAssemblyIssueCount',
            controller: 'Congressman',
            params: message.body
        });
    });

    test('success - existing congressman, increments document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 1,
                    issue_id: 3,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 200,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const initialState = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {
                c: {
                    type: 'c',
                    count: 1,
                    category: null,
                    typeName: null,
                    typeSubName: null,
                }
            },
        };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {
                c: {
                    type: 'c',
                    count: 2,
                    category: null,
                    typeName: null,
                    typeSubName: null,
                }
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            action: 'incrementAssemblyIssueCount',
            controller: 'Congressman',
            params: message.body
        });
    });

    test('success - existing congressman, not primary document, increments motions', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 2,
                    issue_id: 3,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 200,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const initialState = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {
                c: {
                    type: 'c',
                    count: 2,
                    category: null,
                    typeName: null,
                    typeSubName: null,
                }
            },
            motions: {
                "non primary": 1
            }
        };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            issues: {
                c: {
                    type: 'c',
                    count: 2,
                    category: null,
                    typeName: null,
                    typeSubName: null,
                }
            },
            motions: {
                "non primary": 2
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementAssemblyIssueCount',
            params: message.body,
        });
    });

});

describe('addProposition', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/100': {congressman_id: 100,},
        '/samantekt/loggjafarthing/1/thingmal/A/2/thingskjol': [{document_id: 1,}, {document_id: 2,}],
        '/samantekt/loggjafarthing/1/thingmal/A/3/thingskjol': [{document_id: 1,}, {document_id: 2,}],
        '/samantekt/loggjafarthing/1/thingmal/A/2': {type: 'a', name: 'issue A name'},
        '/samantekt/loggjafarthing/1/thingmal/A/3': {type: 'c', name: 'issue C name'}
    });

    beforeAll(async () => {
        await mongo.open('test-congressmanAddProposition');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success - creates new congressman, adds proposition', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 1,
                    issue_id: 2,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 100,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };
        const expected = {
            congressman: {
                congressman_id: message.body.congressman_id
            },
            assembly: {
                assembly_id: message.body.assembly_id
            },
            speech_time: 0,
            propositions: [{
                type: 'a',
                name: 'issue A name'
            }],
        };

        const response = await addProposition(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'addProposition',
            params: message.body
        });
    });

    test('success - not primary document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 2,
                    issue_id: 2,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 100,
                    minister: 'fjármálaráðherra',
                    order: 1
                }
            };

        const response = await addProposition(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        expect(congressman).toEqual([]);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'addProposition',
            params: message.body,
            reason: 'no update',
        });
    });

    test('success - not primary proponent', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
                index: '',
                body: {
                    document_id: 1,
                    issue_id: 2,
                    category: 'A',
                    assembly_id: 1,
                    congressman_id: 100,
                    minister: 'fjármálaráðherra',
                    order: 2
                }
            };

        const response = await addProposition(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        expect(congressman).toEqual([]);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'addProposition',
            params: message.body,
            reason: 'no update'
        });
    });

});

describe('addSession', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/2': {congressman_id: 2,},
        '/samantekt/thingflokkar/5': {
            party_id: 5,
            name: 'Miðflokkurinn',
        },
        '/samantekt/kjordaemi/4': {
            constituency_id: 4,
            name: 'Suðvesturkjördæmi'
        },
    });

    beforeAll(async () => {
        await mongo.open('test-addSession');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Session> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                congressman_id: 2,
                session_id: 3,
                constituency_id: 4,
                party_id: 5,
                abbr: 'abbr',
                type: 'type',
                from: '2001-01-01',
                to: '2001-01-01',
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            parties: [{
                party_id: 5,
                name: "Miðflokkurinn",
            }],
            constituencies: [{
                constituency_id: 4,
                name: 'Suðvesturkjördæmi'
            }],
            speech_time: 0,
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`${message.body.to} 00:00:00+00:00`),
            }]
        };

        const response = await addSession(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'addSession',
            params: message.body,
        });
    });

    test('success - no duplicate party', async () => {
        const message: Message<Session> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                congressman_id: 2,
                session_id: 3,
                constituency_id: 4,
                party_id: 5,
                abbr: 'abbr',
                type: 'type',
                from: '2001-01-01',
                to: '2001-01-01',
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            parties: [{
                party_id: 5,
                name: "Miðflokkurinn",
            }, {
                party_id: 100,
                name: "another party",
            }],
            constituencies: [{
                constituency_id: 4,
                name: 'Suðvesturkjördæmi'
            }],
            speech_time: 0,
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`${message.body.to} 00:00:00+00:00`),
            }]
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            sessions: [],
            constituencies: [{
                constituency_id: 4,
                name: 'Suðvesturkjördæmi'
            }],
            parties: [{
                party_id: 5,
                name: "Miðflokkurinn",
            }, {
                party_id: 100,
                name: "another party",
            }],
            "speech_time": 0
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await addSession(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'addSession',
            params: message.body,
        });
    });
});

describe('updateSession', () => {
    const mongo = new MongoMock();
    const server = ApiServer({});

    beforeAll(async () => {
        await mongo.open('test-updateSession');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Session> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                congressman_id: 2,
                session_id: 3,
                constituency_id: 4,
                party_id: 5,
                abbr: 'abbr',
                type: 'type',
                from: '2001-01-01',
                to: '2001-01-01',
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: null
            },{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: 100,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`${message.body.to} 00:00:00+00:00`),
            }]
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`${message.body.to} 00:00:00+00:00`),
            },{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: 100,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`${message.body.to} 00:00:00+00:00`),
            }]
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await updateSession(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'updateSession',
            params: message.body,
        });
    });

    test('no update', async () => {
        const message: Message<Session> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                congressman_id: 2,
                session_id: 3,
                constituency_id: 4,
                party_id: 5,
                abbr: 'abbr',
                type: 'type',
                from: '2001-01-01',
                to: null,
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: null
            },{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: 100,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`2001-01-01 00:00:00+00:00`),
            }]
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            sessions: [{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: message.body.session_id,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: null
            },{
                assembly_id: message.body.assembly_id,
                congressman_id: message.body.congressman_id,
                session_id: 100,
                constituency_id: message.body.constituency_id,
                party_id: message.body.party_id,
                abbr: message.body.abbr,
                type: message.body.type,
                from: new Date(`${message.body.from} 00:00:00+00:00`),
                to: new Date(`2001-01-01 00:00:00+00:00`),
            }]
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await updateSession(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'updateSession',
            params: message.body,
            reason: 'no update'
        });
    });
});

describe('incrementVoteTypeCount', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/atkvaedi/1': {assembly_id: 1}
    });

    beforeAll(async () => {
        await mongo.open('test-incrementVoteTypeCount');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<VoteItem> = {
            id: '',
            index: '',
            body: {
                vote: 'boðaði fjarvist',
                vote_id: 1,
                vote_item_id: 1,
                congressman_id: 1
            }
        };
        const initialState = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            vote_type: {
                announced_absence: 1,
                absence: 0,
                neutral: 0,
                partisan: 0
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementVoteTypeCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementVoteTypeCount',
            params: message.body,
        });
    });

    test('success existing field', async () => {
        const message: Message<VoteItem> = {
            id: '',
            index: '',
            body: {
                vote: 'boðaði fjarvist',
                vote_id: 1,
                vote_item_id: 1,
                congressman_id: 1
            }
        };
        const initialState = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            vote_type: {
                announced_absence: 1
            }
        };
        const expected = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            vote_type: {
                announced_absence: 2,
                absence: 0,
                neutral: 0,
                partisan: 0,
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementVoteTypeCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementVoteTypeCount',
            params: message.body,
        });
    });

    test('success - no update', async () => {
        const message: Message<VoteItem> = {
            id: '',
            index: '',
            body: {
                vote: 'f: óþekktur kóði',
                vote_id: 1,
                vote_item_id: 1,
                congressman_id: 1
            }
        };
        const initialState = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: 1,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementVoteTypeCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementVoteTypeCount',
            reason: 'no update',
            params: message.body,
        });
    });
});

describe('incrementSuperCategoryCount', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/1/thingmal/A/3/yfir-malaflokkar': [{
            super_category_id: 2,
            title: "Hagstjórn"
        }, {
            super_category_id: 11,
            title: "Samfélagsmál"
        }]
    });

    beforeAll(async () => {
        await mongo.open('test-incrementVoteTypeCount');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<CongressmanDocument> = {
            id: '',
            index: '',
            body: {
                issue_id: 3,
                category: 'A',
                assembly_id: 1,
                order: 1,
                minister: '',
                congressman_id: 1,
                document_id: 1,
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories: {
                '2': {
                    count: 1,
                    id: 2,
                    title: "Hagstjórn"
                },
                '11': {
                    count: 1,
                    id: 11,
                    title: "Samfélagsmál"
                }
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategoryCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            params: message.body,
        });
    });

    test('success - no category', async () => {
        const server = ApiServer({
            '/samantekt/loggjafarthing/1/thingmal/A/3/yfir-malaflokkar': []
        });
        const message: Message<CongressmanDocument> = {
            id: '',
            index: '',
            body: {
                issue_id: 3,
                category: 'A',
                assembly_id: 1,
                order: 1,
                minister: '',
                congressman_id: 1,
                document_id: 1,
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategoryCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            reason: 'no update',
            params: message.body,
        });
    });

    test('success - existing values', async () => {
        const message: Message<CongressmanDocument> = {
            id: '',
            index: '',
            body: {
                issue_id: 3,
                category: 'A',
                assembly_id: 1,
                order: 1,
                minister: '',
                congressman_id: 1,
                document_id: 1,
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories: {
                '2': {
                    count: 1,
                    id: 2,
                    title: "Hagstjórn"
                }
            }
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories: {
                '2': {
                    count: 2,
                    id: 2,
                    title: "Hagstjórn"
                },
                '11': {
                    count: 1,
                    id: 11,
                    title: "Samfélagsmál"
                }
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategoryCount(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategoryCount',
            params: message.body,
        });
    });
});

describe('incrementSuperCategorySpeechTime', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/loggjafarthing/1/thingmal/A/3/yfir-malaflokkar': [{
            super_category_id: 2,
            title: "Hagstjórn"
        }, {
            super_category_id: 11,
            title: "Samfélagsmál"
        }]
    });

    beforeAll(async () => {
        await mongo.open('test-incrementSuperCategorySpeechTime');
    });

    afterAll(async () => {
        await mongo.db!.dropDatabase();
        await mongo.close();
    });

    afterEach(async () => {
        try {
            await mongo.db!.collection('congressman').drop();
        } catch (e) {}
    });

    test('success', async () => {
        const message: Message<Speech> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 3,
                category: 'A',
                speech_id: '1',
                plenary_id: 1,
                congressman_id: 0,
                congressman_type: '',
                type: '0',
                iteration: '0',
                text: '',
                to: '2001-01-01 00:01',
                from: '2001-01-01 00:00',
                validated: true,
                word_count: 0
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories_speech_time: {
                '2': {
                    time: 60,
                    id: 2,
                    title: "Hagstjórn"
                },
                '11': {
                    time: 60,
                    id: 11,
                    title: "Samfélagsmál"
                }
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategorySpeechTime(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategorySpeechTime',
            params: message.body,
        });
    });

    test('success - no category', async () => {
        const server = ApiServer({
            '/samantekt/loggjafarthing/1/thingmal/A/3/yfir-malaflokkar': []
        });

        const message: Message<Speech> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 3,
                category: 'A',
                speech_id: '1',
                plenary_id: 1,
                congressman_id: 0,
                congressman_type: '',
                type: '0',
                iteration: '0',
                text: '',
                to: '2001-01-01 00:01',
                from: '2001-01-01 00:00',
                validated: true,
                word_count: 0
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategorySpeechTime(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategorySpeechTime',
            reason: 'no update',
            params: message.body,
        });
    });

    test('success - increment', async () => {
        const message: Message<Speech> = {
            id: '',
            index: '',
            body: {
                assembly_id: 1,
                issue_id: 3,
                category: 'A',
                speech_id: '1',
                plenary_id: 1,
                congressman_id: 0,
                congressman_type: '',
                type: '0',
                iteration: '0',
                text: '',
                to: '2001-01-01 00:01',
                from: '2001-01-01 00:00',
                validated: true,
                word_count: 0
            }
        };
        const initialState = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories_speech_time: {
                '2': {
                    time: 60,
                    id: 2,
                    title: "Hagstjórn"
                }
            },
        };
        const expected = {
            assembly: {
                assembly_id: message.body.assembly_id,
            },
            congressman: {
                congressman_id: message.body.congressman_id,
            },
            super_categories_speech_time: {
                '2': {
                    time: 120,
                    id: 2,
                    title: "Hagstjórn"
                },
                '11': {
                    time: 60,
                    id: 11,
                    title: "Samfélagsmál"
                }
            }
        };
        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementSuperCategorySpeechTime(message, mongo.db!, {} as ElasticsearchClient, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toEqual({
            controller: 'Congressman',
            action: 'incrementSuperCategorySpeechTime',
            params: message.body,
        });
    });
});
