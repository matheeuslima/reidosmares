import {
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuInteraction
} from "discord.js";
import client from "../src/Client.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const dbClient = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export default {
    /**
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await dbClient.connect();

            const ticket = client.tickets.get(interaction.channelId);

            const products = await dbClient.db().collection('products').find({
                id: { $in: interaction.values }
            }).toArray();

            if (!ticket.cart) ticket.cart = [];
            
            products.forEach(product => {
                ticket.cart.push(product);
            });

            client.tickets.set(interaction.channelId, ticket);

            await interaction.reply({ content: 'Produtos adicionados ao carrinho!', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral] });
            }
        } finally {
            await dbClient.close();

            interaction.message.editable &&
            await interaction.message.edit({
                embeds: [
                    new EmbedBuilder(interaction.message.embeds[0].data)
                    .setFields([
                        {
                            name: `🛒 Carrinho`,
                            value: `Produtos no carrinho: ${client.tickets.get(interaction.channelId)?.cart?.length || 0}`,
                            inline: true
                        }
                    ])
                ],
            });
        }
    }
}