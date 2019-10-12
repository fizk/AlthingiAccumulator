import {connect} from 'amqplib';
import App from './app';
import httpQuery from './httpQuery';
import {MongoClient} from 'mongodb';
import {mongoDbConfig, apiConfig, rabbitMqConfig, rabbitMqOptions} from './config';
import * as IssueController from './actions/issue';
import * as SpeechController from './actions/speech';
import * as DocumentController from './actions/document';
import * as VoteController from './actions/vote';
import * as CongressmanController from './actions/congressman';
import * as DocumentCongressmanController from './actions/document-congressman';
import {Issue, Document, CongressmanDocument, IssueCategory, Speech, Vote, VoteItem, IssueLink} from "../@types";

Promise.all([
    connect(rabbitMqConfig),
    MongoClient.connect(mongoDbConfig.url, mongoDbConfig.options),
    httpQuery(apiConfig)
]).then(([rabbit, mongo, httpQuery]) => {

    new App(rabbit, mongo.db('althingi'), httpQuery, rabbitMqOptions).init().then((app: App) => {

        /* Routing key                             Type    Queue                                                    */

        /* issue.add                -> */  app.use<Issue>('issue.add', IssueController.add);

        /* issue.update             -> */  app.use<Issue>('issue.update', IssueController.update);

        /* issue-category.add       -> */  app.use<IssueCategory>('issue-category.add', IssueController.addCategory);

        /* document.add             -> */  app.use<Document>('document.add', DocumentController.add);
        /* document.add             -> */  app.use<Document>('issue.government-flag', IssueController.addGovernmentFlag);
        /* document.add             -> */  app.use<Document>('issue.date-flag', IssueController.addDateFlag);

        /* congressman-document.add -> */  app.use<CongressmanDocument>('congressman-document.add', DocumentCongressmanController.addProponentDocument);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('congressman.increment-assembly-issue-count', CongressmanController.incrementAssemblyIssueCount);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('congressman.add-proposition', CongressmanController.addProposition);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('issue.add-proponent', IssueController.addProponent);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('congressman.increment-super-category-count', CongressmanController.incrementSuperCategoryCount);

        /* vote.add                 -> */  app.use<Vote>('vote.add', VoteController.add);
        /* vote.add                 -> */  app.use<Vote>('document.add-vote', DocumentController.addVote);

        /* vote-item.add            -> */  app.use<VoteItem>('vote-item.add', VoteController.addItem);
        /* vote-item.add            -> */  app.use<VoteItem>('congressman.increment-vote-type-count', CongressmanController.incrementVoteTypeCount);

        /* speech.add               -> */  app.use<Speech>('speech.add', SpeechController.add);
        /* speech.add               -> */  app.use<Speech>('issue.add-speech', IssueController.incrementSpeechCount);
        /* speech.add               -> */  app.use<Speech>('issue.increment-issue-speaker-time', IssueController.incrementIssueSpeakerTime);
        /* speech.add               -> */  app.use<Speech>('congressman.increment-assembly-speech-time', CongressmanController.incrementAssemblySpeechTime);
        /* speech.add               -> */  app.use<Speech>('congressman.increment-super-category-speech-time', CongressmanController.incrementSuperCategorySpeechTime);

        /* speech.update            -> */  app.use<Speech>('speech.update', SpeechController.update);

        /* issue-link.add           -> */  app.use<IssueLink>('issue-link.add', IssueController.addLink);
    });

}).then(() => {
    console.log('Connected to MongoDB, RabbitMQ. Services up and running');
}).catch(console.error);
