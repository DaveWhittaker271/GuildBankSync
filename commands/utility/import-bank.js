const { 
	SlashCommandBuilder, 
	LabelBuilder, 
	TextInputBuilder, 
	TextInputStyle, 
	ContainerBuilder, 
	MessageFlags, 
	ThreadAutoArchiveDuration
} = require('discord.js');

const CSV = require('csv-string')

const { channelId, threadName } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('importbank')
	.setDescription('Import a bank string from Guild Bank List Creator Plus addon')
	.addAttachmentOption((option) => option.setName('attachment').setDescription('The input to echo back').setRequired(true)),
	async execute(client, interaction) {
		const attachment = interaction.options.getAttachment('attachment');
		
		const csvData = await getAttachmentContents(attachment);
		
		const items = [];
		
		const itemGroups = {};
		
		CSV.forEach(csvData, ',', function (row, index) {
		  if (row.length != 7) {
			return;
		  }
		  
		  const itemName = row[0];
		  const itemQuantity = row[1];
		  const itemLink = row[2];
		  let itemGroup = row[5];	  
		  
		  itemGroup = overrideItemGroups(itemName, itemGroup);
		  
		  if (!Object.hasOwn(itemGroups, itemGroup)) {
			  itemGroups[itemGroup] = [];
		  }
		  
		  const item = postProcessItem({name: itemName, quantity: itemQuantity, link: itemLink});
		  
		  itemGroups[itemGroup].push(item);
		});
		
		const thread = await prepareThread(client);

		const componentsList = [];
		
		let containerComponent = null;
			
		const MAX_ITEMS_PER_MSG = 39;
		const NEXT_MSG_ITEM_PADDING = 5;
		
		let itemGroupKeys = Object.keys(itemGroups);
		itemGroupKeys.sort();
		
		const priorityGroupNames = getPriorityGroupNames();
		
		const priorityGroups = [];
		const otherGroups = [];
		
		itemGroupKeys.forEach(groupKey => {
			let added = false;
			
			priorityGroupNames.forEach(priorityGroupName => {
				if (groupKey.includes(priorityGroupName)) {
					priorityGroups.push(groupKey);
					added = true;
				}
			});
			
			if (!added) {
				otherGroups.push(groupKey);
			}
		});
		
		itemGroupKeys = priorityGroups.concat(otherGroups);
		
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
		
		await interaction.reply({
			content: `Import has been successfully processed`,
			flags: MessageFlags.Ephemeral 
		});
	},
};

const getAttachmentContents = async (attachment) => {
    const response = await fetch(attachment.attachment)
    const data = await response.text()

    return data.trim();
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

const postProcessItem = (item) => {
	item.itemId = item.link.replace('https://classic.wowhead.com/item=', '');
	
	//console.log('Extracted item ID ' + item.itemId + ' from ' + item.name);
	
	switch (item.itemId) {
		// Voodoo dolls
		case "19818":
			item.name = item.name + ' (Mage)';
		break;
		case "19813":
			item.name = item.name + ' (Warrior)';
		break;
		case "19814":
			item.name = item.name + ' (Rogue)';
		break;
		case "19815":
			item.name = item.name + ' (Paladin)';
		break;
		case "19816":
			item.name = item.name + ' (Hunter)';
		break;
		case "19817":
			item.name = item.name + ' (Shaman)';
		break;
		case "19819":
			item.name = item.name + ' (Warlock)';
		break;
		case "19820":
			item.name = item.name + ' (Priest)';
		break;
		case "19821":
			item.name = item.name + ' (Druid)';
		break;
	}
	
	return item;
}

const overrideItemGroups = (itemName, itemGroup) => {
	const overrides = [
		{
			"name": "Zul'Gurub - Bijous",
			"masks": [
				'Bijou',
			]
		},
		{
			"name": "Zul'Gurub - Coins",
			"masks": [
				'Zulian Coin',
				'Razzashi Coin',
				'Hakkari Coin',
				'Gurubashi Coin',
				'Vilebranch Coin',
				'Witherbark Coin',
				'Sandfury Coin',
				'Skullsplitter Coin',
				'Bloodscalp Coin',
			]
		},
		{
			"name": "Zul'Gurub - Dolls",
			"masks": [
				'Voodoo Doll',
			]
		},
		{
			"name": "Zul'Gurub - Trade Goods",
			"masks": [
				'Bloodvine',
				'Primal Bat Leather',
				'Primal Tiger Leather',
				'Souldarite',
			]
		},
		{
			"name": "Ahn'Qiraj - Idols",
			"masks": [
				'Idol',
			]
		},
		{
			"name": "Ahn'Qiraj - Scarabs",
			"masks": [
				'Scarab',
			]
		},
		{
			"name": "Onyxia",
			"masks": [
				'Scale of Onyxia',
			]
		},
		{
			"name": "Molten Core",
			"masks": [
				'Fiery Core',
				'Lava Core',
				'Core Leather',
			]
		},
	];
	
	for (let i = 0; i < overrides.length; i++) {
		const groupDetails = overrides[i];
		
		for (let j = 0; j < groupDetails.masks.length; j++) {
			const mask = groupDetails.masks[j];
			if (itemName.includes(mask)) {
				return groupDetails.name;
			}
		}
	}
	
	return itemGroup;
};

const getPriorityGroupNames = () => {
	return [
		"Ahn'Qiraj",
		"Zul'Gurub",
		"Onyxia",
		"Molten Core",
		"Book",
	];	
}