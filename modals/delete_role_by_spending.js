import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
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

            const roleId = interaction.fields.getStringSelectValues('role_id')[0];

            await mongoClient.db().collection("roles_by_spending").deleteOne({ roleId });

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: { parse: [] },
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`### 🚮 <@&${roleId}> removido dos cargos por gasto com sucesso.`)
                    )
                ]
            });

            // atualiza o painel
            const roles = await mongoClient.db().collection('roles_by_spending').find().toArray();

            await interaction.message.edit({
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: { parse: [] },
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Blurple)
                    .addSectionComponents(
                        new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent('# Painel administrativo')
                        )
                        .setButtonAccessory(
                            new ButtonBuilder()
                            .setCustomId('reset_panel')
                            .setLabel('Início')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🏠')
                        )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`- ${roles.map(role => `**<@&${role.roleId}>:** R$${role.spendingThreshold.toFixed(2)}`).join('\n- ') || 'Nenhum cargo definido.'}`)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents([
                            new ButtonBuilder()
                            .setCustomId('add_role_by_spending')
                            .setEmoji('➕')
                            .setLabel('Adicionar novo cargo')
                            .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                            .setCustomId('delete_role_by_spending')
                            .setEmoji('🗑️')
                            .setLabel('Excluir um cargo')
                            .setStyle(ButtonStyle.Danger),
                        ])
                    )
                ]
            });
        } catch (error) {
            console.error(error);

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                ]
            });
        } finally {
            await mongoClient.close();
        };
    }
};