
import {
	ButtonInteraction,
	EmbedBuilder,
    Colors,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder
} from "discord.js";
import client from "../src/Client.js";
import "dotenv/config";

export default {
	/**
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction) {
		const ticket = client.tickets.get(interaction.channelId);
		ticket.isConfirmed = true;

		// carrinho vazio ou não encontrado
		if (!ticket || !ticket.cart || ticket.cart.length === 0) return await interaction.reply({
			flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
			components: [
				new ContainerBuilder()
				.setAccentColor(Colors.Red)
				.addTextDisplayComponents([
					new TextDisplayBuilder()
					.setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
					new TextDisplayBuilder()
					.setContent(`\`\`\`Seu carrinho está vazio ou não foi encontrado.\`\`\``)
				])
			]
		});

		// Calcular valor total
		const total = ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0);

		// valor inválido
		if (total < 1.00) return await interaction.reply({
			flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
			components: [
				new ContainerBuilder()
				.setAccentColor(Colors.Red)
				.addTextDisplayComponents([
					new TextDisplayBuilder()
					.setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
					new TextDisplayBuilder()
					.setContent(`\`\`\`O valor mínimo para concluir uma compra é de R$1.\`\`\``)
				])
			]
		});

        interaction.message.editable &&
        await interaction.message.edit({
			embeds: [
				interaction.message.embeds[0],
				new EmbedBuilder()
				.setTitle('💸 Hora do pagamento!')
				.setFields([
                    { name: `🛍️ Produtos`, value: ticket.cart.map(p => `- ${p.amount}x ${p.name} (R$${(p.price * p.amount).toFixed(2)})`).join('\n') || 'Nenhum produto adicionado.', inline: false },
					{ name: `💳 Valor total`, value: `R$${total.toFixed(2)}`, inline: false },
					{ name: '🫢 Realizar pagamento', value: `Aguarde um vendedor te responder.`, inline: false }
				])
				.setColor(Colors.Green)
			],
            components: [
				new ActionRowBuilder()
				.setComponents(
					new ButtonBuilder()
					.setCustomId('return_to_cart')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('↩️')
					.setLabel('Reabrir o carrinho'),
					new ButtonBuilder()
					.setCustomId('close_cart')
					.setStyle(ButtonStyle.Danger)
					.setEmoji('🚮')
					.setLabel('Desistir da compra'),
					new ButtonBuilder()
					.setCustomId('finish_purchase')
					.setStyle(ButtonStyle.Success)
					.setEmoji('✅')
					.setLabel('Marcar compra como paga'),
				)
			]
        });

		interaction.message.pinnable && await interaction.message.pin();

        client.tickets.set(interaction.channelId, ticket);
	}
};
