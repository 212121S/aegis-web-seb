"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuestionCollection = void 0;
const database_1 = require("../database");
/**
 * Returns the "questions" collection from the "aegis" DB.
 */
function getQuestionCollection() {
    const dbName = "aegis";
    return database_1.client.db(dbName).collection("questions");
}
exports.getQuestionCollection = getQuestionCollection;
