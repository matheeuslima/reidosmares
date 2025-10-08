import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, EmbedBuilder, MessageFlags } from "discord.js";
import client from "../src/Client.js";
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
        ticket.id = interaction.channelId;
        ticket.closedAt = new Date();
        ticket.closedBy = interaction.user.id;
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
                    .setTitle('🛍 Compra realizada!')
                    .setAuthor({ name: ticketAuthor.user.username, iconURL: ticketAuthor.user.displayAvatarURL() })
                    .setFooter({ iconURL: interaction.guild.iconURL(), text: interaction.guild.name })
                    .setTimestamp(Date.now())
                    .setColor(Colors.Green)
                    .setFields([
                        { name: '🛒 Carrinho', value: ticket.cart.map(p => `\`- ${p.amount}x ${p.name} (R$${(p.price * p.amount).toFixed(2)})\``).join('\n') || 'Nenhum produto adicionado.', inline: false },
                        { name: '💳 Valor pago', value: `\`R$${total.toFixed(2)}\``, inline: false }
                    ]), 
                ],
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Comprar!')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/channels/${interaction.guild.id}/${botConfig.channel.newCart}`)
                    ])
                ]
            });

        }

        interaction.message.editable &&
        await interaction.message.edit({
            components: []
        });

        try {
            await mongoClient.connect();
            await mongoClient.db().collection('sales').insertOne(ticket);
            ticket.cart.forEach(product => {
                mongoClient.db().collection('products').updateOne({id: product.id}, {
                    $inc: { stock: product.amount*-1 }
                });
            })
            await mongoClient.db().collection('users').updateOne({id: ticket.author}, {
                $inc: { totalSpent: ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0) },
                $set: { lastPurchase: new Date() },
                $push: { purchaseHistory: {
                    date: new Date(),
                    items: ticket.cart,
                    total: ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0),
                    seller: ticket.seller
                } }
            }, { upsert: true });
            // perfil do vendedor
            await mongoClient.db().collection('users').updateOne({id: ticket.seller}, {
                $inc: { totalSales: ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0) },
                $set: { lastSale: new Date(), isSeller: true },
                $push: { salesHistory: {
                    date: new Date(),
                    items: ticket.cart,
                    total: ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0),
                    buyer: ticket.author
                } }
            }, { upsert: true });

            // verifica o novo total gasto da pessoa pra setar o cargo por gasto
            const userData = await mongoClient.db().collection('users').findOne({id: ticket.author});
            const rolesBySpending = await mongoClient.db().collection('roles_by_spending').find().toArray();
            const member = interaction.guild.members.cache.get(ticket.author);

            // filtra os cargos que o user tem direito
            const eligibleRoles = rolesBySpending.filter(role => userData.totalSpent >= role.spendingThreshold);
            if(eligibleRoles.length > 0) {
                // pega o cargo com maior valor de gasto
                const topRole = eligibleRoles.reduce((prev, current) => (prev.spendingThreshold > current.spendingThreshold) ? prev : current);
                
                if(!member.roles.cache.has(topRole.roleId)) { // se o user n tiver o cargo, add ele
                    // remove os outros cargos de gasto que o user possa ter
                    const rolesToRemove = rolesBySpending.map(r => r.roleId).filter(rId => member.roles.cache.has(rId) && rId !== topRole.roleId);
                    await member.roles.remove(rolesToRemove, 'Atualização automática de cargo por quantidade gasta.');
                    await member.roles.add(topRole.roleId, 'Atualização automática de cargo por quantidade gasta.');
                }
            }

            client.tickets.delete(interaction.channelId);
        
            await interaction.channel.delete('Compra finalizada e ticket arquivado.');
        } catch (error) {
            console.error(error);
            await interaction.channel.send(`Ocorreu um erro ao conectar no banco de dados. ${error.message}.`);
        } finally {
            await mongoClient.close();
        }
    }
}