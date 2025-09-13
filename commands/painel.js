import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";

export default {

    data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("[Administrativo] Gerencie opções do bot."),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setDescription('Painel administrativo')
                .setColor(Colors.Blurple)
            ],
            components: [
                new ActionRowBuilder()
                .setComponents([
                    new StringSelectMenuBuilder()
                    .setPlaceholder('O que você quer fazer')
                    .setCustomId('admin_panel')
                    .setMaxValues(1)
                    .setOptions([
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Gerenciar produtos')
                        .setEmoji('🛍')
                        .setDescription('Gerencie produtos!')
                        .setValue('manage_products'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Gerenciar categorias de produtos')
                        .setEmoji('📁')
                        .setDescription('Gerencie categorias de produtos!')
                        .setValue('manage_product_categories'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Definir embeds')
                        .setEmoji('🤖')
                        .setDescription('Defina embeds!')
                        .setValue('define_embeds'),
                        new StringSelectMenuOptionBuilder()
                        .setLabel('Definir cargos')
                        .setEmoji('🔰')
                        .setDescription('Defina os cargos dados por quantidade gasta!')
                        .setValue('define_roles_by_spending'),
                    ])
                ])
            ]
        });
    }

}