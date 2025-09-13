import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    StringSelectMenuBuilder,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const categories = await mongoClient.db().collection('product_categories').find().toArray();
            const customEmbed = JSON.parse((await mongoClient.db().collection('embeds').findOne({id: 'cart_starter'})).code);

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
                        .setLabel('Fechar carrinho')
                        .setCustomId('close_cart')
                        .setEmoji('🚮')
                        .setStyle(ButtonStyle.Danger)
                    ])
                ]
            });
            
            await interaction.deferReply().then(reply => reply.delete());
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await mongoClient.close();
        }
    }

}