// Set up commands from the commands/ directory
const fs = require('node:fs');
const path = require('node:path');

const { Collection, MessageFlags } = require('discord.js');

const modals = new Collection(); 

module.exports = {
	setup: () => {
		const modalsPath = path.join(__dirname, '../modals');
		
		const modalFiles = fs.readdirSync(modalsPath).filter((file) => file.endsWith('.js'));
		for (const file of modalFiles) {
			const filePath = path.join(modalsPath, file);
			
			const modal = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			
			if ('id' in modal && 'interact' in modal) {
				modals.set(modal.id, modal);
			} else {
				console.log(`[WARNING] The modal at ${filePath} is missing a required "id" or "interact" property.`);
			}
		}
		
		return modals;
	},
	handleInteraction: async (client, interaction) => {
		const modal = modals.get(interaction.customId);
		
		if (!modal) {
			console.error(`No modal matching ${interaction.customId} was found.`);
			return;
		}
		
		try {
			await modal.interact(client, interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	},
}