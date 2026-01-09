import {
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Colors,
    ContainerBuilder,
    TextDisplayBuilder,
    LabelBuilder
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

            // mais de 25 no carrinho
            if(ticket.cart.length + products.length > 25) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Você atingiu o limite máximo de 25 produtos no carrinho.\`\`\``)
                    ])
                ]
            });

            // produto repetido
            if(ticket.cart.find(p => products.map(pr => pr.id).includes(p.id))) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Você já adicionou um ou mais destes produtos em seu carrinho anteriormente.\`\`\``)
                    ])
                ]
            });

            // sem estoque
            if(products.filter(p => p.stock).length==0) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`O estoque deste(s) produto(s) está esgotado.\`\`\``)
                    ])
                ]
            });

            // modal
            const modal = new ModalBuilder()
            .setCustomId(`cart_set_product_amount:${products.filter(p => p.stock).map(p => p.id).join(",")}`)
            .setTitle('Defina a quantidade de cada produto');

            products.filter(p => p.stock).forEach(product => {
                const input = new TextInputBuilder()
                .setCustomId(`amount_${product.id}`)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(3)
                .setPlaceholder(`Máx.: ${product.stock}`)
                .setValue('1')
                .setRequired(true);

                modal.addLabelComponents(new LabelBuilder().setLabel(`Quantidade de ${product.name}`).setTextInputComponent(input));
            });

            await interaction.showModal(modal);

            // O restante do fluxo (adicionar ao carrinho) deve ser feito no handler do modal
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
                interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
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