import {
    ChannelType,
    ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import "dotenv/config";
import client from "../src/Client.js";

export default {

    data: new SlashCommandBuilder()
    .setName("fechar")
    .setDescription("Feche seu carrinho."),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.reply({content: "Fechando seu carrinho...", flags: [MessageFlags.Ephemeral]});

        try {
            interaction.channel.type == ChannelType.PrivateThread &&
            client.tickets.delete(interaction.channelId) && 
            interaction.channel.delete();
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução desse comando. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }
}