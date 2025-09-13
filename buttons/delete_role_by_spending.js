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

            const roles_by_spending = await client.db().collection('roles_by_spending').find().toArray();
            if(!roles_by_spending?.length) return interaction.reply({content: `Não há cargos para excluir.`, flags: [MessageFlags.Ephemeral]})

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_role_by_spending`)
                .setTitle('Qual cargo vai apagar?')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`role_id`)
                        .setLabel('ID do Cargo')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Um dos seguintes: ${roles_by_spending.map(role => role.roleId).join(', ')}`)
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