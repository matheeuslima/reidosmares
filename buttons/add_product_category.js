import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const stores = await mongoClient.db().collection('stores').find().toArray();

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_product_category`)
                .setTitle('Nova categoria de produtos')
                .setLabelComponents(
                    new LabelBuilder()
                    .setLabel('Nome da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`category_name`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: Sheckles`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('ID da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`category_id`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: sheckles`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji Ícone da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`category_emoji`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 😁`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Descrição da Categoria')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`category_description`)
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`Ex.: Qual tipo de produto você encontra aqui`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Loja da Categoria')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`category_store`)
                        .setRequired(true)
                        .setOptions(stores.map(store => {
                            return {
                                label: store.name,
                                value: store.id,
                                emoji: store.emoji || undefined,
                                description: store.id
                            }
                        }) || {
                            label: 'Não há lojas',
                            value: 'undefined',
                            description: 'Nenhuma loja registrada',
                        })
                    )
                )
            );
        } catch (error) {
            console.error(error);

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`${error.message}\`\`\``)
                    ])
                ]
            });
        } finally {
            await mongoClient.close();
        };
    }

};