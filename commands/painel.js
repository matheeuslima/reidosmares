import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("painel"),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setDescription('Painel')
            ],
            components: [
                new ActionRowBuilder()
                .addComponents([
                    new StringSelectMenuBuilder()
                    .setPlaceholder('O que você quer fazer')
                    .setCustomId('panel_select')
                    .setMaxValues(1)
                    .setOptions([
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Gerenciar produtos')
                        .setEmoji('🛍')
                        .setDescription('Gerencie produtos!')
                        .setValue('manage_products'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Definir embeds')
                        .setEmoji('🤖')
                        .setDescription('Defin embeds!')
                        .setValue('define_embeds'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Definir canais')
                        .setEmoji('💬')
                        .setDescription('Defina os canais!')
                        .setValue('define_channels')
                    ])
                ])
            ]
        });
    }

}