import {
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("perfil"),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.editReply('em construção');
    }

}