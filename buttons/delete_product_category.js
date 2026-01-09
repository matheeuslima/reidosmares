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

            const categories = await mongoClient.db().collection('product_categories').find().toArray();
            if(!categories?.length) return await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Red)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent(`### ❌ Ocorreu um erro`),
                        new TextDisplayBuilder()
                        .setContent(`\`\`\`Não há categorias registradas.\`\`\``)
                    ])
                ]
            });

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_product_category`)
                .setTitle('Qual categoria de produto vai apagar?')
                .addLabelComponents(
                    new LabelBuilder()
                    .setLabel('Categoria a ser excluída')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`category_id`)
                        .setRequired(true)
                        .setOptions(categories.map(category => {
                            return {
                                label: `${category.name} (${category.id})`,
                                description: `${category.description} | ${category.store}`,
                                value: category.id,
                                emoji: category.emoji || undefined,
                            }
                        }))
                    )
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent(`⚠️ Apagar essa categoria também excluirá todos os produtos pertencentes a ela.`)
                )
            )
        } catch (error) {
            console.error(error);

            await interaction.editReply({
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