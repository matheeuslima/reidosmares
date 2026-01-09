import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    TextDisplayBuilder
} from "discord.js";
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
            const products = (await mongoClient.db().collection('products').find({category: interaction.values[0]}).toArray()).filter(p => p.stock > 0);
            if(!products?.length) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Não há produtos em estoque nessa categoria.\`\`\``)
                    ])
                ]
            });

            await interaction.deferReply().then(reply => reply?.delete());

            interaction?.message?.editable &&
            interaction.message.edit({
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecionar produtos')
                        .setCustomId('cart_select_product')
                        .setMinValues(1)
                        .setMaxValues(products.length>5 ? 5 : products.length)
                        .setOptions(products.map(product => {
                            return {
                                label: product.name,
                                value: product.stock ? product.id : `${product.id}-unavailable`,
                                emoji: product.emoji,
                                description: `Preço: R$${product.price} | Estoque: ${product.stock >= 1_000_000 ? '∞' : (product.stock || 'Sem estoque')}`
                            }
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Voltar')
                        .setEmoji('⬅️')
                        .setCustomId('back_cart')
                        .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                        .setLabel('Finalizar carrinho e ir à compra')
                        .setEmoji('🤑')
                        .setCustomId('follow_purchase')
                        .setStyle(ButtonStyle.Primary)
                    ])
                ]
            })
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