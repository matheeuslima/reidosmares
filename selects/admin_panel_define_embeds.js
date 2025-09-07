import {
    ActionRowBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

export default {

    /**
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {
        
        try {
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`define_embed:${interaction.values[0]}`)
                .setTitle('Defina o embed')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`embed_code`)
                        .setLabel('Código do Embed')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Layout do site da Loritta. {content: "", embed: {}}')
                        .setMaxLength(4000)
                        .setRequired(true)
                    )
                )
            );
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        }
    }

}