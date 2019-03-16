import {Db, MongoClient, MongoClientOptions} from "mongodb";

export default class MongoMock {

    url: string;
    options: MongoClientOptions;

    mongo: MongoClient | undefined;
    db: Db | undefined;

    constructor(uri?: string, options?: MongoClientOptions) {
        this.url = uri || `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`;
        this.options = options || {
            useNewUrlParser: true,
            // auth: {user: '', password: ''}
        };
    }

    open = async (name: string): Promise<Db> => {
        this.mongo = await MongoClient.connect(this.url, this.options);
        this.db = this.mongo.db(name);

        return Promise.resolve(this.db);
    };

    close = async () => {
        this.db && await this.db!.dropDatabase();
        this.mongo && await this.mongo!.close();

        return Promise.resolve();
    };
}
