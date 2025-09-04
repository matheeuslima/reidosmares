import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandStringOption
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("debug")
    .setDescription("debug")
    .addStringOption(
        new SlashCommandStringOption()
        .setName('que')
        .setDescription('que')
        .addChoices([
            {name: 'criar carrinho', value: 'create_cart'}
        ])
    ),

    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        
        switch (interaction.options.get('que').value) {
            
            case 'create_cart':
                interaction.editReply('tá');
                interaction.channel.send({
                    embeds: [
                        new EmbedBuilder()
                        .setDescription('Criar carrinho')
                    ],
                    components: [
                        new ActionRowBuilder()
                        .setComponents([
                            new ButtonBuilder()
                            .setCustomId('create_cart')
                            .setLabel('Criar carrinho')
                            .setStyle(ButtonStyle.Primary)
                        ])
                    ]
                });
                break;
        
            default:
                break;
        }
    }

}