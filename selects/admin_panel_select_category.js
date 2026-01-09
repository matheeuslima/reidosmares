import {
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuBuilder,
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
            const category = await mongoClient.db().collection('product_categories').findOne({id: interaction.values[0]});
            if(!category) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Categoria de produtos não encontrada no banco de dados.\`\`\``)
                    ])
                ]
            });
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_category:${interaction.values[0]}`)
                .setTitle('Editar categoria de produtos')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: Eletrônicos')
                        .setRequired(true)
                        .setValue(category.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 📱')
                        .setRequired(true)
                        .setValue(category.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('Descrição da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_description')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Descreva a categoria para os clientes.')
                        .setRequired(true)
                        .setValue(category.description)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('category_id')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: eletronicos')
                        .setRequired(true)
                        .setValue(category.id)
                    ),
                    new LabelBuilder()
                    .setLabel('Loja da Categoria')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId('category_store')
                        .addOptions((await mongoClient.db().collection('stores').find().toArray()).map(store => {
                            return {
                                label: store.name,
                                description: store.id,
                                value: store.id,
                                emoji: store.emoji || undefined,
                                default: store.id === category.store
                            }
                        }))
                    )
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
                interaction.editReply({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            } else {
                interaction.channel.send({
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        };
    }
};