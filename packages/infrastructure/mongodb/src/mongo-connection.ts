import { MongoClient, Db } from 'mongodb';
import { initEncryption } from './encryption';

const DEFAULT_LOCAL_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const DEFAULT_DB_NAME = process.env.MONGODB_DB_NAME ?? 'smart_retail_os';

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
    this.client = new MongoClient(this.uri);
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
   */
  public async connect(): Promise<void> {
    if (this.dbInstance) return;
    await this.client.connect();
    this.dbInstance = this.client.db(this.dbName);
    await initEncryption(this.client);
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
