import {
    Colors,
    ContainerBuilder,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    TextDisplayBuilder,
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

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const roleId = interaction.fields.getSelectedRoles('role_id').first().id;
            const spendingThreshold = interaction.fields.getTextInputValue('spending_threshold');

            // verifica se o ID do cargo já existe
            if(await mongoClient.db().collection("roles_by_spending").findOne({ roleId })) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ Esse cargo já está registrado.`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });
            
            // verifica se o sv tem esse cargo
            if(!interaction.guild.roles.cache.get(roleId)) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ Cargo inexistente`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });

            // verifica se o valor é um número válido
            if(isNaN(parseFloat(spendingThreshold)) || parseFloat(spendingThreshold) < 0) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ "${spendingThreshold}" não é um número válido.`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });

            // insere no banco
            await mongoClient.db().collection("roles_by_spending").insertOne({
                roleId,
                spendingThreshold: parseFloat(spendingThreshold)
            })

            await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`## <@${roleId}> adicionado aos cargos por gasto`),
                        new TextDisplayBuilder()
                        .setContent(`- **ID do Cargo:** ${roleId}\n- **Valor de Gastos:** R$${parseFloat(spendingThreshold).toFixed(2)}`),
                    )
                ]
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`❌ Ocorreu um erro. ${error.message}`)
                    )
                    .setAccentColor(Colors.Red)
                ]
            });
        } finally {
            await mongoClient.close();
        }
    }

}