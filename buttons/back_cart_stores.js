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

            const stores = await mongoClient.db().collection('stores').find().toArray();

            const components = [
                new ActionRowBuilder()
                .setComponents([
                    new StringSelectMenuBuilder()
                    .setPlaceholder('Selecione uma loja!')
                    .setCustomId('cart_select_store')
                    .setOptions(stores.map(store => {
                        return {label: store.name, value: store.id, emoji: store.emoji}
                    }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                ])
            ];

            if (client.tickets?.get(interaction.channelId)?.cart?.length) {
                components.push(
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Editar carrinho')
                        .setEmoji('✏️')
                        .setCustomId('edit_cart')
                        .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                        .setLabel('Fechar carrinho')
                        .setCustomId('close_cart')
                        .setEmoji('🚮')
                        .setStyle(ButtonStyle.Danger)
                    ])
                );
            } else {
                components.push(
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Fechar carrinho')
                        .setCustomId('close_cart')
                        .setEmoji('🚮')
                        .setStyle(ButtonStyle.Danger)
                    ])
                );
            }

            interaction.message.editable && await interaction.message.edit({
                components: components
            });
        } catch (error) {
            console.error(error);

            const errorContainer = new ContainerBuilder()
            .setAccentColor(Colors.Red)
            .addTextDisplayComponents([
                new TextDisplayBuilder()
                .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                new TextDisplayBuilder()
                .setContent(`\`\`\`${error.message}\`\`\``)
            ]);
            
            if (!interaction.replied) {
                await interaction.reply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else if ((await interaction.fetchReply()).editable) {
                await interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                await interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await interaction.deferReply().then(reply => reply.delete());
            await mongoClient.close();
        };
    }
};