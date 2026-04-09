import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder
} from "discord.js";

const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply({flags: [MessageFlags.IsComponentsV2]});

        try {
            await mongoClient.connect();

            await mongoClient.db().collection('config').updateOne(
                { guildId: interaction.guildId },
                { $set: { storeDisabled: false } },
                { upsert: true }
            );

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ✅ A loja foi reaberta com sucesso!`)
                    ])
                ]
            });

            interaction.message.editable && await interaction.message.edit({
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
                            new ButtonBuilder()
                            .setLabel('Fechar loja')
                            .setEmoji('🚪')
                            .setCustomId('bot_disable')
                            .setStyle(ButtonStyle.Danger)
                        ])
                    )
                ]
            });

        } catch (error) {
            console.error(error);

            const errorContainer = new ContainerBuilder()
            .setAccentColor(Colors.Red)
            .addTextDisplayComponents([
                new TextDisplayBuilder()
                .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                new TextDisplayBuilder()
                .setContent(`\`\`\`${error.message}\`\`\``)
            ]);
            
            if (!interaction.replied) {
                await interaction.reply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else if ((await interaction.fetchReply()).editable) {
                await interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                await interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        };
    }
};