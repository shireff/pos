import { MongoClient, Db } from 'mongodb';
import { initEncryption } from './encryption';

const DEFAULT_LOCAL_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME ?? 'pos';

/**
 * MongoConnection manages the singleton connection to the local embedded MongoDB instance.
 * Encryption is initialized after connection is established.
 */
export class MongoConnection {
  private static instance: MongoConnection | null = null;
  private client: MongoClient;
  private dbInstance: Db | null = null;
  private readonly uri: string;
  private readonly dbName: string;

  private constructor(uri: string, dbName: string) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(uri, {
      // Keep a warm socket so an idle/paused cluster doesn't force a full
      // reconnection on the next request.
      minPoolSize: 1,
      maxPoolSize: 10,
      // Bound how long we wait for a server — fail fast instead of hanging.
      serverSelectionTimeoutMS: 30_000,
      connectTimeoutMS: 30_000,
      socketTimeoutMS: 0,
      maxIdleTimeMS: 0,
    });
  }

  public static getInstance(uri?: string, dbName?: string): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection(
        uri ?? DEFAULT_LOCAL_URI,
        dbName ?? DEFAULT_DB_NAME,
      );
    }
    return MongoConnection.instance;
  }

  /**
   * Establishes connection and initialises field-level encryption.
   *
   * The connection is cached first so it can be reused even if encryption
   * initialisation fails (e.g. CSFLE unsupported on a free Atlas tier). This
   * prevents every request from re-establishing a slow cold connection.
   */
  public async connect(): Promise<void> {
    if (this.dbInstance) return;
    await this.client.connect();
    this.dbInstance = this.client.db(this.dbName);
    try {
      await initEncryption(this.client);
    } catch (error) {
      console.error(
        '[MongoConnection] encryption init failed; continuing without CSFLE:',
        error,
      );
    }
  }

  /**
   * Returns the active Db instance.
   * Throws if connect() has not been called first.
   */
  public db(): Db {
    if (!this.dbInstance) {
      throw new Error('MongoConnection is not connected. Call connect() first.');
    }
    return this.dbInstance;
  }

  /**
   * Returns the raw MongoClient.
   */
  public getClient(): MongoClient {
    return this.client;
  }

  /**
   * Closes the connection and resets the singleton.
   */
  public async disconnect(): Promise<void> {
    await this.client.close();
    this.dbInstance = null;
    MongoConnection.instance = null;
  }
}
