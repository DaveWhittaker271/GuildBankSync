const { SlashCommandBuilder, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const modal = require('../../modals/import-bank.js');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('importbank2')
	.setDescription('Import a bank string from Guild Bank List Creator Plus addon')
	.addAttachmentOption((option) => option.setName('attachment').setDescription('The input to echo back').setRequired(true)),
	async execute(interaction) {
		await modal.show(interaction);
	},
};