// server/src/models/question.ts
import { Collection } from "mongodb";
import { client } from "../database";

export interface IQuestion {
  prompt: string;
  choices: string[];
  correctAnswer: string;
  difficulty: number;
}

/**
 * Returns the "questions" collection from the "aegis" DB.
 */
export function getQuestionCollection(): Collection<IQuestion> {
  const dbName = "aegis";
  return client.db(dbName).collection<IQuestion>("questions");
}