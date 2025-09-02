import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder
} from "discord.js"
import botConfig from "../config.json" with { type: "json" };

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        await interaction.reply({content: 'Aguarde...', flags: [MessageFlags.Ephemeral]});

        const channel = await interaction.guild.channels.create({
            parent: interaction.guild.channels.cache.get(botConfig.category.carts),
            name: `carrinho-de-${interaction.user.username}`,
            type: ChannelType.GuildText
        });

        await channel.send({
            embeds: [
                new EmbedBuilder()
                .setDescription(`Carrinho de ${interaction.user.username}`)
            ],
            components: [
                new ActionRowBuilder()
                .addComponents([
                    new StringSelectMenuBuilder()
                    .setPlaceholder('Selecionar categoria')
                    .setCustomId('cart_select_category')
                    .addOptions([
                        {label: 'Teste', value: 'teste'}
                    ])
                ]),
                new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                    .setLabel('primario')
                    .setCustomId('primary')
                    .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setLabel('secundario')
                    .setCustomId('secondary')
                    .setStyle(ButtonStyle.Secondary)
                ])
            ]
        });

        await interaction.editReply({content: `🛒 Seu carrinho foi criado <#${channel.id}>`})
    }

}