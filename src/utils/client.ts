import {createClient, type RedisClientType} from 'redis';

let client: RedisClientType | null = null;

export async function initializeRedisClient() {
    if (!client) {

        client = createClient();

        client.on('error', (error: Error) => console.error('Redis Client Error', error));

        client.on('connect', () => {
            console.log('Redis Connected');
        });

        client =  await client.connect();
    }
    return client;
}