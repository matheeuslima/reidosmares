import {
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
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

            const ticket = client.tickets.get(interaction.channelId);

            const products = await mongoClient.db().collection('products').find({
                id: { $in: interaction.values }
            }).toArray();

            if (!ticket.cart) ticket.cart = [];

            if(ticket.cart.length + products.length > 25) return await interaction.reply({ content: 'Você atingiu o limite máximo de 25 produtos no carrinho.', flags: [MessageFlags.Ephemeral] });
            if(ticket.cart.find(p => products.map(pr => pr.id).includes(p.id))) return await interaction.reply({ content: 'Você já adicionou um ou mais desses produtos ao carrinho.', flags: [MessageFlags.Ephemeral] });
            if(products.filter(p => p.stock).length==0)  return await interaction.reply({ content: 'O estoque deste(s) produto(s) esgotou.', flags: [MessageFlags.Ephemeral] });

            const modal = new ModalBuilder()
            .setCustomId(`cart_set_product_amount:${products.filter(p => p.stock).map(p => p.id).join(",")}`)
            .setTitle('Defina a quantidade de cada produto');

            products.filter(p => p.stock).forEach(product => {
                const input = new TextInputBuilder()
                .setCustomId(`amount_${product.id}`)
                .setLabel(`Quantidade de ${product.name}`)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(3)
                .setPlaceholder(`Máx.: ${product.stock}`)
                .setValue('1')
                .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
            });

            await interaction.showModal(modal);

            // O restante do fluxo (adicionar ao carrinho) deve ser feito no handler do modal
        } catch (error) {
            console.error(error);
            if (!interaction.replied) {
                await interaction.reply({ content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral] });
            }
        } finally {
            await mongoClient.close();

            interaction.message.editable &&
            await interaction.message.edit({
                embeds: [
                    new EmbedBuilder(interaction.message.embeds[0].data)
                    .setFields([
                        {
                            name: `🛒 Carrinho`,
                            value: client.tickets?.get(interaction.channelId)?.cart?.map(product => `- ${product.amount}x ${product.name} (R$${product.price.toFixed(2)})`).join('\n') || 'Nenhum produto adicionado ainda.',
                            inline: true
                        },
                        {
                            name: `💰 Total`,
                            value: `R$${(client.tickets?.get(interaction.channelId)?.cart?.reduce((acc, product) => acc + product.price*product.amount, 0) || 0).toFixed(2)}`,
                            inline: true
                        }
                    ])
                ],
            });
        }
    }
}