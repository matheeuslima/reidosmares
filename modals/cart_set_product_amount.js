import {
	MessageFlags,
	ModalSubmitInteraction,
	EmbedBuilder
} from "discord.js";
import client from "../src/Client.js";
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
	 * @param {ModalSubmitInteraction} interaction 
	 */
	async execute(interaction) {
        
		try {
			await mongoClient.connect();

			// Extrai os IDs dos produtos do customId do modal
			const idsString = interaction.customId.split(":")[1];
			const productIds = idsString.split(",");

			// Busca os produtos no banco
			const products = await mongoClient.db().collection('products').find({
				id: { $in: productIds }
			}).toArray();

			// Monta array de produtos com quantidade definida pelo usuário
			const cartProducts = products.map(product => {
				const amountStr = interaction.fields.getTextInputValue(`amount_${product.id}`);
				let amount = parseInt(amountStr);
				if (isNaN(amount) || amount < 1) amount = 1;
				return { ...product, amount };
			});

			// Adiciona ao carrinho do ticket
			const ticket = client.tickets.get(interaction.channelId);
			if (!ticket.cart) ticket.cart = [];

			// Verifica limite de produtos
			if(ticket.cart && (ticket.cart.length + cartProducts.length > 25)) {
				return await interaction.reply({ content: 'Você atingiu o limite máximo de 25 produtos no carrinho.', flags: [MessageFlags.Ephemeral] });
			}

			// Verifica duplicidade
			if(ticket.cart && ticket.cart.find(p => cartProducts.map(pr => pr.id).includes(p.id))) {
				return await interaction.reply({ content: 'Você já adicionou um ou mais desses produtos ao carrinho.', flags: [MessageFlags.Ephemeral] });
			}

			cartProducts.forEach(product => {
				ticket.cart.push(product);
			});

			client.tickets.set(interaction.channelId, ticket);

			await interaction.deferReply().then(reply => reply.delete());

			// Atualiza embed do carrinho
			interaction.message && interaction.message.editable &&
			await interaction.message.edit({
				embeds: [
					new EmbedBuilder(interaction.message.embeds[0].data)
					.setFields([
						{
							name: `🛒 Carrinho`,
							value: client.tickets?.get(interaction.channelId)?.cart?.map(product => `- ${product.amount}x ${product.name} (R$${product.price.toFixed(2)})`).join('\n') || 'Nenhum produto adicionado ainda.',
							inline: true
						},
						{
							name: `💰 Total`,
							value: `R$${(client.tickets?.get(interaction.channelId)?.cart?.reduce((acc, product) => acc + product.price*product.amount, 0) || 0).toFixed(2)}`,
							inline: true
						}
					])
				],
			});

		} catch (error) {
			console.error(error);
			await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
		} finally {
			await mongoClient.close();
		}
	}
}
