import {
    ButtonInteraction,
    ChannelType,
    Colors,
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder
} from "discord.js";
import client from "../src/Client.js";

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            interaction.channel.type == ChannelType.PrivateThread &&
            client.tickets.delete(interaction.channelId) && 
            interaction.channel.delete();
        } catch (error) {
            console.error(error);

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                    
                ]
            });
        };
    }
};