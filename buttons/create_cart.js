import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    Collection,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
} from "discord.js";
import client from "../src/Client.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const dbClient = new MongoClient(process.env.MONGODB_URI, {
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
        await interaction.reply({content: 'Aguarde...', flags: [MessageFlags.Ephemeral]});

        const channel = await interaction.channel.threads.create({
            name: `Carrinho de ${interaction.user.username}`,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: `${interaction.user.username} abriu um carrinho`
        });

        channel.send({
            content: `-# <@&1339004186129338501> <@${interaction.user.id}>`
        }).then((msg) => {
            msg.delete();
        });

        try {
            await dbClient.connect();
            /*await dbClient.db().collection('products').insertOne({
                name: 'Produto de teste',
                id: 'teste',
                category: 'Teste',
                price: 7.00
            })*/
            const products = await dbClient.db().collection('products').find().toArray();
            const categories = new Set(products.map(product => product.category));

            await channel.send({
                embeds: [
                    new EmbedBuilder()
                    .setDescription(`Carrinho de ${interaction.user.username}`)
                ],
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecionar categoria')
                        .setCustomId('cart_select_category')
                        .setOptions(Array.from(categories).map(category => {
                            return {label: category, value: category}
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Voltar')
                        .setCustomId('primary')
                        .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                        .setLabel('Fechar carrinho')
                        .setCustomId('secondary')
                        .setStyle(ButtonStyle.Danger)
                    ])
                ]
            });

            await interaction.editReply({content: `🛒 Seu carrinho foi criado <#${channel.id}>`});

            client.tickets ? client.tickets.set(channel.id, {}) : client.tickets = new Collection().set(channel.id, {});
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await dbClient.close();
        }
    }

}