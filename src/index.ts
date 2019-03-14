import {connect} from 'amqplib'
import {createUpdate} from './actions/issue';
import {createUpdate as createUpdateDocument, createUpdateCongressmanDocument} from './actions/document';
import App from './app';
import httpQuery from './httpQuery';
import {MongoClient} from 'mongodb';

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
        app.use('issue-update-queue', createUpdate);
        app.use('issue-add-queue', createUpdate);
        app.use('document-update-queue', createUpdateDocument);
        app.use('document-add-queue', createUpdateDocument);
        app.use('congressman.document-update-queue', createUpdateCongressmanDocument);
        app.use('congressman.document-add-queue', createUpdateCongressmanDocument);
    });

}).then(() => {
    console.log('Connected to MongoDB, RabbitMQ. Services up and running');
}).catch(console.error);
