import {CongressmanDocument, Message} from "../../../@types";
import MongoMock from "../Mongo";
import ApiServer from "../Server";
import {incrementAssemblyIssueCount, addProposition} from '../../actions/congressman';

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
        await mongo.open('test-congressman');
    });

    afterAll(async () => {
        await mongo.close();
    });

    afterEach(async () => {
        await mongo.db!.collection('congressman').drop();
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 100
            },
            assembly: {
                assembly_id: 1
            },
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 100
            },
            assembly: {
                assembly_id: 1
            },
            issues: {},
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {
                c: 1
            },
        };

        await mongo.db!.collection('congressman').insertOne({
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {},
        });
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {
                c: 2
            },
        };

        await mongo.db!.collection('congressman').insertOne({
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {
                c: 1
            },
        });
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {
                c: 2
            },
        };

        await mongo.db!.collection('congressman').insertOne({
            congressman: {
                congressman_id: 200
            },
            assembly: {
                assembly_id: 1
            },
            issues: {
                c: 2
            },
        });
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
        await mongo.open('test-congressman');
    });

    afterAll(async () => {
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
            }
        ;
        const expected = {
            congressman: {
                congressman_id: 100
            },
            assembly: {
                assembly_id: 1
            },
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
            }
        ;

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
            }
        ;

        const response = await addProposition(message, mongo.db!, server);
        const congressman = await mongo.db!.collection('congressman').find({}).toArray();

        expect(congressman).toEqual([]);
        expect(response).toBe('Congressman.addProposition no update');
    });

});
