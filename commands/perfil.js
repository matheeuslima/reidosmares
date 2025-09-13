import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export default {

    data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Seu perfil na loja"),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await client.connect();

            const user = await client.db().collection('users').findOne({ id: interaction.user.id });
            if(!user) return interaction.editReply({content: `Você ainda não fez nenhuma compra.`, flags: [MessageFlags.Ephemeral]});
            const topUsers = await client.db().collection('users').find().sort({ totalSpent: -1 }).limit(10).toArray();
            const userRank = topUsers.findIndex(u => u.id === interaction.user.id) + 1;
            if(userRank === 0) return interaction.editReply({content: `Você ainda não fez nenhuma compra.`, flags: [MessageFlags.Ephemeral]});

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setAuthor({ name: `Perfil de ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFields([
                        { name: 'Posição no rank', value: `\`${userRank}\``, inline: true },
                        { name: `Total gasto`, value: `\`R$${user.totalSpent.toFixed(2)} (${user.purchaseHistory ? user.purchaseHistory.length : 0} compras)\`` },
                        { name: 'Última compra', value: user.lastPurchase ? `<t:${Math.floor(new Date(user.lastPurchase).getTime() / 1000)}:R>` : 'Nenhuma', inline: true },
                        { name: `Cliente desde`, value: user.purchaseHistory && user.purchaseHistory.length > 0 ? `<t:${Math.floor(new Date(user.purchaseHistory[0].date).getTime() / 1000)}:D>` : 'Nenhuma', inline: false },
                    ])
                ],
                flags: [MessageFlags.Ephemeral]
            });

        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução desse comando. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }
}