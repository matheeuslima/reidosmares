import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
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
     * @param {ButtonInteraction} interaction
     */
    async execute(interaction) {
        try {
            await client.connect();

            interaction.showModal(
                new ModalBuilder()
                .setCustomId(`add_product`)
                .setTitle('Novo produto')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_name`)
                        .setLabel('Nome do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000 Sheckles`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_id`)
                        .setLabel('ID do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 1000_sheckles`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_category`)
                        .setLabel('ID da Categoria do Produto')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Uma das seguintes: ${(await client.db().collection('product_categories').find().toArray()).map(category => category.id).join(', ')}`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_description`)
                        .setLabel('Descrição do Produto')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder(`Ex.: O que esse produto faz`)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId(`product_price`)
                        .setLabel('Preço do Produto (Unidade)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`Ex.: 7.00 (apenas número com . para separar centavos se necessário)`)
                        .setRequired(true)
                    )
                )
            )
            
        } catch (error) {
            console.error(error);
            await interaction.editReply({content: `Ocorreu um erro na execução dessa ação. ${error.message}.`});
        } finally {
            await client.close();
        }
    }

}