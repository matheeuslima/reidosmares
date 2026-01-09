import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder
} from "discord.js";
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

        // ticket vazio ou não encontrado
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

        // ticket sem vendedor
        if (!ticket.seller) return await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Red)
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`O carrinho ainda não foi reivindicado por nenhum vendedor.\`\`\``)
                ])
            ]
        });

        // somente vendedores
        if (!interaction.member?.roles?.cache?.has(botConfig.role.owner) && !botConfig.owners.includes(interaction.user.id)) return await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Red)
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`Somente vendedores podem utilizar esse botão.\`\`\``)
                ])
            ]
        });

        // compra já tá paga fi
        if (ticket.paid) return await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Red)
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`Esta compra já foi marcada como paga.\`\`\``)
                ])
            ]
        });
        
        // carrinho menor que 1 real
        const cartTotal = ticket.cart.reduce((acc, product) => acc + product.price * product.amount, 0);
        if (cartTotal < 1.00) return await interaction.reply({
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

        // Marca o ticket como pago
        ticket.paid = true;
        ticket.id = interaction.channelId;
        ticket.closedAt = new Date();
        ticket.closedBy = interaction.user.id;
        ticket.seller = interaction.user.id;
        client.tickets.set(interaction.channelId, ticket);

        await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Green)
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent(`### ✅ Compra marcada como paga com sucesso!`),
                )
            ]
        });

        // Registra no canal de logs
        const logChannel = interaction.guild.channels.cache.get(botConfig.channel.purchaseLog);

        if (logChannel && logChannel.isTextBased()) {
            const total = ticket.cart.reduce((acc, product) => acc + product.price*product.amount, 0);
            const ticketAuthor = interaction.guild.members.cache.get(ticket.author);

            logChannel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addSectionComponents(
                        new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent(`## 🛍 Compra realizada!`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent(`<t:${Math.floor(Date.now() / 1000)}:f>`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent(`**${ticketAuthor.user.username}** comprou de **${interaction.guild.members.cache.get(ticket.seller).user.username}**`)
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                            .setURL(ticketAuthor.user.displayAvatarURL())
                        )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`### 🛒 Carrinho:\n${ticket.cart.map(p => `- \`${p.amount}x ${p.name} (R$${(p.price * p.amount).toFixed(2)})\``).join('\n') || 'Nenhum produto adicionado.'}`)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`### 💳 Valor pago:\n\`R$${total.toFixed(2)}\``)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setDivider(true)
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                            .setLabel('Compre também!')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${interaction.guild.id}/${botConfig.channel.newCart}`)
                        )
                    )
                ]
            })
        }

        // Remove os botões da mensagem
        interaction.message.editable &&
        await interaction.message.edit({
            components: []
        });

        try {
            await mongoClient.connect();
            // adicionar vendas
            await mongoClient.db().collection('sales').insertOne(ticket);
            // reduzir estoques
            ticket.cart.forEach(product => {
                mongoClient.db().collection('products').updateOne({id: product.id}, {
                    $inc: { stock: product.amount*-1 }
                });
            })
            // perfil do usuário
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

            // deletar ticket
            client.tickets.delete(interaction.channelId);
            await interaction.channel.delete('Compra finalizada e ticket arquivado.');

            // review
            await interaction.guild.channels.cache.get(botConfig.channel.reviews)
            .send({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Yellow)
                    .addSectionComponents(
                        new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent(`# <@${ticket.author}>\nObrigado pela sua compra! Avalie a loja e o atendimento aqui.\n-# Essa mensagem expira <t:${Math.floor(Date.now() / 1000) + 10}:R>.`)
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                            .setURL(`https://images.emojiterra.com/twitter/v13.1/512px/2b50.png`)
                            .setDescription('Estrela')
                        )
                    )
                ]
            })
            .then(msg => {
                setTimeout(() => {
                    msg?.deletable && msg?.delete();
                }, 10_000);
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
                interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        };
    }
};