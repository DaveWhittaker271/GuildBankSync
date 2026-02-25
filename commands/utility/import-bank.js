const { SlashCommandBuilder, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const modal = require('../../modals/import-bank.js');

module.exports = {
	data: new SlashCommandBuilder().setName('importbank').setDescription('Import a bank string from Guild Bank List Creator Plus addon'),
	async execute(interaction) {
		await modal.show(interaction);
	},
};