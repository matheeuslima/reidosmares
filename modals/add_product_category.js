import {
    Colors,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    TextDisplayBuilder,
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

            const categoryName = interaction.fields.getTextInputValue('category_name');
            const categoryId = interaction.fields.getTextInputValue('category_id');
            const categoryEmoji = interaction.fields.getTextInputValue('category_emoji');
            const categoryDescription = interaction.fields.getTextInputValue('category_description');
            const categoryStore = interaction.fields.getStringSelectValues('category_store')[0];

            const existingCategory = await mongoClient.db().collection('product_categories').findOne({ id: categoryId });
            if(existingCategory) return interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ Já existe uma categoria com o ID ${categoryId}.`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });

            // verificar se a loja existe
            const store = await mongoClient.db().collection('stores').findOne({ id: categoryStore });
            if(!store) return interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ A loja ${categoryStore} não existe.`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });

            // criar a categoria
            await mongoClient.db().collection("product_categories").insertOne({
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
            await mongoClient.close();
        }
    }

}