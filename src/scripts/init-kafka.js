const { Kafka } = require('kafkajs');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    });
}

try {
    loadEnv();
} catch (e) { }

const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const username = process.env.KAFKA_USERNAME;
const password = process.env.KAFKA_PASSWORD;

console.log('Connecting to:', brokers);
console.log('Username:', username ? 'PRESENT' : 'MISSING');

const kafka = new Kafka({
    clientId: 'mlm-init-final',
    brokers: brokers,
    ssl: true,
    sasl: { mechanism: 'plain', username: username, password: password },
    connectionTimeout: 30000,
    requestTimeout: 30000,
});

async function init() {
    const admin = kafka.admin();
    console.log('⏳ Connecting to Admin...');
    await admin.connect();
    console.log('✅ Connected');

    const topics = [
        'payment.confirmed',
        'plan.activated',
        'income.calculated',
        'autopool.updated',
        'wallet.credited',
    ];

    console.log('⏳ Creating Topics...');
    const result = await admin.createTopics({
        waitForLeaders: true,
        topics: topics.map(t => ({
            topic: t,
            numPartitions: 1,
            replicationFactor: 3
        }))
    });

    console.log('✅ Result:', result ? 'Created' : 'Already Exist');
    await admin.disconnect();
}

init().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
