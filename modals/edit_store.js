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
            
            const storeName = interaction.fields.getTextInputValue('store_name');
            const storeId = interaction.fields.getTextInputValue('store_id');
            const storeEmoji = interaction.fields.getTextInputValue('store_emoji');
            const oldId = interaction.customId.split(':')[1];

            // verifica se o ID do produto já existe
            const store = await mongoClient.db().collection("stores").findOne({id: oldId});
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

            // atualiza no banco
            await mongoClient.db().collection("stores").updateOne({id: oldId}, {
                $set: {
                    name: storeName,
                    id: storeId,
                    emoji: storeEmoji,
                }
            })

            // atualiza categorias
            storeId != oldId && await mongoClient.db().collection("product_categories").updateMany({store: oldId}, {
                $set: {
                    store: storeId
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
                        .setContent('# Loja atualizada'),
                        new TextDisplayBuilder()
                        .setContent(`## ${storeEmoji} ${storeName}\n- **ID:** \`${storeId}\``)
                    ])
                ]
            });

            // atualizar painel
            const stores = await mongoClient.db().collection('stores').find().toArray();

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