
import {
	ButtonInteraction,
	EmbedBuilder,
    Colors,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} from "discord.js";
import client from "../src/Client.js";
import "dotenv/config";

export default {
	/**
	 * @param {ButtonInteraction} interaction
	 */
	async execute(interaction) {
		const ticket = client.tickets.get(interaction.channelId);
		if (!ticket || !ticket.cart || ticket.cart.length === 0) return await interaction.editReply({content: 'Seu carrinho está vazio ou não foi encontrado.'});

		// Calcular valor total
		const total = ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0);
		if (total <= 0) return await interaction.editReply({content: 'O valor do carrinho é inválido.'});

        await interaction.reply({
            content: `-# <@&1339004186129338501> <@${interaction.user.id}>`,
            embeds: [
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
					.setCustomId('finish_purchase')
					.setStyle(ButtonStyle.Success)
					.setEmoji('✅')
					.setLabel('Marcar compra como paga')
				)
			]
        });

        interaction.message.editable &&
        await interaction.message.edit({
            components: []
        });

        client.tickets.set(interaction.channelId, ticket);
	}
}
