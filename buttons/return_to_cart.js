
import {
    ButtonInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    StringSelectMenuBuilder,
    ContainerBuilder,
    Colors,
    TextDisplayBuilder
} from "discord.js";
import "dotenv/config";
import { MongoClient, ServerApiVersion } from "mongodb";

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

            interaction.message.editable &&
            await interaction.message.edit({
                embeds: [
                    interaction.message.embeds[0]
                ],
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecione uma loja!')
                        .setCustomId('cart_select_store')
                        .setOptions(stores.map(store => {
                            return {label: store.name, value: store.id, emoji: store.emoji}
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Fechar carrinho')
                        .setEmoji('🚮')
                        .setCustomId('close_cart')
                        .setStyle(ButtonStyle.Danger)
                    ])
                ]
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
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
            await interaction.deferReply().then(reply => reply?.delete());
            await mongoClient.close();
        };
    }
};
