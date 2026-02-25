// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { token } = require('./config.json');

const commands = require('./interactions/commands.js');
const modals = require('./interactions/modals.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

// Init commands & modal handlers
commands.setup(client);
modals.setup();

// Receive interaction events from Discord
client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		commands.handleInteraction(client, interaction);
	}
	
	if (interaction.isModalSubmit()) {
		modals.handleInteraction(interaction);
	}
});