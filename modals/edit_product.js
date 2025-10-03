import { Colors, EmbedBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
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
            const productId = interaction.customId.split(':')[1];
            const productCategory = interaction.fields.getTextInputValue('product_category');
            const productEmoji = interaction.fields.getTextInputValue('product_emoji');
            const productPrice = interaction.fields.getTextInputValue('product_price');
            const productStock = interaction.fields.getTextInputValue('product_stock');
            
            // verifica se o ID do produto já existe
            const product = await client.db().collection("products").findOne({id: interaction.customId.split(':')[1]});
            if(!product) return await interaction.reply({content: `Produto não encontrado no banco de dados.`, flags: [MessageFlags.Ephemeral]});

            // atualiza no banco
            await client.db().collection("products").updateOne({id: interaction.customId.split(':')[1]}, {
                $set: {
                    name: productName,
                    id: productId,
                    category: productCategory,
                    emoji: productEmoji,
                    price: parseFloat(productPrice),
                    stock: parseInt(productStock),
                }
            })

            await interaction.reply({
                content: `Produto "${productId}" atualizado com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${productEmoji} ${productName}\n- Preço: R$${parseFloat(productPrice).toFixed(2)}\n- Categoria: ${productCategory}\n- Estoque: ${productStock || 'Sem estoque'}`)
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