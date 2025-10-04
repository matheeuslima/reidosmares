import {
    StringSelectMenuInteraction,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
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

            // storeId selecionado
            const storeId = interaction.values[0];
            const ticket = client.tickets.get(interaction.channelId);
            if (ticket) {
                ticket.store = storeId;
                client.tickets.set(interaction.channelId, ticket);
            }

            // Busca categorias da loja selecionada
            const categories = await dbClient.db().collection('product_categories').find({ store: storeId }).toArray();
            if (!categories.length) return await interaction.reply({ content: 'Nenhuma categoria disponível para esta loja.', flags: [MessageFlags.Ephemeral] });

            await interaction.deferReply().then(reply => reply?.delete());
            
            const select = new StringSelectMenuBuilder()
                .setCustomId('cart_select_category')
                .setPlaceholder('Selecione uma categoria!')
                .setOptions(categories.map(category => ({
                    label: category.name,
                    value: category.id,
                    description: category.description || undefined,
                    emoji: category.emoji || undefined
                })));

            interaction.message.editable && await interaction.message.edit({
                components: [
                    new ActionRowBuilder().addComponents(select),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Voltar')
                        .setEmoji('⬅️')
                        .setCustomId('back_cart_stores')
                        .setStyle(ButtonStyle.Secondary),
                    ])
                ]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: `Erro ao buscar categorias: ${error.message}`, flags: [MessageFlags.Ephemeral] });
        } finally {
            await dbClient.close();
        }
    }
}
