import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { User, InsertUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    
    return user;
  }
}

export const storage = new DatabaseStorage();
