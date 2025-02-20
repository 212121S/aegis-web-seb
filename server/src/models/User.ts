// server/src/models/user.ts
import { Collection, WithId } from "mongodb";
import { client } from "../database"; // see below how to define client in database.ts

// Basic interface (equivalent to Mongoose's IUser)
export interface IUser {
  email: string;
  username: string;
  password: string;
  phone: string;
  role?: string; // "student" or others
}

/**
 * Utility function that returns the "users" collection.
 * Add your DB name below (e.g. "aegis").
 */
export function getUserCollection(): Collection<IUser> {
  const dbName = "aegis"; // Or read from env if needed
  return client.db(dbName).collection<IUser>("users");
}