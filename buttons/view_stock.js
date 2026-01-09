import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    MessageFlags,
    ModalBuilder,
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

            const products = await mongoClient.db().collection('products').find().toArray();
            const categories = await mongoClient.db().collection('product_categories').find().toArray();
            const stores = await mongoClient.db().collection('stores').find().toArray();

            await interaction.showModal(
                new ModalBuilder()
                .setTitle('Estoque')
                .setCustomId('view_stock')
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent(`${stores.map(store => `# ${store.emoji} **${store.name}**\n` +
                        (categories.filter(cat => cat.store === store.id).map(cat => `## ${cat.emoji} **${cat.name}**\n` +
                            (products.filter(prod => prod.category === cat.id).map(prod => `- ${prod.emoji} **${prod.name}** (R$${prod.price.toFixed(2)}): \`${prod.stock <= 0 ? "Esgotado" : prod.stock >= 1_000_000 ? "∞" : prod.stock}\`\n`).join('') || '- Nenhum produto cadastrado.\n')
                        ).join('') || '- Nenhuma categoria cadastrada.\n')
                    ).join('\n') || 'Nenhuma loja cadastrada.'}`)
                )
            )
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