import {
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("painel"),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.editReply('em construção');
    }

}