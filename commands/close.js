const discord = require('discord.js')
const schema = require('../models/winkels')

module.exports = {
	name: 'close',
	description: 'Sluit een winkel',
	mineArgs: 1,
	usage: '<Winkel>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

        var winkelName = args.splice(0, args.length).join(" ").toLowerCase()

		const result = await schema.findOne({ serverId: message.guild.id, name: winkelName })
        if (!result) return message.reply("Winkel niet gevonden!")
		
		await schema.findOneAndUpdate(
            {
                serverId: message.guild.id,
                name: winkelName
            },
            {
                serverId: message.guild.id,
                name: winkelName,
                status: "CLOSED"
            },
            {
                upsert: true
            }
        )

        var embed = new discord.MessageEmbed()
            .setTitle(`${winkelName} is gesloten!`)

        message.channel.send(embed)
	},
};