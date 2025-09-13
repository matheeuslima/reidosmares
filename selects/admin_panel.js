import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";
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
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {
        
        try {
            await client.connect();
            await interaction.deferReply().then(reply => reply?.delete());
            
            switch(interaction.values[0]) {
                case "define_embeds": {
                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setDescription('Selecione um embed para editar')
                        ],
                        components: [
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
                        ]
                    })
                    break;
                };

                case "manage_product_categories": {
                    const categories = await client.db().collection('product_categories').find().toArray();

                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setTitle('Gerenciar categorias de produtos')
                            .setDescription(`### Atuais categorias:\n- ${categories.map(category => `**${category.emoji} ${category.name} (${category.id}):** ${category.description}`).join('\n- ') || 'Nenhuma categoria definida.'}`)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new StringSelectMenuBuilder()
                                .setPlaceholder('Selecionar categoria pra editar...')
                                .setCustomId('admin_panel_select_category')
                                .setOptions(
                                    categories.length>0 ? categories.map(category => ({
                                        label: category.name,
                                        description: `ID: ${category.id} | ${category.description}`,
                                        value: category.id
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
                        ]
                    })
                    break;
                };

                case "manage_products": {
                    
                    const products = await client.db().collection('products').find().toArray();
                    const categories = new Set(products.map(product => product.category));

                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setTitle('Gerenciar produtos')
                            .setDescription(`### Atuais produtos:\n- ${Array.from(categories).map(category => `**${category || 'Sem categoria'}**\n  - ${products.filter(product => product.category == category).map(product => `**${product.name} (${product.id}, R$${product.price.toFixed(2)})**: ${product.description}`).join('\n  - ')}`).join('\n- ') || 'Nenhum produto disponível.'}`)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new StringSelectMenuBuilder()
                                .setPlaceholder('Selecionar produto pra editar...')
                                .setCustomId('admin_panel_select_product')
                                .setOptions(
                                    products.length>0 ? products.map(product => ({
                                        label: product.name,
                                        description: `ID: ${product.id} | R$${product.price.toFixed(2)} | ${product.hasStock ? 'Em estoque' : 'Sem estoque'}`,
                                        value: product.id
                                    })) : [
                                        { label: 'Nenhum produto disponível', description: 'Adicione produtos para gerenciá-los aqui.', value: 'no_products', default: true }
                                    ]
                                )
                                .setMinValues(1)
                                .setMaxValues(1),
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
                        ]
                    })
                    break;
                };

                case "define_roles_by_spending": {
                    const roles = await client.db().collection('roles_by_spending').find().toArray();

                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setTitle('Definir cargos por quantidade gasta')
                            .setDescription(`### Cargos definidos:\n- ${roles.map(role => `**<@&${role.roleId}>:** R$${role.spendingThreshold.toFixed(2)}`).join('\n- ') || 'Nenhum cargo definido.'}`)
                        ],
                        components: [
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
                        ]
                    })
                    break;
                }

                default: {
                    break;
                };
            }
            
        } catch (error) {
            console.error(error);
            await interaction.reply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`, flags: [MessageFlags.Ephemeral]});
        } finally {
            await client.close();
        }
    }

}