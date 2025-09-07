import {
    MessageFlags,
    StringSelectMenuInteraction
} from "discord.js";

export default {
    /**
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction) {
        interaction.reply({content: 'oi', flags: [MessageFlags.Ephemeral]})
    }
}