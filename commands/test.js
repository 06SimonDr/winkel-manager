const discord = require('discord.js')

module.exports = {
	name: 'test',
	description: 'Ping!',
	aliases: ['ping', 'create'],
	args: 0,
	usage: '<naam> <beschrijving> <actie> <waarde>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

		const embed = new discord.MessageEmbed()
		.setTitle('Test')
		.addField("Title here, no hyperlinks allowed", "Main text here, so you can put a hyperlink here [like so.](https://example.com)");

	},
};