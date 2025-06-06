import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

// Connect to the in-memory database
export const connect = async () => {
  try {
    // Check if there's an existing connection and close it
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create new MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error("Error connecting to in-memory database:", error);
    throw error;
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
