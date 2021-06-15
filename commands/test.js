const schema = require('../models/bot-tokens')

module.exports = {
	name: 'test',
	description: 'Ping!',
	aliases: ['ping', 'create'],
	args: 1,
	usage: '<naam> <beschrijving> <actie> <waarde>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

		const newToken = new schema({
				serverId: message.guild.id,
				token: args[0],
		})
		await newToken.save().catch(()=>{});
		message.reply('Token succesvol opgeslagen!')
	},
};