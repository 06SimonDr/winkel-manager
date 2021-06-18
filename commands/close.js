const discord = require('discord.js')
const schema = require('../models/winkels')
const medwSchema = require("../models/werknemers")
const timeSchema = require("../models/time")

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
        if (result2) if (!result2.activeWinkel === winkelName) return message.reply(`Je hebt je niet aangemeld bij deze winkel, gelieve je eerst aan te melden met ${prefix}open.`)

        if (!result) return message.reply("Winkel niet gevonden!")
        if (!result2 || !result2.winkels.includes(winkelName)) {
            result.roles.forEach(async role => {
                if(message.member.roles.cache.has(role)) perms = true
            })
        } else var perms = true

        if (perms === true) {

            var startDate = result2.date;
            var endDate = message.createdTimestamp;
            var duration = endDate-startDate

            await new timeSchema({
                serverId: message.guild.id,
                userId: message.author.id,
                name: winkelName,
                startDate: startDate,
                endDate: endDate,
                duration: duration
            }).save().catch(()=>{});

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
                .setTimestamp()
            
            message.channel.send(embed)
        } else {
            return message.reply("Je werkt niet bij deze winkel!")
        }
	},
};