import {
    ChannelType,
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SlashCommandBuilder,
    TextDisplayBuilder,
} from "discord.js";
import "dotenv/config";
import client from "../src/Client.js";
import botConfig from "../config.json" with { type: "json" };

export default {

    data: new SlashCommandBuilder()
    .setName("fechar")
    .setDescription("Feche seu carrinho."),

    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        if(interaction.channel.parentId != botConfig.channel.newCart) return await interaction.editReply({
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
            components: [
                new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent("❌ Você só pode usar esse comando no canal de criação de carrinhos.")
                )
                .setAccentColor(Colors.Red)
            ]
        });

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