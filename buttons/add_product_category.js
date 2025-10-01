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
                .setCustomId(`add_product_category`)
                .setTitle('Nova categoria de produtos')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_name`)
                        .setLabel('Nome da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: Sheckles`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_id`)
                        .setLabel('ID da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: sheckles`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_emoji`)
                        .setLabel('Emoji Ícone da Categoria')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 😁`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_description`)
                        .setLabel('Descrição da Categoria')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`Ex.: Qual tipo de produto você encontra aqui`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`category_store`)
                        .setLabel('Loja da Categoria')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`Ex.: loja1`)
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