import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_store`)
                .setTitle('Nova loja')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`store_name`)
                        .setLabel('Nome da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: Loja 1`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`store_id`)
                        .setLabel('ID da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: loja1`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`store_emoji`)
                        .setLabel('Emoji Ícone da Loja')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 😁`)
                        .setRequired(true)
                    )
                )
            )
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        }
    }

}