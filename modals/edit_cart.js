import {
    ModalSubmitInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
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
     * @param {ModalSubmitInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const ticket = client.tickets.get(interaction.channelId);
            if (!ticket || !ticket.cart || ticket.cart.length === 0) {
                return await interaction.reply({
                    content: 'Seu carrinho está vazio.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Nova lógica: editar apenas o produto selecionado
            const selectedProductId = interaction.fields.getField('edited_product')?.value;
            const amountStr = interaction.fields.getTextInputValue('edited_amount');
            let amount = parseInt(amountStr);
            if (isNaN(amount)) amount = undefined;

            let updated = false;
            ticket.cart = ticket.cart.map(product => {
                if (product.id === selectedProductId) {
                    if (amount === 0) {
                        updated = true;
                        return null; // remove
                    } else if (typeof amount === 'number' && !isNaN(amount)) {
                        updated = true;
                        return { ...product, amount: Math.min(amount, product.stock) };
                    }
                }
                return product;
            }).filter(Boolean);

            client.tickets.set(interaction.channelId, ticket);

            await interaction.deferReply().then(reply => reply.delete());

            // Atualiza embed do carrinho
            if (interaction.message && interaction.message.editable) {
                await interaction.message.edit({
                    embeds: [
                        new EmbedBuilder(interaction.message.embeds[0].data)
                            .setFields(ticket.cart.length ? [
                                {
                                    name: `🛒 Carrinho`,
                                    value: ticket.cart.map(product => `- ${product.amount}x ${product.name} (R$${product.price.toFixed(2)})`).join('\n') || 'Nenhum produto adicionado ainda.',
                                    inline: true
                                },
                                {
                                    name: `💰 Total`,
                                    value: `R$${ticket.cart.reduce((acc, product) => acc + product.price * product.amount, 0).toFixed(2)}`,
                                    inline: true
                                }
                            ] : [])
                    ],
                    components: ticket.cart.length ? [
                        interaction.message.components[0],
                        new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                    .setLabel('Voltar')
                                    .setEmoji('⬅️')
                                    .setCustomId('back_cart')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setLabel('Ir para o pagamento')
                                    .setCustomId('follow_purchase')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('🤑'),
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
                    ] : [
                        interaction.message.components[0],
                        new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                    .setLabel('Voltar')
                                    .setEmoji('⬅️')
                                    .setCustomId('back_cart')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setLabel('Ir para o pagamento')
                                    .setCustomId('follow_purchase')
                                    .setStyle(ButtonStyle.Primary)
                                    .setEmoji('🤑'),
                                new ButtonBuilder()
                                    .setLabel('Fechar carrinho')
                                    .setCustomId('close_cart')
                                    .setEmoji('🚮')
                                    .setStyle(ButtonStyle.Danger)
                            ])
                    ]
                });
            }

        } catch (error) {
            console.error(error);

            await interaction.reply({
                content: `❌ Houve um erro ao tentar editar o carrinho: \`${error.message}\``,
                flags: [MessageFlags.Ephemeral]
            });
        } finally {
            await mongoClient.close();
        }
    }
};