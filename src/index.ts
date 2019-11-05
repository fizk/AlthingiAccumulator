import {connect} from 'amqplib';
import App from './app';
import httpQuery from './httpQuery';
import {MongoClient} from 'mongodb';
import {Client} from '@elastic/elasticsearch';
import {mongoDbConfig, apiConfig, rabbitMqConfig, rabbitMqOptions, elasticsearchConfig} from './config';
import * as AggregateIssueController from './aggregate/issue';
import * as AggregateSpeechController from './aggregate/speech';
import * as AggregateDocumentController from './aggregate/document';
import * as AggregateVoteController from './aggregate/vote';
import * as AggregateCongressmanController from './aggregate/congressman';
import * as AggregateDocumentCongressmanController from './aggregate/document-congressman';
import * as SearchIssueController from './search/issue';
import * as SearchSpeechController from './search/speech';

import {
    Issue,
    Document,
    CongressmanDocument,
    IssueCategory,
    Speech,
    Vote,
    VoteItem,
    IssueLink,
    Session
} from "../@types";

Promise.all([
    connect(rabbitMqConfig),
    MongoClient.connect(mongoDbConfig.url, mongoDbConfig.options),
    httpQuery(apiConfig),
    new Client(elasticsearchConfig)
]).then(([rabbit, mongo, httpQuery, elasticsearch]) => {

    new App(rabbit, mongo.db('althingi'), httpQuery, elasticsearch, rabbitMqOptions).init().then((app: App) => {

        /* Routing key                             Type    Queue                                                    */

        /* issue.add                -> */  app.use<Issue>('a.issue.add', AggregateIssueController.add);

        /* issue.update             -> */  app.use<Issue>('a.issue.update', AggregateIssueController.update);

        /* issue-category.add       -> */  app.use<IssueCategory>('a.issue-category.add', AggregateIssueController.addCategory);

        /* document.add             -> */  app.use<Document>('a.document.add', AggregateDocumentController.add);
        /* document.add             -> */  app.use<Document>('a.issue.government-flag', AggregateIssueController.addGovernmentFlag);
        /* document.add             -> */  app.use<Document>('a.issue.primary-document', AggregateIssueController.addPrimaryDocument);

        /* congressman-document.add -> */  app.use<CongressmanDocument>('a.congressman-document.add', AggregateDocumentCongressmanController.addProponentDocument);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('a.congressman.increment-assembly-issue-count', AggregateCongressmanController.incrementAssemblyIssueCount);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('a.congressman.add-proposition', AggregateCongressmanController.addProposition);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('a.issue.add-proponent', AggregateIssueController.addProponent);
        /* congressman-document.add -> */  app.use<CongressmanDocument>('a.congressman.increment-super-category-count', AggregateCongressmanController.incrementSuperCategoryCount);

        /* vote.add                 -> */  app.use<Vote>('a.vote.add', AggregateVoteController.add);
        /* vote.add                 -> */  app.use<Vote>('a.document.add-vote', AggregateDocumentController.addVote);

        /* vote-item.add            -> */  app.use<VoteItem>('a.vote-item.add', AggregateVoteController.addItem);
        /* vote-item.add            -> */  app.use<VoteItem>('a.congressman.increment-vote-type-count', AggregateCongressmanController.incrementVoteTypeCount);

        /* speech.add               -> */  app.use<Speech>('a.speech.add', AggregateSpeechController.add);
        /* speech.add               -> */  app.use<Speech>('a.issue.add-speech', AggregateIssueController.incrementSpeechCount);
        /* speech.add               -> */  app.use<Speech>('a.issue.increment-issue-speaker-time', AggregateIssueController.incrementIssueSpeakerTime);
        /* speech.add               -> */  app.use<Speech>('a.congressman.increment-assembly-speech-time', AggregateCongressmanController.incrementAssemblySpeechTime);
        /* speech.add               -> */  app.use<Speech>('a.congressman.increment-super-category-speech-time', AggregateCongressmanController.incrementSuperCategorySpeechTime);

        /* speech.update            -> */  app.use<Speech>('a.speech.update', AggregateSpeechController.update);

        /* issue-link.add           -> */  app.use<IssueLink>('a.issue-link.add', AggregateIssueController.addLink);

        /* session.add              -> */  app.use<Session>('a.session.add', AggregateCongressmanController.addSession);
        /* session.update           -> */  app.use<Session>('a.session.update', AggregateCongressmanController.updateSession);
    });

    new App(rabbit, mongo.db('althingi'), httpQuery, elasticsearch, rabbitMqOptions).init().then((app: App) => {

        /* Routing key                             Type    Queue                                                    */

        /* issue.add                -> */  app.use<Issue>('s.issue.add', SearchIssueController.add);
        /* issue.update             -> */  app.use<Issue>('s.issue.update', SearchIssueController.add);

        /* speech.add               -> */  app.use<Speech>('s.speech.add', SearchSpeechController.add);
        /* speech.update            -> */  app.use<Speech>('s.speech.update', SearchSpeechController.add);

    })

}).then(() => {
    console.log('Connected to MongoDB, RabbitMQ. Services up and running');
}).catch(console.error);
