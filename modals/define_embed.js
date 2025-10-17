import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import botConfig from "../config.json" with { type: "json" };
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
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await client.connect();

            const embedCode = JSON.parse(interaction.fields.getTextInputValue('embed_code'));
            const editedEmbed = interaction.customId.split(":")[1];
            const messageContent = embedCode['content'];
            const messageEmbed = embedCode['embed'];

            await client.db().collection("embeds").findOneAndUpdate(
                {id: editedEmbed},
                {$set: {
                    id: editedEmbed,
                    code: interaction.fields.getTextInputValue('embed_code')
                }},
                {upsert: true, returnDocument: 'after'}
            )

            switch (editedEmbed) {
                case "new_cart": {
                    await interaction.guild.channels.cache.get(botConfig.channel.newCart).send({
                        content: messageContent,
                        embeds: [messageEmbed],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                .setLabel('Abrir carrinho!')
                                .setEmoji('🛒')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('create_cart'),
                                new ButtonBuilder()
                                .setLabel('Ver estoque')
                                .setEmoji('📦')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('view_stock'),
                            ])
                        ]
                    })
                    break;
                }
                default: {
                    break;
                }
            }

            await interaction.reply({
                content: messageContent,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`${editedEmbed} alterado com sucesso`),
                    messageEmbed
                ],
                flags: [MessageFlags.Ephemeral]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }

}