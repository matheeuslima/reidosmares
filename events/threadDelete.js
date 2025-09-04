import { Collection } from "discord.js";
import client from "../src/Client.js";
import "dotenv/config";

export default {
    name: 'threadDelete',

    /**
     * @param {import("discord.js").AnyThreadChannel} thread 
     */
    async execute(thread) {
        if (client.tickets?.has(thread.id)) {
            client.tickets = client.tickets.filter(value => value != thread.id);
        }
    }
};