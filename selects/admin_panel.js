import {
    ActionRowBuilder,
    Colors,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";

export default {

    /**
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {
        
        try {
            await interaction.deferReply().then(reply => reply?.delete());
            
            switch(interaction.values[0]) {
                case "define_embeds": {
                    interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setDescription('Selecione um embed para editar')
                        ],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new StringSelectMenuBuilder()
                                .setPlaceholder('Qual embed você quer editar?')
                                .setCustomId('admin_panel_define_embeds')
                                .setOptions([
                                    {label: "Embed de criar carrinho", value: "new_cart"},
                                    {label: "Embed ao abrir o carrinho", value: "cart_starter"},
                                ])
                            ])
                        ]
                    })
                    break;
                }
                default: {
                    break;
                }
            }
            
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        }
    }

}