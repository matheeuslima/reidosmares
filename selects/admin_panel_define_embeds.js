import {
    ActionRowBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle,
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
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {
        
        try {
            await mongoClient.connect();
            const embed = await mongoClient.db().collection("embeds").findOne({id: interaction.values[0]});

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`define_embed:${interaction.values[0]}`)
                .setTitle('Defina o embed')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`embed_code`)
                        .setLabel('Código do Embed')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Layout do site da Loritta. {content: "", embed: {}}')
                        .setValue(embed.code)
                        .setMaxLength(4000)
                        .setRequired(true)
                    )
                )
            );
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await mongoClient.close();
        }
    }

}