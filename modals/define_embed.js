import {
    MessageFlags,
    ModalSubmitInteraction,
} from "discord.js";

export default {

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        const embedCode = JSON.parse(interaction.fields.getTextInputValue('embed_code'));
        const editedEmbed = interaction.customId.split(":")[1];
        const messageContent = embedCode['content'];
        const messageEmbed = embedCode['embed'];

        return interaction.reply({ content: `${editedEmbed} alterado para `+messageContent, embeds: [messageEmbed], flags: [MessageFlags.Ephemeral] });
    }

}