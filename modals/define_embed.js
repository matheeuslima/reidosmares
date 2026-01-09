import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    ContainerBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    TextDisplayBuilder,
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import botConfig from "../config.json" with { type: "json" };
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

            const embedCode = JSON.parse(interaction.fields.getTextInputValue('embed_code'));
            const editedEmbed = interaction.customId.split(":")[1];
            const messageContent = embedCode['content'];
            const messageEmbed = embedCode['embed'];

            // registrar na db
            await mongoClient.db().collection("embeds").findOneAndUpdate(
                {id: editedEmbed},
                {$set: {
                    id: editedEmbed,
                    code: interaction.fields.getTextInputValue('embed_code')
                }},
                {upsert: true, returnDocument: 'after'}
            )

            // cada embed faz algo
            switch (editedEmbed) {
                // enviar no chat de criar
                case "new_cart": {
                    await interaction.guild.channels.cache.get(botConfig.channel.newCart).send({
                        content: messageContent,
                        embeds: [messageEmbed],
                        components: [
                            new ActionRowBuilder()
                            .setComponents([
                                new ButtonBuilder()
                                .setLabel('Abrir carrinho!')
                                .setEmoji('🛒')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('create_cart'),
                                new ButtonBuilder()
                                .setLabel('Ver estoque')
                                .setEmoji('📦')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('view_stock'),
                            ])
                        ]
                    })
                    break;
                }
                default: {
                    break;
                }
            }

            // responder o cara
            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                        .setContent(`### 📝 Embed ${editedEmbed} alterado com sucesso`)
                    )
                ]
            });
        } catch (error) {
            console.error(error);
            
            await interaction.reply({
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
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