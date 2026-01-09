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
                    .addComponents(
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

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                ]
            });
        };
    }
};