import {
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    PermissionsBitField,
    SlashCommandBuilder,
    SlashCommandUserOption,
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
            await mongoClient.connect();

            const targetUser = interaction.options.getUser('comprador') || interaction.user;

            const user = await mongoClient.db().collection('users').findOne({ id: targetUser.id });
            const topUsers = await mongoClient.db().collection('users').find().sort({ totalSpent: -1 }).toArray();
            const userRank = topUsers.findIndex(u => u.id === targetUser.id) + 1;
            
            // Calcula rendimentos: mês atual, últimos 7 dias (mantido) e hoje (00:00 - 23:59)
            // Força timezone sem usar libs: usa horas de offset fixo (em horas) definido em env FORCE_TZ_OFFSET_HOURS (ex: -3 para America/Sao_Paulo)
            const tzOffsetHours = -3;
            const toTzDate = (date) => {
                const d = new Date(date);
                const utc = d.getTime() + d.getTimezoneOffset() * 60000;
                return new Date(utc + tzOffsetHours * 3600000);
            };

            let monthTotal = 0;
            let weekTotal = 0;
            let todayTotal = 0;
            let yesterdayTotal = 0;

            if (user?.salesHistory && Array.isArray(user.salesHistory)) {
                const nowTz = toTzDate(new Date());

                monthTotal = user.salesHistory
                    .map(s => ({ d: toTzDate(s.date), total: Number(s.total) || 0 }))
                    .filter(item => item.d.getMonth() === nowTz.getMonth() && item.d.getFullYear() === nowTz.getFullYear())
                    .reduce((acc, item) => acc + item.total, 0);

                const weekCutoff = new Date(nowTz.getTime() - 7 * 24 * 60 * 60 * 1000);
                weekTotal = user.salesHistory
                    .map(s => ({ d: toTzDate(s.date), total: Number(s.total) || 0 }))
                    .filter(item => item.d > weekCutoff)
                    .reduce((acc, item) => acc + item.total, 0);

                const startOfDay = new Date(nowTz);
                startOfDay.setHours(0,0,0,0);
                const endOfDay = new Date(nowTz);
                endOfDay.setHours(23,59,59,999);

                todayTotal = user.salesHistory
                    .map(s => ({ d: toTzDate(s.date), total: Number(s.total) || 0 }))
                    .filter(item => item.d >= startOfDay && item.d <= endOfDay)
                    .reduce((acc, item) => acc + item.total, 0);

                const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
                const endOfYesterday = new Date(endOfDay.getTime() - 24 * 60 * 60 * 1000);
                yesterdayTotal = user.salesHistory
                    .map(s => ({ d: toTzDate(s.date), total: Number(s.total) || 0 }))
                    .filter(item => item.d >= startOfYesterday && item.d <= endOfYesterday)
                    .reduce((acc, item) => acc + item.total, 0);
            }

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
                        ...(user?.isSeller ? 
                            interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ? [
                                { name: 'Total em vendas', value: `\`R$${user.totalSales.toFixed(2)} (${user.salesHistory ? user.salesHistory.length : 0} vendas)\``, inline: true },
                                { name: 'Última venda', value: user.lastSale ? `<t:${Math.floor(new Date(user.lastSale).getTime() / 1000)}:R>` : 'Nenhuma', inline: true },
                                { name: 'Rendimento', value: `\`Mês atual: R$${monthTotal.toFixed(2)}\nÚltimos 7 dias: R$${weekTotal.toFixed(2)}\nOntem: R$${yesterdayTotal.toFixed(2)}\nHoje: R$${todayTotal.toFixed(2)}\``, inline: false }
                            ] : [
                                { name: 'Usuário é um vendedor', value: 'Esse usuário é um vendedor, mas você não tem permissão para ver os dados de vendas dele.', inline: false }
                            ]
                        : []),
                        // se a pessoa não tiver compras nem vendas
                        ...(!user?.totalSpent && !user?.isSeller ? [
                            { name: 'Nenhuma atividade', value: 'Ainda não fez nenhuma compra ou venda na loja.', inline: false }
                        ] : [])
                    ])
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