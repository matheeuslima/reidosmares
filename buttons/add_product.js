import {
    LabelBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    Colors,
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

            const categories = await mongoClient.db().collection('product_categories').find().toArray();

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_product`)
                .setTitle('Novo produto')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`product_name`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000 Sheckles`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('ID do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`product_id`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000_sheckles`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Categoria do Produto')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`product_category`)
                        .setRequired(true)
                        .setOptions(categories.map(category => {
                            return {
                                label: category.name,
                                value: category.id,
                                description: category.description,
                                emoji: category.emoji || undefined
                            }
                        }) || {
                            label: 'Não há categorias',
                            value: 'undefined',
                            description: 'Nenhuma categoria registrada',
                        })
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`product_emoji`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 😁`)
                        .setRequired(true)
                    ),
                    new LabelBuilder()
                    .setLabel('Preço do Produto (Unidade)')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`product_price`)
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 7.00 (apenas número com . para separar centavos se necessário)`)
                        .setRequired(true)
                    )
                ])
            );
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