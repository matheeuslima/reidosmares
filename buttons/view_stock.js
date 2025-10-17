import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    MessageFlags,
    ModalBuilder,
    TextDisplayBuilder,
} from "discord.js";
import client from "../src/Client.js";
import botConfig from "../config.json" with { type: "json" };
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {

        try {
            await mongoClient.connect();
            const products = await mongoClient.db().collection('products').find().toArray();
            await interaction.showModal(
                new ModalBuilder()
                .setTitle('Estoque')
                .setCustomId('stockhold')
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent(`${products.map(p => p.name).join('\n')}`)
                )
            )
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral] });
        } finally {
            await mongoClient.close();
        }

    }
}