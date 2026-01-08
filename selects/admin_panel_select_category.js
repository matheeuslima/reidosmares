import { ActionRowBuilder, LabelBuilder, MessageFlags, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
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
            const category = await mongoClient.db().collection('product_categories').findOne({id: interaction.values[0]});
            if(!category) return interaction.reply({content: `Categoria de produtos não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_category:${interaction.values[0]}`)
                .setTitle('Editar categoria de produtos')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Eletrônicos')
                        .setRequired(true)
                        .setValue(category.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 📱')
                        .setRequired(true)
                        .setValue(category.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('Descrição da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_description')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Descreva a categoria para os clientes.')
                        .setRequired(true)
                        .setValue(category.description)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_id')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: eletronicos')
                        .setRequired(true)
                        .setValue(category.id)
                    ),
                    new LabelBuilder()
                    .setLabel('Loja da Categoria')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId('category_store')
                        .setPlaceholder(`${category.store || 'Nenhuma'}`.substring(0, 100))
                        .addOptions((await mongoClient.db().collection('stores').find().toArray()).map(store => {
                            return {
                                label: store.name,
                                description: store.id,
                                value: store.id,
                                emoji: store.emoji || undefined,
                                default: store.id === category.store
                            }
                        }))
                    )
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