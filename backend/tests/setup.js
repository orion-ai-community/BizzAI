import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export const connect = async () => {
    // Prevent MongooseError: Can't call `openUri()` on an active connection with different connection strings
    await mongoose.disconnect();

    // Configure MongoDB Memory Server with longer timeout for instance startup
    mongoServer = await MongoMemoryServer.create({
        instance: {
            launchTimeout: 60000, // 60 seconds for instance to start
        },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
};

export const closeDatabase = async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
};

export const clearDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    }
};
