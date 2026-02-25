const { SlashCommandBuilder, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

module.exports = {
	id: 'importBankCsv',
	async show(interaction) {
		const modal = new ModalBuilder().setCustomId('importBankCsv').setTitle('Import GBLC String');
		
		const csvInput = new TextInputBuilder()
			.setCustomId('csvInput')
			.setStyle(TextInputStyle.Paragraph);
		
		const inputLabel = new LabelBuilder()
			.setLabel('CSV String')
			.setTextInputComponent(csvInput);
			
		// Add label to the modal
		modal.addLabelComponents(inputLabel);
		
		// Show modal to the user
		await interaction.showModal(modal);
	},
	async interact(interaction) {
		const fieldData = interaction.fields.getTextInputValue('csvInput');
		
		console.log('Submitted: ' + fieldData);
	}
};