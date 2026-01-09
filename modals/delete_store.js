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

            const storeId = interaction.fields.getStringSelectValues('store_id')[0];

            await mongoClient.db().collection("stores").deleteOne({id: storeId});
            const categories = await mongoClient.db().collection("product_categories").find({store: storeId}).toArray();
            const deletedCategories = await mongoClient.db().collection("product_categories").deleteMany({store: storeId});
            const deletedProducts = (await Promise.all(categories.map(async (category) => {
                return (await mongoClient.db().collection("products").deleteMany({ category: category.id })).deletedCount || 0;
            }))).reduce((acumulador, valorAtual) => {
                return acumulador + valorAtual;
            }, 0);

            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`### 🚮 Loja "${storeId}", suas ${deletedCategories.deletedCount} categorias e seus ${deletedProducts} produtos excluídos com sucesso.`),
                    )
                ]
            });

            // atualizar painel
            const stores = await mongoClient.db().collection('stores').find().toArray();

            await interaction.message.edit({
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
                        .setContent(`\n- ${stores.map(store => `**${store.emoji} ${store.name} (${store.id})**`).join('\n- ') || 'Nenhuma loja definida.'}`)
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                        .setSpacing(SeparatorSpacingSize.Large)
                    )
                    .addActionRowComponents([
                        new ActionRowBuilder()
                        .setComponents([
                            new StringSelectMenuBuilder()
                            .setPlaceholder('Selecionar loja pra editar...')
                            .setCustomId('admin_panel_select_store')
                            .setOptions(
                                stores.length>0 ? stores.map(store => ({
                                    label: store.name,
                                    description: store.id,
                                    value: store.id,
                                    emoji: store.emoji || undefined
                                })) : [
                                    { label: 'Nenhuma loja disponível', description: 'Adicione lojas para gerenciá-las aqui.', value: 'no_stores', default: true }
                                ]
                            )
                            .setMinValues(1)
                            .setMaxValues(1),
                        ]),
                        new ActionRowBuilder()
                        .setComponents([
                            new ButtonBuilder()
                            .setCustomId('add_store')
                            .setEmoji('➕')
                            .setLabel('Adicionar nova loja')
                            .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                            .setCustomId('delete_store')
                            .setEmoji('🗑️')
                            .setLabel('Excluir uma loja')
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