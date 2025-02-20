"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCollection = void 0;
const database_1 = require("../database"); // see below how to define client in database.ts
/**
 * Utility function that returns the "users" collection.
 * Add your DB name below (e.g. "aegis").
 */
function getUserCollection() {
    const dbName = "aegis"; // Or read from env if needed
    return database_1.client.db(dbName).collection("users");
}
exports.getUserCollection = getUserCollection;
