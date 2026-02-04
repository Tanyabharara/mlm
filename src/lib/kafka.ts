import { Kafka, Producer, Consumer, SASLOptions } from 'kafkajs';

const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const username = process.env.KAFKA_USERNAME;
const password = process.env.KAFKA_PASSWORD;

// Automactically determine if we need SSL/SASL (for Upstash/Confluent)
const isProduction = !!(username && password);

const sasl: SASLOptions | undefined = isProduction
    ? { mechanism: 'plain', username: username!, password: password! }
    : undefined;

const kafka = new Kafka({
    clientId: 'mlm-payment-system',
    brokers: brokers,
    ssl: isProduction,
    sasl: sasl,
    connectionTimeout: 10000,
    requestTimeout: 30000,
    retry: {
        initialRetryTime: 300,
        retries: 5
    },
});

let producer: Producer;

export async function getProducer() {
    if (!producer) {
        producer = kafka.producer();
        await producer.connect();
        console.log(`✅ Kafka Producer Connected (${isProduction ? 'Cloud' : 'Local'})`);
    }
    return producer;
}

export async function getConsumer(groupId: string): Promise<Consumer> {
    const consumer = kafka.consumer({ groupId });
    await consumer.connect();
    return consumer;
}

export const TOPICS = {
    PAYMENT_CONFIRMED: 'payment.confirmed',
    PLAN_ACTIVATED: 'plan.activated',
    INCOME_CALCULATED: 'income.calculated',
    AUTOPOOL_UPDATED: 'autopool.updated',
    WALLET_CREDITED: 'wallet.credited',
};
