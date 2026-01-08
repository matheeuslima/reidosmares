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

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
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
            await mongoClient.connect();

            const products = await mongoClient.db().collection('products').find().toArray();
            if(!products?.length) return interaction.reply({content: `Não há produtos para excluir.`, flags: [MessageFlags.Ephemeral]})

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_product`)
                .setTitle('Qual produto vai apagar?')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_id`)
                        .setLabel('ID do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`id_do_produto`)
                        .setRequired(true)
                    )
                )
            )
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await mongoClient.close();
        }
    }

}