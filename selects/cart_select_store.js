import {
    StringSelectMenuInteraction,
    MessageFlags,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    Colors,
    TextDisplayBuilder
} from "discord.js";
import client from "../src/Client.js";
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
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            // storeId selecionado
            const storeId = interaction.values[0];
            const ticket = client.tickets.get(interaction.channelId);
            if (ticket) {
                ticket.store = storeId;
                client.tickets.set(interaction.channelId, ticket);
            }

            // Busca categorias da loja selecionada
            const categories = await mongoClient.db().collection('product_categories').find({ store: storeId }).toArray();
            if (!categories.length) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Nenhuma categoria disponível para esta loja.\`\`\``)
                    ])
                ]
            });

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
            
            const components = [
                new ActionRowBuilder()
                .addComponents(select),
                new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setLabel('Voltar')
                    .setEmoji('⬅️')
                    .setCustomId('back_cart_stores')
                    .setStyle(ButtonStyle.Secondary),
                ])
            ];

            if (client.tickets?.get(interaction.channelId)?.cart?.length) {
                components[1].addComponents(
                    new ButtonBuilder()
                    .setLabel('Editar carrinho')
                    .setEmoji('✏️')
                    .setCustomId('edit_cart')
                    .setStyle(ButtonStyle.Secondary)
                );
            };

            components[1].addComponents(
                new ButtonBuilder()
                .setLabel('Fechar carrinho')
                .setCustomId('close_cart')
                .setEmoji('🚮')
                .setStyle(ButtonStyle.Danger)
            );

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
            await mongoClient.close();
        };
    }
};