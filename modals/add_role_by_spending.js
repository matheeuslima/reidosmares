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

            const roleId = interaction.fields.getSelectedRoles('role_id').first().id;
            const spendingThreshold = interaction.fields.getTextInputValue('spending_threshold');

            // verifica se o ID do cargo já existe
            if(await mongoClient.db().collection("roles_by_spending").findOne({ roleId })) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Este cargo já está registrado.\`\`\``)
                    ])
                ]
            });
            
            // verifica se o sv tem esse cargo
            if(!interaction.guild.roles.cache.get(roleId)) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Cargo inexistente\`\`\``)
                    ])
                ]
            });

            // verifica se o valor é um número válido
            if(isNaN(parseFloat(spendingThreshold)) || parseFloat(spendingThreshold) < 0) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`"${spendingThreshold}" não é um número válido\`\`\``)
                    ])
                ]
            });

            // insere no banco
            await mongoClient.db().collection("roles_by_spending").insertOne({
                roleId,
                spendingThreshold: parseFloat(spendingThreshold)
            });

            // responde o cara
            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: { parse: [] },
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`## <@&${roleId}> adicionado aos cargos por gasto`),
                        new TextDisplayBuilder()
                        .setContent(`- **ID do cargo:** \`${roleId}\`\n- **Valor de gastos:** \`R$${parseFloat(spendingThreshold).toFixed(2)}\``),
                    ])
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