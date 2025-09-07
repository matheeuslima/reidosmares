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
                    await interaction.message.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Blurple)
                            .setTitle('Gerenciar categorias de produtos')
                            .setDescription(`### Atuais categorias:\n- ${(await client.db().collection('product_categories').find().toArray()).map(category => `**${category.emoji} ${category.name} (${category.id}):** ${category.description}`).join('\n- ')}`)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                .setCustomId('add_product_category')
                                .setLabel('Adicionar')
                                .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                .setCustomId('delete_product_category')
                                .setLabel('Excluir')
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
                            .setDescription(`### Atuais produtos:\n- ${Array.from(categories).map(category => `**${category || 'Sem categoria'}**\n  - ${products.filter(product => product.category == category).map(product => `**${product.name} (${product.id}, R$${product.price.toFixed(2)})**: ${product.description}`).join('\n  - ')}`).join('\n- ')}`)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                .setCustomId('add_product')
                                .setLabel('Adicionar')
                                .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                .setCustomId('delete_product')
                                .setLabel('Excluir')
                                .setStyle(ButtonStyle.Danger),
                            ])
                        ]
                    })
                    break;
                };

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