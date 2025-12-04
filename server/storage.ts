import { randomUUID } from "crypto";

// Simple in-memory storage interface for future use
// Currently the sentiment analysis app is stateless and doesn't require storage

export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
