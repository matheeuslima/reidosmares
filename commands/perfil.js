import {
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandUserOption
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
    .setDescription("Seu perfil na loja.")
    .addUserOption(
        new SlashCommandUserOption()
        .setName('comprador')
        .setDescription('Veja o perfil de outro comprador.')
        .setRequired(false)
    ),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await client.connect();

            const targetUser = interaction.options.getUser('comprador') || interaction.user;

            const user = await client.db().collection('users').findOne({ id: targetUser.id });
            //if(!user) return interaction.editReply({content: `${targetUser.username} ainda não fez nenhuma compra.`, flags: [MessageFlags.Ephemeral]});
            const topUsers = await client.db().collection('users').find().sort({ totalSpent: -1 }).limit(10).toArray();
            const userRank = topUsers.findIndex(u => u.id === targetUser.id) + 1;
            //if(userRank === 0) return interaction.editReply({content: `Você ainda não fez nenhuma compra.`, flags: [MessageFlags.Ephemeral]});

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setAuthor({ name: `Perfil de ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setFields([
                        // dados de comprador somente se ja houver compras
                        ...(user?.totalSpent && userRank ? [
                            { name: 'Posição no rank', value: `\`${userRank}\``, inline: true },
                            { name: `Total gasto`, value: `\`R$${user.totalSpent.toFixed(2)} (${user.purchaseHistory ? user.purchaseHistory.length : 0} compras)\`` },
                            { name: 'Última compra', value: user.lastPurchase ? `<t:${Math.floor(new Date(user.lastPurchase).getTime() / 1000)}:R>` : 'Nenhuma', inline: true },
                            { name: `Cliente desde`, value: user.purchaseHistory && user.purchaseHistory.length > 0 ? `<t:${Math.floor(new Date(user.purchaseHistory[0].date).getTime() / 1000)}:D>` : 'Nenhuma', inline: false },
                        ]: []),
                        // se a pessoa for um vendedor exibir o numero de vendas e tbm o dinheiro gerado em vendas
                        ...(user?.isSeller ? [
                            { name: 'Total em vendas', value: `\`R$${user.totalSales.toFixed(2)} (${user.salesHistory ? user.salesHistory.length : 0} vendas)\``, inline: true },
                            { name: 'Última venda', value: user.lastSale ? `<t:${Math.floor(new Date(user.lastSale).getTime() / 1000)}:R>` : 'Nenhuma', inline: true },
                            { name: 'Rendimento', value: `\`Último mês: R$${user.salesHistory ? user.salesHistory.filter(sale => new Date(sale.date) > new Date(Date.now() - 30*24*60*60*1000)).reduce((acc, sale) => acc + sale.total, 0).toFixed(2) : '0.00'}\nÚltima semana: R$${user.salesHistory ? user.salesHistory.filter(sale => new Date(sale.date) > new Date(Date.now() - 7*24*60*60*1000)).reduce((acc, sale) => acc + sale.total, 0).toFixed(2) : '0.00'}\nÚltimas 24h: R$${user.salesHistory ? user.salesHistory.filter(sale => new Date(sale.date) > new Date(Date.now() - 24*60*60*1000)).reduce((acc, sale) => acc + sale.total, 0).toFixed(2) : '0.00'}\``, inline: false }
                        ] : []),
                        // se a pessoa não tiver compras nem vendas
                        ...(user?.totalSpent ? [] : user?.isSeller ? [] : [
                            { name: 'Nenhuma atividade', value: 'Ainda não fez nenhuma compra ou venda na loja.', inline: false }
                        ])
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