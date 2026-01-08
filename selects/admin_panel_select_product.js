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
            const product = await mongoClient.db().collection('products').findOne({id: interaction.values[0]});
            if(!product) return interaction.reply({content: `Produto não encontrado no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_product:${interaction.values[0]}`)
                .setTitle('Editar produto')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000 Sheckles`)
                        .setRequired(true)
                        .setValue(product.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Categoria do Produto')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId('product_category')
                        .setPlaceholder(`${product.category}`.substring(0, 100))
                        .addOptions((await mongoClient.db().collection('product_categories').find().toArray()).map(category => {
                            return {
                                label: category.name,
                                description: category.description.substring(0, 50),
                                value: category.id,
                                emoji: category.emoji || undefined,
                                default: category.id === product.category
                            }
                        }))
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 😁')
                        .setRequired(true)
                        .setValue(product.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('Preço do Produto (Unidade)')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_price')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 7.00 (apenas número com . para separar centavos se necessário)`)
                        .setRequired(true)
                        .setValue(product.price.toString())
                    ),
                    new LabelBuilder()
                    .setLabel('Estoque do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_stock')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Número inteiro de 0 ao infinito')
                        .setRequired(true)
                        .setValue(`${product.stock}`)
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