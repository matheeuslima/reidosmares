import {
    ActionRowBuilder,
    ButtonInteraction,
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

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_role_by_spending`)
                .setTitle('Novo cargo por gastos')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`role_id`)
                        .setLabel('ID do Cargo')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 123456789012345678`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`spending_threshold`)
                        .setLabel('Valor de Gastos (em R$)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000.00`)
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