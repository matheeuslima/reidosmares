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

            const categoryName = interaction.fields.getTextInputValue('category_name');
            const categoryId = interaction.fields.getTextInputValue('category_id');
            const categoryEmoji = interaction.fields.getTextInputValue('category_emoji');
            const categoryDescription = interaction.fields.getTextInputValue('category_description');
            const categoryStore = interaction.fields.getTextInputValue('category_store');

            const existingCategory = await client.db().collection('product_categories').findOne({ id: categoryId });
            if(existingCategory) return interaction.reply({content: `Já existe uma categoria com o ID "${categoryId}".`, flags: [MessageFlags.Ephemeral]});

            // verificar se a loja existe
            const store = await client.db().collection('stores').findOne({ id: categoryStore });
            if(!store) return interaction.reply({content: `A loja com o ID "${categoryStore}" não existe.`, flags: [MessageFlags.Ephemeral]});

            // criar a categoria
            await client.db().collection("product_categories").insertOne({
                name: categoryName,
                id: categoryId,
                emoji: categoryEmoji,
                description: categoryDescription,
                store: categoryStore,
            })

            await interaction.reply({
                content: `Categoria de produtos "${categoryId}" criada com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${categoryEmoji} ${categoryName}\n${categoryDescription}`)
                    .setAuthor({name: store})
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