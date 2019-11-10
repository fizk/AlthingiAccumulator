#!/bin/bash
set -e

mongo <<EOF
use admin

db = db.getSiblingDB('althingi');

db.createUser({
    user: '$STORE_USER',
    pwd: '$STORE_PASSWORD',
    roles: [{
        role: 'readWrite',
        db: 'althingi'
    }]
});


// Setting up collections.

// CONGRESSMAN
db.getCollection('congressman').drop();
db.createCollection('congressman');
db.getCollection('congressman').createIndex({
    'congressman.congressman_id': 1,
    'assembly.assembly_id': 1,
}, {
    unique: true
});

// DOCUMENT
db.getCollection('document').drop();
db.createCollection('document');
db.getCollection('document').createIndex({
    'document.date': 1
});
db.getCollection('document').createIndex({
    'assembly.assembly_id': 1,
    'document.issue_id': 1,
    'document.category': 1,
    'document.document_id': 1,
}, {
    unique: true
});

// ISSUE
db.getCollection('issue').drop();
db.createCollection('issue');
db.getCollection('issue').createIndex({
    'issue.type': 1
});
db.getCollection('issue').createIndex({
    'date': 1
});
db.getCollection('issue').createIndex({
    'assembly.assembly_id': 1,
    'issue.issue_id': 1,
    'issue.category': 1,
}, {
    unique: true
});

// SPEECH
db.getCollection('speech').drop();
db.createCollection('speech');
db.getCollection('speech').createIndex({
    'speech.speech_id': 1,
}, {
    unique: true
});
db.getCollection('speech').createIndex({
    'assembly.assembly_id': 1,
    'speech.issue_id': 1,
    'speech.category': 1,
    'speech.from': 1,
    'speech.to': 1,
});

// VOTE
db.getCollection('vote').drop();
db.createCollection('vote');
db.getCollection('vote').createIndex({
    'vote.vote_id': 1,
}, {
    unique: true
});
db.getCollection('vote').createIndex({
    'assembly.assembly_id': 1,
    'vote.issue_id': 1,
    'vote.category': 1,
    'vote.document_id': 1,
});

// Assembly
db.getCollection('assembly').drop();
db.createCollection('assembly');
db.getCollection('assembly').createIndex({
    'assembly.assembly_id': 1,
}, {
    unique: true
});
EOF
