
export const mongoDbConfig = {
    url: `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}/${process.env.STORE_DB || 'althingi'}`,
    options: {
        useNewUrlParser: true,
        // auth: {
        //     user: process.env.STORE_USER || 'wo',
        //     password: process.env.STORE_PASSWORD || 'long@pass!123',
        // },
    }
};

export const rabbitMqConfig = {
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

export const rabbitMqOptions = {
    deadLetterExchange: 'dlq.aggregate.exchange'
};

export const apiConfig = {
    host: process.env.API_HOST || 'localhost',
    port: process.env.API_PORT || 8080,
};

export const elasticsearchConfig = {
    node: `${process.env.SEARCH_PROTOCOL || 'http'}://${process.env.SEARCH_HOST || 'localhost'}:${process.env.SEARCH_PORT || '9200'}`,
};
