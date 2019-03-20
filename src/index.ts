import {connect} from 'amqplib';
import App from './app';
import httpQuery from './httpQuery';
import {MongoClient} from 'mongodb';
import {mongoDbConfig, apiConfig, rabbitMqConfig} from './config';
import * as IssueController from './actions/issue';
import * as DocumentController from './actions/document';
import * as DocumentCongressmanController from './actions/document-congressman';
import * as AssemblyController from './actions/assembly';

Promise.all([
    connect(rabbitMqConfig),
    MongoClient.connect(mongoDbConfig.url, mongoDbConfig.options),
    httpQuery(apiConfig)
]).then(([rabbit, mongo, httpQuery]) => {

    new App(rabbit, mongo.db('althingi'), httpQuery).init().then((app: App) => {
        app.use('assembly.add', AssemblyController.add);

        app.use('issue.add', IssueController.addIssue);
        app.use('issue.add.progress', IssueController.addProgressToIssue);
        app.use('issue.assembly.add', IssueController.addIssueToAssembly);
        app.use('issue.category.add', IssueController.addCategory);

        app.use('document.add', DocumentController.addDocument);
        app.use('document.add.issue', DocumentController.addDocumentToIssue);

        app.use('congressman-document.add', DocumentCongressmanController.addProponentDocument);
        app.use('congressman-document.add.proponent', DocumentCongressmanController.addProponentIssue);
    });

}).then(() => {
    console.log('Connected to MongoDB, RabbitMQ. Services up and running');
}).catch(console.error);
