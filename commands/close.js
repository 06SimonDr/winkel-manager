const discord = require('discord.js')
const schema = require('../models/winkels')
const medwSchema = require("../models/werknemers")

module.exports = {
	name: 'close',
	description: 'Sluit een winkel',
    aliases: ['sluit'],
	mineArgs: 1,
	usage: '<Winkel>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

        var winkelName = args.splice(0, args.length).join(" ")

		const result = await schema.findOne({ serverId: message.guild.id, name: winkelName })
        const result2 = await medwSchema.findOne({ serverId: message.guild.id, userId: message.author.id })
        if (result2) if (result2.activeWinkel !== winkelName) return message.reply(`Je hebt je niet aangemeld bij deze winkel, gelieve je eerst aan te melden met ${prefix}open.`)

        if (!result) return message.reply("Winkel niet gevonden!")
            result.roles.forEach(async role => {
                if(message.member.roles.cache.has(role)) {
                    await medwSchema.findOneAndUpdate(
                        { serverId: message.guild.id, userId: message.author.id },
                        { serverId: message.guild.id, userId: message.author.id, activeWinkel: null },
                        { upsert: true }
                    )

                    await schema.findOneAndUpdate(
                        { serverId: message.guild.id, name: winkelName },
                        { serverId: message.guild.id, name: winkelName, $inc: { active: -1 } },
                        { upsert: true }
                    )
            
                    var embed = new discord.MessageEmbed()
                        .setTitle(`Je bent nu afwezig bij ${winkelName}!`)
            
                    message.channel.send(embed)
                }
            })
	},
};