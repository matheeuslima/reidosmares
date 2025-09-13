import { Message } from "discord.js";
import client from "../src/Client.js";
import botConfig from "../config.json" with { type: "json" };
import "dotenv/config";

export default {
    name: 'messageCreate',

    /**
     * @param {Message} message 
     */
    async execute(message) {
        if (message.author.bot) return;

        if(message.channelId === botConfig.channel.reviews) message.react('❤');

        if(client.tickets?.get(message.channelId)) {
            const ticket = client.tickets.get(message.channelId);
            if(!ticket) return;
            
            if((message.member.roles.cache.has(botConfig.role.owner) || botConfig.owners.includes(message.author.id)) && !ticket.seller) {
                ticket.seller = message.author.id;
                client.tickets.set(message.channelId, ticket);
            }
        }
    }
};