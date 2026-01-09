import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuBuilder,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const roles_by_spending = await mongoClient.db().collection('roles_by_spending').find().toArray();
            if(!roles_by_spending?.length) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Não há cargos definidos para que você possa excluir.\`\`\``)
                    ])
                ]
            });

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_role_by_spending`)
                .setTitle('Qual cargo vai remover?')
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent('Remover um cargo dessa lista não o deleta do servidor, apenas para de o atribuir a clientes por gasto.')
                )
                .addLabelComponents(
                    new LabelBuilder()
                    .setLabel('Cargo')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`role_id`)
                        .setOptions(roles_by_spending.map(role => {
                            return {
                                label: `${interaction.guild.roles.cache.get(role.roleId)?.name || 'Cargo inexistente'} | R$${role.spendingThreshold.toFixed(2)}`,
                                description: `ID: ${role.roleId}`,
                                value: role.roleId
                            }
                        }))
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
                interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        };
    }
};