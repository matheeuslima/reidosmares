import {
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SlashCommandBuilder,
    TextDisplayBuilder
} from "discord.js";
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

    data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Mostra o ranking dos maiores compradores."),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const topUsers = await mongoClient.db().collection('users').find().sort({ totalSpent: -1 }).limit(10).toArray();
            if(topUsers.length === 0) return interaction.editReply({content: `Nenhum usuário encontrado no banco de dados.`, flags: [MessageFlags.Ephemeral]});

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                allowedMentions: {parse: []},
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Gold)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`# 🏆 Melhores clientes do ${interaction.guild.name}`)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(topUsers.map((user, index) => `-# **${index + 1}.** ${interaction.guild.members.cache.get(user.id) ? "**__"+interaction.guild.members.cache.get(user.id)?.displayName+"__**" : "<@"+user.id+">"} - total de \`R$${user.totalSpent.toFixed(2)}\` gastos em \`${user.purchaseHistory ? user.purchaseHistory.length : 0}\` pedido(s)`).join('\n'))
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`-# Ranking atualizado <t:${Math.floor(Date.now() / 1000)}:R>`)
                    )
                ]
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