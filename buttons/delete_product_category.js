import {
    ActionRowBuilder,
    ButtonInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await client.connect();

            const categories = await client.db().collection('product_categories').find().toArray();
            if(!categories?.length) return interaction.reply({content: `Não há categorias para excluir.`, flags: [MessageFlags.Ephemeral]})

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_product_category`)
                .setTitle('Qual categoria de produto vai apagar?')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_id`)
                        .setLabel('ID da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Um dos seguintes: ${categories.map(category => category.id).join(', ')}`)
                        .setRequired(true)
                    )
                )
            )
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await client.close();
        }
    }

}