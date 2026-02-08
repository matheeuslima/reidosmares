import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import client from "./src/Client.js";
import cron from "node-cron";
import "dotenv/config";
import { ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";

// Simular __dirname e __filename no ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = await import(pathToFileURL(path.resolve(filePath)).href);
    const event = eventModule.default || eventModule; // Suporte para export default

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Handler para eventos periódicos (timed)
const timedPath = path.join(__dirname, 'timed');
const timedFiles = fs.existsSync(timedPath) ? fs.readdirSync(timedPath).filter(file => file.endsWith(".js")) : [];
for (const file of timedFiles) {
    const filePath = path.join(timedPath, file);
    const timedModule = await import(pathToFileURL(path.resolve(filePath)).href);
    const timed = timedModule.default || timedModule;

    if (timed.cron && typeof timed.execute === "function") {
        cron.schedule(timed.cron, async () => {
            try {
                await timed.execute();
                //console.log(`[Timed] Executado: ${timed.name}`);
            } catch (err) {
                console.error(`[Timed] Erro ao executar ${timed.name}:`, err);
            }
        });
        //console.log(`[Timed] Registrado: ${timed.name} (${timed.cron})`);
    }
}

// Crash handle
process.on('uncaughtException', async (err, origin) => {
    console.error(`Exceção não capturada.`, err, origin);
});
process.on('unhandledRejection', async (reason, promise) => {
    console.error(`Rejeição não manuseada.`, reason, promise);
});


// Desligamento
process.on('exit', () => {
    console.log('\nDesligando...');
});
process.on('SIGINT', async () => {
    try {
        console.log('Iniciando o processo de desligamento...');
        await mongoClient.connect();

        if (client.tickets && client.tickets.size > 0) {
            const ticketsToWarn = Array.from(client.tickets.values());
            ticketsToWarn.forEach(ticket => {
                const channel = client.channels.cache.get(ticket.channelId);
                if (channel) {
                    channel.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [
                            new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                .setContent(`### ⚠️ O bot está sendo desligado ou reiniciado. Por favor, abra um novo carrinho quando o mesmo estiver ligado novamente.`)
                            )
                        ]
                    });
                };
            })
            console.log('Todos os tickets abertos foram avisados do desligamento.');
        } else {
            console.log('Nenhum ticket para avisar.');
        }
    } catch (error) {
        console.error('Erro ao avisar os tickets sobre o desligamento:', error);
    };
});

// Logar o cliente
client.login(process.env.DISCORD_BOT_TOKEN);