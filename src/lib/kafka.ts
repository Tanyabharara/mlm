import { Kafka, Producer, Consumer } from 'kafkajs';

const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

const kafka = new Kafka({
    clientId: 'mlm-payment-system',
    brokers: brokers,
});

let producer: Producer;

export async function getProducer() {
    if (!producer) {
        producer = kafka.producer();
        await producer.connect();
        console.log("✅ Kafka Producer Connected");
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
