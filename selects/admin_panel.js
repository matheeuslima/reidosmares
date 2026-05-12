import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
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
            
            switch(interaction.values[0]) {
                // definir embeds
                case "define_embeds": {
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
                                .setContent(`Selecione um embed para editar.`)
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addActionRowComponents([
                                new ActionRowBuilder()
                                .setComponents([
                                    new StringSelectMenuBuilder()
                                    .setPlaceholder('Qual embed você quer editar?')
                                    .setCustomId('admin_panel_define_embeds')
                                    .setOptions([
                                        {label: "Embed de criar carrinho", value: "new_cart"},
                                        {label: "Embed ao abrir o carrinho", value: "cart_starter"},
                                    ])
                                ])
                            ])
                        ]
                    });
                    break;
                };

                // gerenciar categorias de produto
                case "manage_product_categories": {
                    const categories = await mongoClient.db().collection('product_categories').find().toArray();
                    const stores = new Set(categories.map(category => category.store).filter(store => store));

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
                                .setContent(`${Array.from(stores).map(store => `### ${store || 'Sem loja definida'}\n- ${categories.filter(category => category.store == store).map(category => `**${category.emoji || ''} ${category.name} (${category.id})**: ${category.description}`).join('\n- ')}`).join('\n') || 'Nenhuma categoria disponível.'}`)
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
                    break;
                };

                // gerenciar produtos
                case "manage_products": {
                    const products = await mongoClient.db().collection('products').find().toArray();
                    const categories = await mongoClient.db().collection('product_categories').find().toArray();
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
                                .setContent(`${stores.map(store => `## ${store.id}\n` +
                                    (categories.filter(cat => cat.store === store.id).map(cat => `### ${cat.id}\n` +
                                        (products.filter(prod => prod.category === cat.id).map(prod => `- ${prod.emoji} **${prod.id}**︱\`R$${prod.price.toFixed(2)}\`︱\`${prod.stock <= 0 ? `Esgotado (${prod.stock})` : prod.stock >= 1_000_000 ? `∞ (${prod.stock})` : prod.stock}\`\n`).join('') || '- Nenhum produto disponível.\n')
                                    ).join('') || '- Nenhuma categoria cadastrada.\n')
                                ).join('\n') || 'Nenhuma loja cadastrada.'}`)
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addActionRowComponents([
                                new ActionRowBuilder()
                                .setComponents([
                                    new StringSelectMenuBuilder()
                                    .setPlaceholder('Selecionar produto pra editar...')
                                    .setCustomId('admin_panel_select_product')
                                    .setOptions(
                                        products.length>0 ? products.map(product => ({
                                            label: product.name,
                                            description: `ID: ${product.id} | R$${product.price.toFixed(2)} | Estoque: ${product.stock || 'Sem estoque'}`,
                                            value: product.id,
                                            emoji: product.emoji
                                        })).slice(0, 25) : [
                                            { label: 'Nenhum produto disponível', description: 'Adicione produtos para gerenciá-los aqui.', value: 'no_products', default: true }
                                        ]
                                    )
                                    .setMinValues(1)
                                    .setMaxValues(1),
                                ]),
                                new ActionRowBuilder()
                                .setComponents([
                                    new ButtonBuilder()
                                    .setCustomId(`page_previous:admin_panel_products:0`)
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(true),
                                    new ButtonBuilder()
                                    .setCustomId(`page_next:admin_panel_products:0`)
                                    .setEmoji('➡️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(products.length <= 25),
                                ]),
                                new ActionRowBuilder()
                                .setComponents([
                                    new ButtonBuilder()
                                    .setCustomId('add_product')
                                    .setEmoji('➕')
                                    .setLabel('Adicionar novo produto')
                                    .setStyle(ButtonStyle.Success),
                                    new ButtonBuilder()
                                    .setCustomId('delete_product')
                                    .setEmoji('🗑️')
                                    .setLabel('Excluir um produto')
                                    .setStyle(ButtonStyle.Danger),
                                ])
                            ])
                        ]
                    });
                    break;
                };

                // gerenciar lojas
                case "manage_stores": {
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
                    break;
                };
                
                // definir cargos de gastador
                case "define_roles_by_spending": {
                    const roles = await mongoClient.db().collection('roles_by_spending').find().toArray();

                    await interaction.message.edit({
                        flags: [MessageFlags.IsComponentsV2],
                        allowedMentions: { parse: [] },
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
                                .setContent(`- ${roles.map(role => `**<@&${role.roleId}>:** R$${role.spendingThreshold.toFixed(2)}`).join('\n- ') || 'Nenhum cargo definido.'}`)
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder()
                                .setComponents([
                                    new ButtonBuilder()
                                    .setCustomId('add_role_by_spending')
                                    .setEmoji('➕')
                                    .setLabel('Adicionar novo cargo')
                                    .setStyle(ButtonStyle.Success),
                                    new ButtonBuilder()
                                    .setCustomId('delete_role_by_spending')
                                    .setEmoji('🗑️')
                                    .setLabel('Excluir um cargo')
                                    .setStyle(ButtonStyle.Danger),
                                ])
                            )
                        ]
                    });
                    break;
                }

                default: {
                    break;
                };
            }
            
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
            await interaction.deferReply().then(reply => reply?.delete());
            await mongoClient.close();
        };
    }
};