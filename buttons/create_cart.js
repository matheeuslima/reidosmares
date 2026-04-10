import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    Collection,
    Colors,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    ThreadAutoArchiveDuration,
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
        await interaction.deferReply({flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]});

        // verificar se a loja tá aberta
        try {
            await mongoClient.connect();
            const config = await mongoClient.db().collection('config').findOne({ guildId: interaction.guildId });
            if(config && config.storeDisabled) {
                return await interaction.editReply({
                    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                    components: [
                        new ContainerBuilder()
                        .addTextDisplayComponents([
                            new TextDisplayBuilder()
                            .setContent(`### ❌ A loja está fechada no momento. Tente novamente mais tarde!`)
                        ])
                        .setAccentColor(Colors.Red)
                    ]
                });
            }
        } catch (error) {
            console.error(error);
            return await interaction.editReply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                    .setAccentColor(Colors.Red)
                ]
            });
        } finally {
            await mongoClient.close();
        }

        // verificar se o cara não tem um ticket aberto
        if(client.tickets?.find(t => t.author === interaction.user.id)) return await interaction.editReply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`Você já possui um carrinho aberto.\`\`\``)
                ])
                .setAccentColor(Colors.Red)
            ]
        });

        // criar o ticket
        const ticketChannel = await interaction.channel.threads.create({
            name: `${interaction.member.roles.cache.has(botConfig.role.booster) ? "🚀 " : ""}Carrinho de ${interaction.user.username}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            type: ChannelType.PrivateThread,
            reason: `${interaction.user.username} abriu um carrinho`,
            invitable: false   
        });

        // ping no ticket
        ticketChannel.send({
            content: `-# <@&1339004186129338501> <@${interaction.user.id}>`
        }).then((msg) => {
            msg.delete();
        });

        try {
            await mongoClient.connect();

            const stores = await mongoClient.db().collection('stores').find().toArray();
            const customEmbed = JSON.parse((await mongoClient.db().collection('embeds').findOne({id: 'cart_starter'})).code);

            // mensagem inicial
            await ticketChannel.send({
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
                        .setPlaceholder('Selecione uma loja!')
                        .setCustomId('cart_select_store')
                        .setOptions(stores.map(store => {
                            return {label: store.name, value: store.id, emoji: store.emoji}
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

            // criar objeto do ticket pra registrar na memória
            const ticket = {
                id: ticketChannel.id,
                author: interaction.user.id,
                seller: undefined,
                store: undefined,
                paid: false,
                cart: []
            };

            // informar o cliente
            await interaction.editReply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### 🛒 Seu <#${ticketChannel.id}> foi criado!`),
                    ])
                    .setAccentColor(Colors.Green)
                ]
            });

            // adicionar objeto do ticket na memória
            client.tickets ? client.tickets.set(ticketChannel.id, ticket) : client.tickets = new Collection().set(ticketChannel.id, ticket);
            
            setTimeout(() => {
                console.log('verificando se o canal tá inativo');
                if((client.tickets.get(ticketChannel.id))?.isConfirmed !== true) {
                    ticketChannel.messages.fetch({author: ticket.author, limit: 1}).then(messages => {
                        const lastMessage = messages.first();
                        if(lastMessage && lastMessage.createdTimestamp > ( Date.now() - (14.9 * 60 * 1000) )) return; // se a última mensagem do canal for mais recente que 15 minutos, não fecha o ticket
                        ticketChannel.delete('Carrinho deletado por inatividade').catch(console.error);
                        client.tickets.delete(ticketChannel.id);
                    })
                }
            }, 15 * 60 * 1000);

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
        } finally {
            await mongoClient.close();
        };
    }
};