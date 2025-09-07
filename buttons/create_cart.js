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

            const categories = await dbClient.db().collection('product_categories').find().toArray();
            const customEmbed = JSON.parse((await dbClient.db().collection('embeds').findOne({id: 'cart_starter'})).code);

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
                        .setPlaceholder('Selecionar categoria')
                        .setCustomId('cart_select_category')
                        .setOptions(categories.map(category => {
                            return {label: category.name, value: category.id, emoji: category.emoji, description: category.description}
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