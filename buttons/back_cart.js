import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";
import client from "../src/Client.js";

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

            const categories = await mongoClient.db().collection('product_categories').find({ store: client.tickets.get(interaction.channelId).store }).toArray();

            interaction.message.editable && await interaction.message.edit({
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecione uma categoria!')
                        .setCustomId('cart_select_category')
                        .setOptions(categories.map(category => {
                            return {label: category.name, value: category.id, emoji: category.emoji, description: category.description}
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
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

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                    
                ]
            });
        } finally {
            await interaction.deferReply().then(reply => reply.delete());
            await mongoClient.close();
        };
    }
};