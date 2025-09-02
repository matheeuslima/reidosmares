import {
    ChatInputCommandInteraction,
    SlashCommandBuilder
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("rank"),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.editReply('em construção');
    }

}