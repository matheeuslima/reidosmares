import {
    Colors,
    ContainerBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    StringSelectMenuInteraction,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
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
        
        try {
            await mongoClient.connect();
            const embed = await mongoClient.db().collection("embeds").findOne({id: interaction.values[0]});

            await interaction.showModal(
                new ModalBuilder()
                .setCustomId(`define_embed:${interaction.values[0]}`)
                .setTitle('Defina o embed')
                .addLabelComponents(
                    new LabelBuilder()
                    .setLabel('Código do Embed')
                    .setTextInputComponent(
                        new TextInputBuilder()
                        .setCustomId(`embed_code`)
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Layout do site da Loritta. {content: "", embed: {}}')
                        .setValue(embed.code)
                        .setMaxLength(4000)
                        .setRequired(true)
                    )
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