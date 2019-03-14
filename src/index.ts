import {connect} from 'amqplib'
import App from './app';
import httpQuery from './httpQuery';
import {MongoClient} from 'mongodb';
import * as IssueController from './actions/issue';
import * as DocumentController from './actions/document';
import * as DocumentCongressmanController from './actions/document-congressman';

const mongoURL = `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
const mongoOptions = {
    useNewUrlParser: true,
    // auth: {user: '', password: ''}
};
const rabbitMqOptions = {
    protocol: process.env.QUEUE_PROTOCOL || 'amqp',
    hostname: process.env.QUEUE_HOST || 'localhost',
    port: Number(process.env.QUEUE_PORT || 5672),
    username: process.env.QUEUE_USER || 'guest',
    password: process.env.QUEUE_PASSWORD || 'guest',
    locale: 'en_US',
    frameMax: 0x1000,
    heartbeat: 0,
    vhost: '/',
};
const apiOptions = {
    host: 'localhost'
};

Promise.all([
    connect(rabbitMqOptions),
    MongoClient.connect(mongoURL, mongoOptions),
    httpQuery(apiOptions)
]).then(([rabbit, mongo, httpQuery]) => {
    new App(rabbit, mongo.db('althingi'), httpQuery).init().then((app: App) => {
        app.use('document.add', DocumentController.addDocument);
        app.use('document.add.issue', DocumentController.addDocumentToIssue);
        app.use('issue.add.progress', IssueController.addProgressToIssue);
        app.use('issue.add', IssueController.addIssue);
        app.use('congressman-document.add', DocumentCongressmanController.addProponentDocument);
        app.use('congressman-document.add.proponent', DocumentCongressmanController.addProponentIssue);
        app.use('issue.add.proponents-count', DocumentCongressmanController.addProponentCountIssue);
    });

}).then(() => {
    console.log('Connected to MongoDB, RabbitMQ. Services up and running');
}).catch(console.error);
