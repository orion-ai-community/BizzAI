import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect mongoose to in-memory database
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

// Cleanup after each test
afterEach(async () => {
    // Clear all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Cleanup after all tests
afterAll(async () => {
    // Close all active sessions first
    const sessions = await mongoose.connection.db?.admin()?.listSessions?.();

    // Disconnect mongoose
    await mongoose.disconnect();

    // Stop in-memory MongoDB
    if (mongoServer) {
        await mongoServer.stop();
    }

    // Give a small delay for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
});

