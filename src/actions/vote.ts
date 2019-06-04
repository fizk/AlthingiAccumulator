import {AppCallback, Vote, VoteItem} from "../../@types";

/**
 * Adds an Vote to vote collection
 *
 * @param message
 * @param mongo
 */
export const add: AppCallback<Vote> = async (message, mongo) => {
    return mongo.collection('vote')
        .updateOne({
            'vote.assembly_id': message.body.assembly_id,
            'vote.issue_id': message.body.issue_id,
            'vote.document_id': message.body.document_id,
            'vote.category': message.body.category,
            'vote.vote_id': message.body.vote_id,
        }, {
            $set: {
                vote: {
                    ...message.body,
                    date: new Date(`${message.body.date}+00:00`),
                },
                votes: [],
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Vote.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id})`);
            }
            return `Vote.add(${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.document_id})`;
        });
};

/**
 * Adds a vote-item to the votes array in the vote collection.
 * This is the individual vote, while the vote collection holds the outcome
 * of the (63) vote-item cast.
 *
 * client: fetch vote
 *         fetch congressman
 *
 * @param message
 * @param mongo
 * @param client
 */
export const addItem: AppCallback<VoteItem> = async (message, mongo, client) => {
    const vote: Vote = await client!(`/samantekt/atkvaedi/${message.body.vote_id}`);
    const congressman = await client!(`/samantekt/thingmenn/${message.body.congressman_id}`, {dags: vote.date});

    return mongo.collection('vote')
        .updateOne({
            'vote.assembly_id': vote.assembly_id,
            'vote.issue_id': vote.issue_id,
            'vote.document_id': vote.document_id,
            'vote.category': vote.category,
            'vote.vote_id': message.body.vote_id,
        }, {
            $addToSet: {
                votes: {
                    vote: message.body,
                    congressman: congressman
                }
            }
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Vote.addItem(${message.body.vote_id})`);
            }
            return `Vote.addItem(${message.body.vote_id})`;
        });
};
