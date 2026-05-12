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
        if(!interaction.member.permissions.has('ManageGuild')) {
            return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Você precisa da permissão de **Gerenciar Servidor** para usar esse botão!`)
                    ])
                ]
            });
        };

        try {
            await mongoClient.connect();
            const product = await mongoClient.db().collection('products').findOne({id: interaction.values[0]});
            if(!product) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Produto não encontrado no banco de dados.\`\`\``)
                    ])
                ]
            });
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`edit_product:${interaction.values[0]}`)
                .setTitle('Editar produto')
                .addLabelComponents([
                    new LabelBuilder()
                    .setLabel('Nome do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_name')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000 Sheckles`)
                        .setRequired(true)
                        .setValue(product.name)
                    ),
                    new LabelBuilder()
                    .setLabel('Categoria do Produto')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId('product_category')
                        .setPlaceholder(`${product.category}`.substring(0, 100))
                        .addOptions((await mongoClient.db().collection('product_categories').find().toArray()).map(category => {
                            return {
                                label: category.name,
                                description: category.description.substring(0, 50),
                                value: category.id,
                                emoji: category.emoji || undefined,
                                default: category.id === product.category
                            }
                        }))
                    ),
                    new LabelBuilder()
                    .setLabel('Emoji do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_emoji')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Ex.: 😁')
                        .setRequired(true)
                        .setValue(product.emoji)
                    ),
                    new LabelBuilder()
                    .setLabel('Preço do Produto (Unidade)')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_price')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 7.00 (apenas número com . para separar centavos se necessário)`)
                        .setRequired(true)
                        .setValue(product.price.toString())
                    ),
                    new LabelBuilder()
                    .setLabel('Estoque do Produto')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId('product_stock')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Número inteiro de 0 ao infinito')
                        .setRequired(true)
                        .setValue(`${product.stock}`)
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