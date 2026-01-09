import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    RoleSelectMenuBuilder,
    TextDisplayBuilder,
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

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_role_by_spending`)
                .setTitle('Novo cargo por gastos')
                .setLabelComponents(
                    new LabelBuilder()
                    .setLabel('Cargo')
                    .setRoleSelectMenuComponent(
                        new RoleSelectMenuBuilder()
                        .setCustomId(`role_id`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Valor de Gastos (em R$)')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`spending_threshold`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000.00`)
                        .setRequired(true)
                    )
                )
            );
        } catch (error) {
            console.error(error);

            const errorContainer = new ContainerBuilder()
            .setAccentColor(Colors.Red)
            .addTextDisplayComponents([
                new TextDisplayBuilder()
                .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                new TextDisplayBuilder()
                .setContent(`\`\`\`${error.message}\`\`\``)
            ]);
            
            if (!interaction.replied) {
                await interaction.reply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else if ((await interaction.fetchReply()).editable) {
                await interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                await interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        };
    }

};