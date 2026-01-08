import { ActionRowBuilder, LabelBuilder, MessageFlags, ModalBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
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
            const store = await mongoClient.db().collection('stores').findOne({id: interaction.values[0]});
            if(!store) return interaction.reply({content: `Loja não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_store:${interaction.values[0]}`)
                .setTitle('Editar loja')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Loja Oficial')
                        .setRequired(true)
                        .setValue(store.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 🏬')
                        .setRequired(true)
                        .setValue(store.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_id')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: loja1')
                        .setRequired(true)
                        .setValue(store.id)
                    ),
                ])
            )
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await mongoClient.close();
        }
    }

}