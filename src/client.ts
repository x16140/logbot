import { Intents, Interaction, Message } from 'discord.js';
import { Client } from 'discordx';

const client = new Client({
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],

  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],

  silent: false,
});

client.on('ready', async () => {
  await client.guilds.fetch();

  await client.initApplicationCommands();
  await client.initApplicationPermissions();

  console.log('>> Bot started');
});

client.on('interactionCreate', (interaction: Interaction) => {
  client.executeInteraction(interaction);
});

client.on('messageCreate', (message: Message) => {
  client.executeCommand(message);
});

export { client };
