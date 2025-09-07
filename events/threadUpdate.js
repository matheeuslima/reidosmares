import client from "../src/Client.js";
import "dotenv/config";

export default {
    name: 'threadUpdate',

    /**
     * @param {import("discord.js").AnyThreadChannel} oldThread 
     * @param {import("discord.js").AnyThreadChannel} newThread 
     */
    async execute(oldThread, newThread) {
        if (client.tickets?.has(newThread.id) && newThread.archived) {
            client.tickets.delete(newThread.id);
            newThread.delete('Carrinho finalizado');
        }
    }
};