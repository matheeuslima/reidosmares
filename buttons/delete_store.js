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

            const stores = await client.db().collection('stores').find().toArray();
            if(!stores?.length) return interaction.reply({content: `Não há lojas para excluir.`, flags: [MessageFlags.Ephemeral]})

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_store`)
                .setTitle('Qual loja vai apagar?')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`store_id`)
                        .setLabel('ID da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Um dos seguintes: ${stores.map(store => store.id).join(', ')}`)
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