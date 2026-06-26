import mongoose from 'mongoose';

import { logger } from '../shared/logger.js';

import { config } from './index.js';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB Connected successfully`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
