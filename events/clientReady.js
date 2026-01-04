import { Client, Collection } from "discord.js";
import projectPackage from "../package.json" with { type: "json" };
import botConfig from "../config.json" with { type: "json" };
import { deployCommands } from "../src/Client.js";
import clientComponent from "../src/Client.js";
import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default {
    name: 'clientReady',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O ${botConfig.name} ${projectPackage.version} está ligado e operando em ${(await client.guilds.fetch()).size} servidores.`);
        await deployCommands(process.env.DISCORD_GUILD_ID);

        try {
            await mongoClient.connect();
            const ticketsData = await mongoClient.db().collection('tickets').findOne({ id: "tickets" });

            if (ticketsData && Array.isArray(ticketsData.value)) {
                client.tickets = new Collection(ticketsData.value.map(ticket => [ticket.channelId, ticket]));
            } else {
                console.warn("Nenhum ticket válido encontrado ou o formato está incorreto.");
                client.tickets = new Collection();
            }

            await mongoClient.db().collection('tickets').deleteOne({ id: "tickets" });
        } catch (error) {
            console.error("Erro ao carregar os tickets:", error);
        } finally {
            await mongoClient.close();
            console.log('Tickets carregados.');
        }
    }
};