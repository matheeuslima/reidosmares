import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
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

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();
            
            const categoryName = interaction.fields.getTextInputValue('category_name');
            const categoryId = interaction.fields.getTextInputValue('category_id');
            const categoryEmoji = interaction.fields.getTextInputValue('category_emoji');
            const categoryDescription = interaction.fields.getTextInputValue('category_description');
            const categoryStore = interaction.fields.getStringSelectValues('category_store')[0];
            const oldId = interaction.customId.split(':')[1];
            
            // verifica se o ID do produto já existe
            const category = await mongoClient.db().collection("product_categories").findOne({id: oldId});
            if(!category) return await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Categoria não encontrada no banco de dados.\`\`\``)
                    ])
                ]
            });

            // atualiza no banco
            await mongoClient.db().collection("product_categories").updateOne({id: oldId}, {
                $set: {
                    name: categoryName,
                    id: categoryId,
                    emoji: categoryEmoji,
                    description: categoryDescription,
                    store: categoryStore
                }
            })

            // atualiza produtos associados no banco
            categoryId != oldId && await mongoClient.db().collection("products").updateMany({id: oldId}, {
                $set: {
                    category: categoryId,
                }
            })

            // responde o cara
            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`# Categoria atualizada`),
                        new TextDisplayBuilder()
                        .setContent(`## ${categoryEmoji} ${categoryName}\n- **ID:** \`${categoryId}\`\n- **Descrição:** \`${categoryDescription}\`\n- **Loja:** \`${categoryStore}\``)
                    ])
                ]
            });

            // atualizar o painel
            const categories = await mongoClient.db().collection('product_categories').find().toArray();
            const stores = new Set(categories.map(category => category.store).filter(store => store));

            interaction.message.editable && await interaction.message.edit({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Blurple)
                    .addSectionComponents(
                        new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                            .setContent('# Painel administrativo')
                        )
                        .setButtonAccessory(
                            new ButtonBuilder()
                            .setCustomId('reset_panel')
                            .setLabel('Início')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🏠')
                        )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`- ${Array.from(stores).map(store => `**${store || 'Sem loja definida'}**\n  - ${categories.filter(category => category.store == store).map(category => `**${category.emoji || ''} ${category.name} (${category.id})**: ${category.description}`).join('\n  - ')}`).join('\n- ') || 'Nenhuma categoria disponível.'}`)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addActionRowComponents([
                        new ActionRowBuilder()
                        .setComponents([
                            new StringSelectMenuBuilder()
                            .setPlaceholder('Selecionar categoria pra editar...')
                            .setCustomId('admin_panel_select_category')
                            .setOptions(
                                categories.length>0 ? categories.map(category => ({
                                    label: `${category.name} (${category.id})`,
                                    description: `${category.description} | ${category.store || 'Sem loja definida'}`,
                                    value: category.id,
                                    emoji: category.emoji || undefined
                                })) : [
                                    { label: 'Nenhuma categoria disponível', description: 'Adicione categorias para gerenciá-las aqui.', value: 'no_categories', default: true }
                                ]
                            )
                            .setMinValues(1)
                            .setMaxValues(1),
                        ]),
                        new ActionRowBuilder()
                        .setComponents([
                            new ButtonBuilder()
                            .setCustomId('add_product_category')
                            .setEmoji('➕')
                            .setLabel('Adicionar nova categoria')
                            .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                            .setCustomId('delete_product_category')
                            .setEmoji('🗑️')
                            .setLabel('Excluir uma categoria')
                            .setStyle(ButtonStyle.Danger),
                        ])
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