import {
    Colors,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
} from "discord.js";
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
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await client.connect();

            const productName = interaction.fields.getTextInputValue('product_name');
            const productId = interaction.fields.getTextInputValue('product_id');
            const productDescription = interaction.fields.getTextInputValue('product_description');
            const productCategory  = interaction.fields.getTextInputValue('product_category');
            const productPrice = interaction.fields.getTextInputValue('product_price');

            await client.db().collection("products").insertOne({
                name: productName,
                id: productId,
                category: productCategory,
                description: productDescription,
                price: parseFloat(productPrice)
            })

            await interaction.reply({
                content: `Produto "${productId}" adicionado com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${productName}\n${productDescription}\n- Preço: R$${parseInt(productPrice).toFixed(2)}\n- Categoria: ${productCategory}`)
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