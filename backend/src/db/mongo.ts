import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectMongo() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  console.log('[mongo] connected');
}
