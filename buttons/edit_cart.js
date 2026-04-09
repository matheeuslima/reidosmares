import {
    ButtonInteraction,
    ChannelType,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuBuilder,
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
            .addLabelComponents(
                new LabelBuilder()
                .setLabel('Selecione o produto a editar')
                .setStringSelectMenuComponent(
                    new StringSelectMenuBuilder()
                    .setCustomId('edited_product')
                    .setRequired(true)
                    .setPlaceholder('Selecione o produto que deseja editar')
                    .setOptions(
                        client.tickets?.get(interaction.channelId)?.cart?.map(product => {
                            return {
                                label: `${product.amount}x - ${product.name}`.substring(0, 45),
                                value: product.id
                            };
                        })
                    )
                )
            )
            .addLabelComponents(
                new LabelBuilder()
                .setLabel('Defina a nova quantidade')
                .setTextInputComponent(
                    new TextInputBuilder()
                    .setCustomId('edited_amount')
                    .setPlaceholder('Nova quantidade do produto')
                    .setStyle(TextInputStyle.Short)
                )
            )
            .addTextDisplayComponents([
                new TextDisplayBuilder()
                .setContent(`Defina a quantidade do produto para 0 para removê-lo do carrinho.`),
            ])
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