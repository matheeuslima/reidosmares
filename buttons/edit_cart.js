import {
    ButtonInteraction,
    ChannelType,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import client from "../src/Client.js";

export default {

    /**
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            const modal = new ModalBuilder()
            .setCustomId(`edit_cart`)
            .setTitle('Editar carrinho de compras')
            .addTextDisplayComponents([
                new TextDisplayBuilder()
                .setContent(`Defina a quantidade do produto para 0 para removê-lo do carrinho.`),
            ])
            .addLabelComponents(
                client.tickets?.get(interaction.channelId)?.cart?.map(product => {
                    return new LabelBuilder()
                    .setLabel(`${product.name}`.substring(0, 45))
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(product.id)
                        .setStyle(TextInputStyle.Short)
                        .setValue(product.amount.toString())
                        .setPlaceholder(`Quantidade de ${product.name} (máx. ${product.stock})`)
                        .setRequired(true)
                    )
                }) || []
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent(`-# Se nenhum produto do seu carrinho tiver aparecido nesse pop-up, cancele e clique no botão de editar novamente.`)
            );

            await interaction.showModal(modal);
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
        };
    }
};