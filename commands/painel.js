import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder
} from "discord.js";
import botConfig from "../config.json" with { type: "json" };
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default {

    data: new SlashCommandBuilder()
    .setName("painel")
    .setDescription("[Administrativo] Gerencie opções do bot."),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        // sem permissão
        if(!interaction.member.roles.cache.has(botConfig.role.owner) && !botConfig.owners.includes(interaction.user.id)) return await interaction.editReply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Red)
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`Esse comando é exclusivo para administradores.\`\`\``)
                ])
            ]
        });

        let storeIsEnabled = (await mongoClient.db().collection('config').findOne({ guildId: interaction.guildId }))?.storeDisabled !== true;
        
        await interaction.editReply({
            flags: [MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Blurple)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent('# Painel administrativo')
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Large)
                )
                .addActionRowComponents(
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
                            .setLabel('Gerenciar lojas')
                            .setEmoji('🏬')
                            .setDescription('Gerencie lojas!')
                            .setValue('manage_stores'),
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
                    ]),
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Large)
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                    .setComponents([
                        storeIsEnabled ? 
                        new ButtonBuilder()
                        .setLabel('Fechar loja')
                        .setEmoji('🚪')
                        .setCustomId('bot_disable')
                        .setStyle(ButtonStyle.Danger)
                        :
                        new ButtonBuilder()
                        .setLabel('Abrir loja')
                        .setEmoji('🚪')
                        .setCustomId('bot_enable')
                        .setStyle(ButtonStyle.Success)
                    ])
                )
            ]
        });
    }
};