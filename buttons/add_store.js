import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        if(!interaction.member.permissions.has('ManageGuild')) {
            return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Você precisa da permissão de **Gerenciar Servidor** para usar esse botão!`)
                    ])
                ]
            });
        };
        
        try {
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_store`)
                .setTitle('Nova loja')
                .setLabelComponents(
                    new LabelBuilder()
                    .setLabel('Nome da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`store_name`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: Loja 1`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`store_id`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: loja1`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji Ícone da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`store_emoji`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 😁`)
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
        };
    }
};