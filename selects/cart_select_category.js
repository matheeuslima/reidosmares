import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Collection,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI, {
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
            await client.connect();
            const products = await client.db().collection('products').find({category: interaction.values[0]}).toArray();

            await interaction.deferReply().then(reply => reply?.delete());

            interaction?.message?.editable &&
            interaction.message.edit({
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecionar produtos')
                        .setCustomId('cart_select_product')
                        .setOptions(products.map(product => {
                            return {
                                label: `${product.name} (R$${product.price})`,
                                value: product.id,
                                emoji: product.emoji,
                                description: product.description
                            }
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Voltar')
                        .setCustomId('voltar1')
                        .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                        .setLabel('Prosseguir ao carrinho')
                        .setCustomId('prosseguir')
                        .setStyle(ButtonStyle.Primary)
                    ])
                ]
            })
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }

}