import {
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuInteraction,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle
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
     * @param {StringSelectMenuInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();
            const store = await mongoClient.db().collection('stores').findOne({id: interaction.values[0]});
            if(!store) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Loja não encontrada no banco de dados.\`\`\``)
                    ])
                ]
            });
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_store:${interaction.values[0]}`)
                .setTitle('Editar loja')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Loja Oficial')
                        .setRequired(true)
                        .setValue(store.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 🏬')
                        .setRequired(true)
                        .setValue(store.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Loja')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('store_id')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: loja1')
                        .setRequired(true)
                        .setValue(store.id)
                    ),
                ])
            )
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