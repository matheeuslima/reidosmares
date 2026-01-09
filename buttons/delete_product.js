import {
    ButtonInteraction,
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
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

            // pega os produtos e dá erro se não tiver
            const products = await mongoClient.db().collection('products').find().toArray();
            if(!products?.length) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Não há produtos para excluir.\`\`\``)
                    ])
                ]
            });

            // início do modal
            const deletionModal = new ModalBuilder()
            .setCustomId(`delete_product`)
            .setTitle('Qual produto vai apagar?')
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                .setContent(`⚠️ Por limitações do Discord, tem um menu de seleção para cada 25 produtos. No entanto, o bot só deletará **um** produto, então escolha apenas em um dos menus.`)
            );
            
            // transformar os produtos em opção de select menu
            const productOptions = products.map(product => {
                return {
                    label: product.name,
                    description: `ID: ${product.id} | R$${product.price.toFixed(2)} | Estoque: ${product.stock || 'Sem estoque'}`,
                    value: product.id,
                    emoji: product.emoji || undefined,
                }
            });

            // número de select menus
            const productSelectAmount = Math.ceil(productOptions.length/25);

            // adiciona os select menus paginados
            for (let i = 0; i < productSelectAmount; i++) {
                deletionModal.addLabelComponents(
                    new LabelBuilder()
                    .setLabel(`Produto a ser excluído (${i}-${ (i+1)*25 > productOptions.length ? (i+1)*25 : productOptions.length })`)
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`product_id:${i}`)
                        .setRequired(false)
                        .setOptions(
                            productOptions.slice(i*25, (i+1)*25-1)
                        )
                    )
                );
            };

            // exibe o modal finalizado
            await interaction.showModal(deletionModal);
        } catch (error) {
            console.error(error);
            
            await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
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