const { 
	SlashCommandBuilder, 
	ModalBuilder, 
	LabelBuilder, 
	TextInputBuilder, 
	TextInputStyle, 
	ContainerBuilder, 
	MessageFlags, 
	ThreadAutoArchiveDuration
} = require('discord.js');

const CSV = require('csv-string')

const { channelId, threadName } = require('./../config.json');

module.exports = {
	id: 'importBankCsv',
	async show(interaction) {
		const modal = new ModalBuilder().setCustomId('importBankCsv').setTitle('Import GBLC String');
		
		const csvInput = new TextInputBuilder()
			.setCustomId('csvInput')
			.setStyle(TextInputStyle.Paragraph)
			.setMaxLength(20000);
		
		const inputLabel = new LabelBuilder()
			.setLabel('CSV String')
			.setTextInputComponent(csvInput);
			
		// Add label to the modal
		modal.addLabelComponents(inputLabel);
		
		// Show modal to the user
		await interaction.showModal(modal);
	},
	async interact(client, interaction) {
		const fieldData = interaction.fields.getTextInputValue('csvInput');
		
		const items = [];
		
		const itemGroups = {};
		
		CSV.forEach(fieldData, ',', function (row, index) {
		  if (row.length != 7) {
			return;
		  }
		  
		  const itemName = row[0];
		  const itemQuantity = row[1];
		  const itemLink = row[2];
		  const itemGroup = row[5];
		  
		  if (!Object.hasOwn(itemGroups, itemGroup)) {
			  itemGroups[itemGroup] = [];
		  }
		  
		  itemGroups[itemGroup].push({name: itemName, quantity: itemQuantity, link: itemLink});
		});
		
		const thread = await prepareThread(client);

		const componentsList = [];
		
		let containerComponent = null;
			
		const MAX_ITEMS_PER_MSG = 39;
		const NEXT_MSG_ITEM_PADDING = 5;
		
		const itemGroupKeys = Object.keys(itemGroups);
		for (let i = 0; i < itemGroupKeys.length; i++) {
			const itemGroup = itemGroupKeys[i];
			
			if (containerComponent != null && (containerComponent.components.length + NEXT_MSG_ITEM_PADDING) >= MAX_ITEMS_PER_MSG) {
				await sendContainerComponent(thread, containerComponent);
				console.log('starting new msg container - ' + containerComponent.components.length);
				containerComponent = null;
			}
			
			if (!containerComponent) {
				containerComponent = createContainerComponent(itemGroup);
			}
			
			addItemGroupHeader(containerComponent, itemGroup);
			
			const itemsInGroup = itemGroups[itemGroup];
			
			for (let j = 0; j < itemsInGroup.length; j++) {
				const item = itemsInGroup[j];
				
				if (containerComponent.components.length >= MAX_ITEMS_PER_MSG) {
					await sendContainerComponent(thread, containerComponent);
					console.log('starting new msg container - ' + containerComponent.components.length);
					containerComponent = createContainerComponent(itemGroup);
					addItemGroupHeader(containerComponent, itemGroup + ' (Continued)');
				}
				
				containerComponent.addTextDisplayComponents((textDisplay) =>
					textDisplay.setContent('[' + item.name + '](' + item.link + ') x' + item.quantity,),
				)
			}
		}
		
		console.log('Adding final msg container - ' + containerComponent.components.length);
		await sendContainerComponent(thread, containerComponent);
	}
};

const prepareThread = async (client) => {
	const channel = await client.channels.fetch(channelId);
	
	const existingThread = channel.threads.cache.find((x) => x.name === threadName);
	
	if (existingThread) {
		await existingThread.delete();
	}
	
	const currentTimestamp = Math.floor(Date.now() / 1000);
	
	const thread = await channel.threads.create({
		name: threadName,
		autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays,
		reason: 'New guild bank import',
		message: {
		 content: 'Snapshot of the guild bank contents as of <t:' + currentTimestamp + '>',
		},
	});
	
	await thread.pin({
		reason: 'Keep at top!',
	});
	
	return thread;
};

const createContainerComponent = (itemGroup, isFirst) => {	
	return new ContainerBuilder()
		.setAccentColor(0x0099ff);
}

const addItemGroupHeader = (component, itemGroup) => {
	if (component.components.length > 2) {
		component.addSeparatorComponents((separator) => separator);
	}
	
	component.addTextDisplayComponents((textDisplay) =>
		textDisplay.setContent('**' + itemGroup + '**'),
	);
	
	component.addSeparatorComponents((separator) => separator);	
};

const sendContainerComponent = async (thread, component) => {
	await thread.send({
		components: [component],
		flags: MessageFlags.IsComponentsV2,
	});
};