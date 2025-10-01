import { Colors, EmbedBuilder, MessageFlags, ModalSubmitInteraction } from "discord.js";
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
            
            const storeName = interaction.fields.getTextInputValue('store_name');
            const storeId = interaction.fields.getTextInputValue('store_id');
            const storeEmoji = interaction.fields.getTextInputValue('store_emoji');

            // verifica se o ID do produto já existe
            const store = await client.db().collection("stores").findOne({id: interaction.customId.split(':')[1]});
            if(!store) return await interaction.reply({content: `Loja não encontrada no banco de dados.`, flags: [MessageFlags.Ephemeral]});

            // atualiza no banco
            await client.db().collection("stores").updateOne({id: interaction.customId.split(':')[1]}, {
                $set: {
                    name: storeName,
                    id: storeId,
                    emoji: storeEmoji,
                }
            })

            await interaction.reply({
                content: `Loja "${storeId}" atualizada com sucesso.`,
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setDescription(`# ${storeEmoji} ${storeName}`)
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