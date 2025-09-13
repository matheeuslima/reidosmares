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
            const product = await client.db().collection('products').findOne({id: interaction.values[0]});
            if(!product) return interaction.reply({content: `Produto não encontrado no banco de dados.`, flags: [MessageFlags.Ephemeral]});
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_product:${interaction.values[0]}`)
                .setTitle('Editar produto')
                .setComponents([
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('product_name')
                        .setLabel('Nome do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000 Sheckles`)
                        .setRequired(true)
                        .setValue(product.name)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('product_category')
                        .setLabel('ID da Categoria do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Uma das seguintes: ${(await client.db().collection('product_categories').find().toArray()).map(category => category.id).join(', ')}`)
                        .setRequired(true)
                        .setValue(product.category)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('product_description')
                        .setLabel('Descrição do Produto')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Descreva o produto para os clientes.')
                        .setRequired(true)
                        .setValue(product.description)
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('product_price')
                        .setLabel('Preço do Produto (Unidade)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 7.00 (apenas número com . para separar centavos se necessário)`)
                        .setRequired(true)
                        .setValue(product.price.toString())
                    ),
                    new ActionRowBuilder()
                    .setComponents(
                        new TextInputBuilder()
                        .setCustomId('product_stock')
                        .setLabel('Em estoque? ("sim" ou "não")')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('"sim" ou "não"')
                        .setRequired(true)
                        .setValue(product.hasStock ? 'sim' : 'não')
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