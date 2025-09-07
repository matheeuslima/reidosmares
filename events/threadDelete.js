import client from "../src/Client.js";
import "dotenv/config";

export default {
    name: 'threadDelete',

    /**
     * @param {import("discord.js").AnyThreadChannel} thread 
     */
    async execute(thread) {
        client.tickets?.has(thread.id) && 
        client.tickets.delete(thread.id);
    }
};