import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Colors,
    ContainerBuilder,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    TextDisplayBuilder
} from "discord.js";
import botConfig from "../config.json" with { type: "json" };
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

    data: new SlashCommandBuilder()
    .setName("estoque")
    .setDescription("[Administrativo] Edita o estoque.")
    .addStringOption(
        new SlashCommandStringOption()
        .setName('operação')
        .setDescription('O que será feito')
        .addChoices([
            {name: 'Adicionar', value: 'add'},
            {name: 'Definir', value: 'set'},
            {name: 'Subtrair', value: 'subtract'}
        ])
        .setRequired(true)
    )
    .addStringOption(
        new SlashCommandStringOption()
        .setName('produto')
        .setDescription('Produto que terá estoque alterado')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addIntegerOption(
        new SlashCommandIntegerOption()
        .setName('quantidade')
        .setDescription('A quantidade a ser adicionada, definida ou removida')
        .setRequired(true)
    ),
    
    /**
     * @param {AutocompleteInteraction} interaction
     */
    async autocomplete(interaction) {
        try {
            await mongoClient.connect();
            const options = (await mongoClient.db().collection("products").find({}).toArray()).map(product => {return {value: product.id, name: product.name}})
            const focusedOption = interaction.options.getFocused(true);
            await interaction.respond(options.filter(option => option.name.toLowerCase().includes(focusedOption.value.toLowerCase()) || option.value.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25))
        } catch (error) {
            console.error(error);
        } finally {
            await mongoClient.close();
        };
    },

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        // sem permissão
        if(!interaction.member.roles.cache.has(botConfig.role.owner) && !botConfig.owners.includes(interaction.user.id)) return await interaction.editReply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [
                new ContainerBuilder()
                .setAccentColor(Colors.Red)
                .addTextDisplayComponents([
                    new TextDisplayBuilder()
                    .setContent(`### ❌ Houve um erro ao tentar realizar essa ação`),
                    new TextDisplayBuilder()
                    .setContent(`\`\`\`Esse comando é exclusivo para administradores.\`\`\``)
                ])
            ]
        });

        try {
            await mongoClient.connect();

            const operation = interaction.options.getString('operação');
            const product = interaction.options.getString('produto');
            const amount = interaction.options.getInteger('quantidade');

            const oldData = await mongoClient.db().collection('products').findOne({ id: product });

            const result = await mongoClient.db().collection('products').findOneAndUpdate(
                { id: product },
                (operation == "set" ?
                    {
                        $set: {
                            stock: amount
                        }
                    } : {
                        $inc: {
                            stock: (operation == "subtract" ? -amount : amount)
                        }
                    }
                ),
                { returnDocument: 'after' }
            );

            await interaction.editReply({
                flags: [MessageFlags.IsComponentsV2],
                components: [
                    new ContainerBuilder()
                    .setAccentColor(Colors.Green)
                    .addTextDisplayComponents([
                        new TextDisplayBuilder()
                        .setContent('# Estoque atualizado'),
                        new TextDisplayBuilder()
                        .setContent(`- **Produto:** \`${product}\`\n- **Quantidade:** \`${oldData.stock} -> ${result.stock}\``)
                    ])
                ]
            });
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
                    flags: [MessageFlags.IsComponentsV2],
                    components: [errorContainer]
                });
            }
        } finally {
            await mongoClient.close();
        }
    }

};