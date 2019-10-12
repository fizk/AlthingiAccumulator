import {CongressmanDocument, Message, Session, Speech, VoteItem} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {
    incrementAssemblyIssueCount,
    addProposition,
    addSession,
    updateSession,
    incrementVoteTypeCount,
    incrementSuperCategoryCount,
    incrementSuperCategorySpeechTime
} from '../../actions/congressman';

describe('incrementAssemblyIssueCount', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/100': {congressman_id: 100,},
        '/samantekt/loggjafarthing/1/thingmal/A/2/thingskjol': [{document_id: 1,}, {document_id: 2,}],
        '/samantekt/loggjafarthing/1/thingmal/A/3/thingskjol': [{document_id: 1,}, {document_id: 2,}],
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
                a: 1
            },
        };

        const response = await incrementAssemblyIssueCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
    });

    test('success - creates new congressman, not primary document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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
        };

        const response = await incrementAssemblyIssueCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe('Congressman.incrementAssemblyIssueCount no update');
    });

    test('success - existing congressman, adds document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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
                c: 1
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
    });

    test('success - existing congressman, increments document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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
                c: 1
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
                c: 2
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe(`Congressman.incrementAssemblyIssueCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
    });

    test('success - existing congressman, not primary document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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
                c: 2
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
                c: 2
            },
        };

        await mongo.db!.collection('congressman').insertOne(initialState);
        const response = await incrementAssemblyIssueCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe('Congressman.incrementAssemblyIssueCount no update');
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

        const response = await addProposition(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...rest} = congressman[0];

        expect(rest).toEqual(expected);
        expect(response).toBe(`Congressman.addProposition(${message.body.assembly_id}, ${message.body.congressman_id})`);
    });

    test('success - not primary document', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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

        const response = await addProposition(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        expect(congressman).toEqual([]);
        expect(response).toBe(`Congressman.addProposition no update`);
    });

    test('success - not primary proponent', async () => {
        const message: Message<CongressmanDocument> = {
                id: '101-1-1',
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

        const response = await addProposition(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        expect(congressman).toEqual([]);
        expect(response).toBe('Congressman.addProposition no update');
    });

});

describe('addSession', () => {
    const mongo = new MongoMock();
    const server = ApiServer({
        '/samantekt/thingmenn/2': {congressman_id: 2,},
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

        const response = await addSession(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.addSession(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.session_id})`);
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
        const response = await updateSession(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.updateSession(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.session_id})`);
    });

    test('no update', async () => {
        const message: Message<Session> = {
            id: '',
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
        const response = await updateSession(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.updateSession no update`);
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
        const response = await incrementVoteTypeCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementVoteTypeCount(1, ${message.body.congressman_id})`);
    });

    test('success existing field', async () => {
        const message: Message<VoteItem> = {
            id: '',
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
        const response = await incrementVoteTypeCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementVoteTypeCount(1, ${message.body.congressman_id})`);
    });

    test('success - no update', async () => {
        const message: Message<VoteItem> = {
            id: '',
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
        const response = await incrementVoteTypeCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementVoteTypeCount no update`);
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
        const response = await incrementSuperCategoryCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementSuperCategoryCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
    });

    test('success - existing values', async () => {
        const message: Message<CongressmanDocument> = {
            id: '',
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
        const response = await incrementSuperCategoryCount(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementSuperCategoryCount(${message.body.assembly_id}, ${message.body.congressman_id})`);
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
        const response = await incrementSuperCategorySpeechTime(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementSuperCategorySpeechTime(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.speech_id})`);
    });

    test('success - increment', async () => {
        const message: Message<Speech> = {
            id: '',
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
        const response = await incrementSuperCategorySpeechTime(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        const {_id, ...result} = congressman[0];

        expect(result).toEqual(expected);
        expect(response).toBe(`Congressman.incrementSuperCategorySpeechTime(${message.body.assembly_id}, ${message.body.congressman_id}, ${message.body.speech_id})`);
    });
});
