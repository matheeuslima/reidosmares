import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
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
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`🏆 - Maiores Compradores - ${interaction.guild.name}`)
                    .setColor(Colors.Gold)
                    .setDescription(topUsers.map((user, index) => `-# **${index + 1}.** <@${user.id}> - total de \`R$${user.totalSpent.toFixed(2)}\` gastos em \`${user.purchaseHistory ? user.purchaseHistory.length : 0}\` pedido(s)`).join('\n'))
                    .setFooter({ iconURL: interaction.guild.iconURL(), text: interaction.guild.name })
                    .setTimestamp(Date.now())
                ],
                flags: [MessageFlags.Ephemeral]
            });

        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await mongoClient.close();
        }
    }

}