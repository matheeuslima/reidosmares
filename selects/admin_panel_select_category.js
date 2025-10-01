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
            const category = await client.db().collection('product_categories').findOne({id: interaction.values[0]});
            if(!category) return interaction.reply({content: `Categoria de produtos não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_category:${interaction.values[0]}`)
                .setTitle('Editar categoria de produtos')
                .setComponents([
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('category_name')
                        .setLabel('Nome da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Eletrônicos')
                        .setRequired(true)
                        .setValue(category.name)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('category_emoji')
                        .setLabel('Emoji da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 📱')
                        .setRequired(true)
                        .setValue(category.emoji)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('category_description')
                        .setLabel('Descrição da Categoria')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Descreva a categoria para os clientes.')
                        .setRequired(true)
                        .setValue(category.description)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('category_id')
                        .setLabel('ID da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: eletronicos')
                        .setRequired(true)
                        .setValue(category.id)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('category_store')
                        .setLabel('Loja da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: loja1')
                        .setRequired(true)
                        .setValue(category.store || '')
                    )
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