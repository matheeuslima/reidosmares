import { ButtonInteraction, ChannelType, MessageFlags } from "discord.js";
import client from "../src/Client.js";

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        interaction.channel.type == ChannelType.PrivateThread &&
        client.tickets.delete(interaction.channelId) && 
        interaction.channel.delete()
        .catch(err => 
            interaction.reply({
                content: `Ocorreu um erro ao apagar esse carrinho. ${err.message}`,
                flags: [MessageFlags.Ephemeral]
            })
        );
    }

}