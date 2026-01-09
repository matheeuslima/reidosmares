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

            const stores = await mongoClient.db().collection('stores').find().toArray();
            if(!stores?.length) return interaction.reply({content: `Não há lojas para excluir.`, flags: [MessageFlags.Ephemeral]})

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`delete_store`)
                .setTitle('Qual loja vai apagar?')
                .addLabelComponents(
                    new LabelBuilder()
                    .setLabel('Loja a ser excluída')
                    .setStringSelectMenuComponent(
                        new StringSelectMenuBuilder()
                        .setCustomId(`store_id`)
                        .setRequired(true)
                        .setOptions(stores.map(store => {
                            return {
                                label: store.name,
                                description: store.id,
                                value: store.id,
                                emoji: store.emoji || undefined,
                            }
                        }))
                    )
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                    .setContent(`⚠️ Apagar essa loja também excluirá todas as categorias pertencentes a ela e produtos pertencentes às categorias.`)
                )
            );
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