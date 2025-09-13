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
            
            const categoryName = interaction.fields.getTextInputValue('category_name');
            const categoryId = interaction.fields.getTextInputValue('category_id');
            const categoryEmoji = interaction.fields.getTextInputValue('category_emoji');
            const categoryDescription = interaction.fields.getTextInputValue('category_description');
            
            // verifica se o ID do produto já existe
            const category = await client.db().collection("product_categories").findOne({id: interaction.customId.split(':')[1]});
            if(!category) return await interaction.reply({content: `Categoria de produtos não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});

            // atualiza no banco
            await client.db().collection("product_categories").updateOne({id: interaction.customId.split(':')[1]}, {
                $set: {
                    name: categoryName,
                    id: categoryId,
                    emoji: categoryEmoji,
                    description: categoryDescription
                }
            })

            await interaction.reply({
                content: `Categoria de produtos "${categoryId}" atualizada com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${categoryEmoji} ${categoryName}\n${categoryDescription}`)
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