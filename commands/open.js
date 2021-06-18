const discord = require('discord.js')
const schema = require('../models/winkels')
const medwSchema = require("../models/werknemers")

var perms;

module.exports = {
	name: 'open',
	description: 'Open een winkel',
	minArgs: 1,
	usage: '<Winkel>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

        var winkelName = args.splice(0, args.length).join(" ")

        const result = await schema.findOne({ serverId: message.guild.id, name: winkelName })
        const result2 = await medwSchema.findOne({ serverId: message.guild.id, userId: message.author.id })
        if (result2) if (!result2.activeWinkel === null) return message.reply(`Meld je eerst af bij ${result2.activeWinkel}, voor je een nieuwe winkel opent!`)
        if (!result2 || !result2.winkels.includes(winkelName)) {
        if (!result) return message.reply("Winkel niet gevonden!")
            result.roles.forEach(role => {
                if(message.member.roles.cache.has(role)) perms = true
            })
        } else perms = true

        if (perms === true) {

            await medwSchema.findOneAndUpdate(
                { serverId: message.guild.id, userId: message.author.id },
                { serverId: message.guild.id, userId: message.author.id, date: message.createdTimestamp, activeWinkel: winkelName, $push: { winkels: winkelName } },
                { upsert: true }
            )

            await schema.findOneAndUpdate(
                { serverId: message.guild.id, name: winkelName },
                { serverId: message.guild.id, name: winkelName, $inc: { active: 1 } },
                { upsert: true }
            )
    
            var embed = new discord.MessageEmbed()
                .setTitle(`Je bent nu aanwezig bij ${winkelName}!`)
                .setTimestamp()
    
            message.channel.send(embed)
        } else {
            return message.reply("Je werkt niet bij deze winkel!")
        }
	},
};