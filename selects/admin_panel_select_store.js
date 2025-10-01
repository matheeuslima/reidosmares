import { ActionRowBuilder, MessageFlags, ModalBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
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
            const store = await client.db().collection('stores').findOne({id: interaction.values[0]});
            if(!store) return interaction.reply({content: `Loja não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_store:${interaction.values[0]}`)
                .setTitle('Editar loja')
                .setComponents([
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('store_name')
                        .setLabel('Nome da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Loja Oficial')
                        .setRequired(true)
                        .setValue(store.name)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('store_emoji')
                        .setLabel('Emoji da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 🏬')
                        .setRequired(true)
                        .setValue(store.emoji)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('store_id')
                        .setLabel('ID da Loja')
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
            await client.close();
        }
    }

}