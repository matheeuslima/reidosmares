import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await mongoClient.connect();

            const menu = interaction.customId.split(':')[1];
            const currentPage = interaction.customId.split(':')[2];

            await interaction.deferReply().then((reply) => reply.delete());

            switch (menu) {
                case 'admin_panel_products': {
                    const products = await mongoClient.db().collection('products').find().toArray();
                    const categories = new Set(products.map(product => product.category));

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
                                .setContent(`- ${Array.from(categories).map(category => `**${category || 'Sem categoria'}**\n  - ${products.filter(product => product.category == category).map(product => `**${product.emoji} ${product.name}** (\`${product.id}\`): R$${product.price.toFixed(2)}`).join('\n  - ')}`).join('\n- ') || 'Nenhum produto disponível.'}`)
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                .setSpacing(SeparatorSpacingSize.Large)
                            )
                            .addActionRowComponents([
                                new ActionRowBuilder()
                                .setComponents([
                                    new StringSelectMenuBuilder()
                                    .setPlaceholder(`Selecionar produto pra editar (pág ${currentPage})...`)
                                    .setCustomId('admin_panel_select_product')
                                    .setOptions(
                                        products.length>0 ? products.map(product => ({
                                            label: product.name,
                                            description: `ID: ${product.id} | R$${product.price.toFixed(2)} | Estoque: ${product.stock || 'Sem estoque'}`,
                                            value: product.id,
                                            emoji: product.emoji
                                        })).slice(0+(25*(currentPage-1)), 25+(25*(currentPage-1))) : [
                                            { label: 'Nenhum produto disponível', description: 'Adicione produtos para gerenciá-los aqui.', value: 'no_products', default: true }
                                        ]
                                    )
                                    .setMinValues(1)
                                    .setMaxValues(1),
                                ]),
                                new ActionRowBuilder()
                                .setComponents([
                                    new ButtonBuilder()
                                    .setCustomId(`page_previous:admin_panel_products:${currentPage-1}`)
                                    .setEmoji('⬅️')
                                    .setStyle(ButtonStyle.Primary)
                                    .setDisabled(currentPage-1 == 0),
                                    new ButtonBuilder()
                                    .setCustomId(`page_next:admin_panel_products:${currentPage-1}`)
                                    .setEmoji('➡️')
                                    .setStyle(ButtonStyle.Primary)
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
            
                default:
                    break;
            }
            
        } catch (error) {
            console.error(error);
            
            await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
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