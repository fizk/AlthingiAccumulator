
export const mongoDbConfig = {
    url: `mongodb://${process.env.STORE_HOST || 'localhost'}:${process.env.STORE_PORT || '27017'}`,
    options: {
        useNewUrlParser: true,
        // auth: {user: '', password: ''}
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
    deadLetterExchange: 'dlq.service'
};

export const apiConfig = {
    host: process.env.API_HOST || 'localhost',
    port: process.env.API_PORT || 8080,
};
