import { ButtonInteraction, Colors, EmbedBuilder, MessageFlags } from "discord.js";
import client from "../src/Client.js";
import botConfig from "../config.json" with { type: "json" };

export default {
	/**
	 * @param {ButtonInteraction} interaction
	 */
    async execute(interaction) {
        const ticket = client.tickets.get(interaction.channelId);

        if (!ticket || !ticket.cart || ticket.cart.length === 0) return await interaction.reply({ content: 'Seu carrinho está vazio ou não foi encontrado.', flags: [MessageFlags.Ephemeral] });
        if (!ticket.seller) return await interaction.reply({ content: 'Nenhum vendedor foi atribuído a este ticket. Aguarde um vendedor te responder.', flags: [MessageFlags.Ephemeral] });
        if (!interaction.member?.roles?.cache?.has(botConfig.role.owner) && !botConfig.owners.includes(interaction.user.id)) return await interaction.reply({ content: 'Somente os vendedores podem clicar nesse botão.', flags: [MessageFlags.Ephemeral] });
        if (ticket.paid) return await interaction.reply({ content: 'Esta compra já foi marcada como paga.', flags: [MessageFlags.Ephemeral] });
        
        // Marca o ticket como pago
        ticket.paid = true;
        client.tickets.set(interaction.channelId, ticket);

        await interaction.reply({ content: 'Compra marcada como paga com sucesso!', flags: [MessageFlags.Ephemeral] });

        // Registra no canal de logs
        const logChannel = interaction.guild.channels.cache.get(botConfig.channel.purchaseLog);
        
        if (logChannel && logChannel.isTextBased()) {
            const total = ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0);
            const ticketAuthor = interaction.guild.members.cache.get(ticket.author);
            logChannel.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle('🛍 Compra realizada')
                    .setAuthor({ name: ticketAuthor.user.username, iconURL: ticketAuthor.user.displayAvatarURL() })
                    .setFooter({ iconURL: interaction.guild.iconURL(), text: interaction.guild.name })
                    .setTimestamp(Date.now())
                    .setColor(Colors.Green)
                    .setFields([
                        { name: '🛒 Carrinho', value: ticket.cart.map(p => `\`- ${p.amount}x ${p.name} (R$${(p.price * p.amount).toFixed(2)})\``).join('\n') || 'Nenhum produto adicionado.', inline: false },
                        { name: '💳 Valor pago', value: `\`R$${total.toFixed(2)}\``, inline: false }
                    ]), 
                ]
            });

        }

        interaction.message.editable &&
        await interaction.message.edit({
            components: []
        });

        client.tickets.delete(interaction.channelId);
        
        await interaction.channel.send(`Compra finalizada e ticket arquivado. Obrigado pela preferência, volte sempre!`);
        await interaction.channel.setArchived(true, 'Compra finalizada e ticket arquivado.');
    }
}