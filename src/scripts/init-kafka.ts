import { Kafka, SASLOptions } from 'kafkajs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const username = process.env.KAFKA_USERNAME;
const password = process.env.KAFKA_PASSWORD;

const isProduction = !!(username && password);

const sasl: SASLOptions | undefined = isProduction
    ? { mechanism: 'plain', username: username!, password: password! }
    : undefined;

const kafka = new Kafka({
    clientId: 'mlm-init',
    brokers: brokers,
    ssl: isProduction,
    sasl: sasl,
});

export const TOPICS = [
    'payment.confirmed',
    'plan.activated',
    'income.calculated',
    'autopool.updated',
    'wallet.credited',
];

async function init() {
    console.log('🚀 Initializing Kafka Topics...');
    const admin = kafka.admin();

    try {
        await admin.connect();
        console.log('✅ Connected to Kafka Admin');

        const existingTopics = await admin.listTopics();
        const topicsToCreate = TOPICS.filter(t => !existingTopics.includes(t));

        if (topicsToCreate.length === 0) {
            console.log('✨ All topics already exist.');
        } else {
            console.log(`📦 Creating topics: ${topicsToCreate.join(', ')}`);
            await admin.createTopics({
                topics: topicsToCreate.map(topic => ({
                    topic,
                    numPartitions: 1,
                    replicationFactor: isProduction ? 3 : 1, // Confluent Cloud requires 3
                })),
            });
            console.log('✅ Topics created successfully!');
        }
    } catch (error) {
        console.error('❌ Failed to create topics:', error);
    } finally {
        await admin.disconnect();
    }
}

init();
