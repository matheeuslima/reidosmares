import {
    Colors,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
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

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await client.connect();

            const roleId = interaction.fields.getTextInputValue('role_id');
            const spendingThreshold = interaction.fields.getTextInputValue('spending_threshold');

            // verifica se o ID do cargo já existe
            if(await client.db().collection("roles_by_spending").findOne({ roleId })) return await interaction.reply({content: `Já existe um cargo com o ID "<@&${roleId}>" registrado.`, flags: [MessageFlags.Ephemeral]});
            
            // verifica se o sv tem esse cargo
            if(!interaction.guild.roles.cache.get(roleId)) return await interaction.reply({content: `O ID do cargo "${roleId}" é inválido ou o cargo não existe no servidor.`, flags: [MessageFlags.Ephemeral]});

            // verifica se o valor é um número válido
            if(isNaN(parseFloat(spendingThreshold)) || parseFloat(spendingThreshold) < 0) return await interaction.reply({content: `O valor de gastos "${spendingThreshold}" é inválido. Insira um número maior ou igual a 0.`, flags: [MessageFlags.Ephemeral]});
            
            // insere no banco
            await client.db().collection("roles_by_spending").insertOne({
                roleId,
                spendingThreshold: parseFloat(spendingThreshold)
            })

            await interaction.reply({
                content: `Cargo <@&>${roleId}> adicionado com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`**ID do Cargo:** ${roleId}\n**Valor de Gastos:** R$${parseFloat(spendingThreshold).toFixed(2)}`)
                ],
                flags: [MessageFlags.Ephemeral]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }

}