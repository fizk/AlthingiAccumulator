import {Db} from "mongodb";
import {HttpQuery, Issue} from "../../@types";

type Message = {body: Issue, id: string};

export const createUpdate = (
    message: Message,
    mongo: Db,
    client: HttpQuery,
    ack: () => void) => {

    return mongo.collection('issue')
        .updateOne({
            'issue.assembly_id': message.body.assembly_id,
            'issue.issue_id': message.body.issue_id,
            'issue.category': message.body.category,
        }, {
            $set: {issue: message.body}
        }, {
            upsert: true
        }).then(result => {
            if (!result.result.ok) {
                throw new Error(`Could not create/update issue.issue [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}]`);
            }
            ack();
            console.log(`issue.issue [${message.body.assembly_id}, ${message.body.issue_id}, ${message.body.category}] created/updated`);

        }).catch((error: Error) => {
            console.error(`${error.name}: ${error.message}`);
        });
};
