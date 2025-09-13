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
    ThreadAutoArchiveDuration,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        await interaction.reply({content: 'Aguarde...', flags: [MessageFlags.Ephemeral]});

        if(client.tickets?.find(t => t.author === interaction.user.id)) return await interaction.editReply({content: 'Você já possui um carrinho aberto!'});

        const channel = await interaction.channel.threads.create({
            name: `Carrinho de ${interaction.user.username}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            type: ChannelType.PrivateThread,
            reason: `${interaction.user.username} abriu um carrinho`
        });

        channel.send({
            content: `-# <@&1339004186129338501> <@${interaction.user.id}>`
        }).then((msg) => {
            msg.delete();
        });

        try {
            await mongoClient.connect();

            const categories = await mongoClient.db().collection('product_categories').find().toArray();
            const customEmbed = JSON.parse((await mongoClient.db().collection('embeds').findOne({id: 'cart_starter'})).code);

            await channel.send({
                content: customEmbed['content'] || '',
                embeds: [
                    customEmbed['embed'] ||
                    new EmbedBuilder()
                    .setDescription(`Carrinho de ${interaction.user.username}`)
                ],
                components: [
                    new ActionRowBuilder()
                    .setComponents([
                        new StringSelectMenuBuilder()
                        .setPlaceholder('Selecione uma categoria!')
                        .setCustomId('cart_select_category')
                        .setOptions(categories.map(category => {
                            return {label: category.name, value: category.id, emoji: category.emoji, description: category.description}
                        }) || [{label: 'Não há produtos disponíveis', value: 'unavailable', emoji: '❔'}])
                    ]),
                    new ActionRowBuilder()
                    .setComponents([
                        new ButtonBuilder()
                        .setLabel('Fechar carrinho')
                        .setEmoji('🚮')
                        .setCustomId('close_cart')
                        .setStyle(ButtonStyle.Danger)
                    ])
                ]
            });

            const ticket = {
                author: interaction.user.id,
                seller: undefined,
                paid: false,
                cart: []
            };

            await interaction.editReply({content: `🛒 Seu carrinho foi criado <#${channel.id}>`});

            client.tickets ? client.tickets.set(channel.id, ticket) : client.tickets = new Collection().set(channel.id, ticket);
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await mongoClient.close();
        }
    }

}