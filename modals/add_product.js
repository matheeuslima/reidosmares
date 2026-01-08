import {
    Colors,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
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
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const productName = interaction.fields.getTextInputValue('product_name');
            const productId = interaction.fields.getTextInputValue('product_id');
            const productEmoji = interaction.fields.getTextInputValue('product_emoji');
            const productCategory  = interaction.fields.getTextInputValue('product_category');
            const productPrice = interaction.fields.getTextInputValue('product_price');

            // limite de 25 produtos por categoria
            if((await mongoClient.db().collection("products").countDocuments({category: productCategory})) >= 25) return await interaction.reply({content: `A categoria "${productCategory}" já atingiu o limite máximo de 25 produtos.`, flags: [MessageFlags.Ephemeral]});
            
            // verifica se o ID do produto já existe
            if(await mongoClient.db().collection("products").findOne({id: productId})) return await interaction.reply({content: `Já existe um produto com o ID "${productId}".`, flags: [MessageFlags.Ephemeral]});

            // insere no banco
            await mongoClient.db().collection("products").insertOne({
                name: productName,
                id: productId,
                category: productCategory,
                emoji: productEmoji,
                price: parseFloat(productPrice),
                stock: 0
            })

            await interaction.reply({
                content: `Produto "${productId}" adicionado com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${productEmoji} ${productName}\n- Preço: R$${parseFloat(productPrice).toFixed(2)}\n- Categoria: ${productCategory}`)
                ],
                flags: [MessageFlags.Ephemeral]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await mongoClient.close();
        }
    }

}