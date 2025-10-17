import { MessageFlags, ModalSubmitInteraction } from "discord.js";

export default {

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        interaction.deferReply({flags: [MessageFlags.Ephemeral]}).then((response) => response.delete());
    }

}