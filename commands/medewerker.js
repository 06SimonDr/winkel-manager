const discord = require('discord.js')
const schema = require('../models/winkels')
const medwSchema = require("../models/werknemers")

module.exports = {
	name: 'medewerker',
	description: 'Voeg een medewerker aan een winkel toe',
	aliases: ['medw'],
	minArgs: 3,
	usage: '<add/remove> <Role of Tag> <Winkel>',
    permissions: ["MANAGE_ROLES"],
	async execute(client, message, args, prefix) {

        try {
		var tagged = message.mentions.members.first().id
        } catch (err) {
            try {
                var tagged = message.mentions.roles.first().id
            }
            catch (err) {
                return message.reply('Tag een user of een role!')
            }
        }

        var winkelName = args.splice(2, args.length).join(" ")
        const result = await schema.findOne({ serverId: message.guild.id, name: winkelName })
        if (!result) return message.reply("Winkel niet gevonden!")

        if(message.guild.members.cache.get(tagged)) {
        if (args[0] === "add") {
            await medwSchema.findOneAndUpdate(
                { serverId: message.guild.id, userId: message.author.id },
                { serverId: message.guild.id, userId: message.author.id, $push: { winkels: winkelName } },
                { upsert: true }
            )
        }
        if (args[0] === "remove") {
            await medwSchema.findOneAndUpdate(
                { serverId: message.guild.id, userId: message.author.id },
                { serverId: message.guild.id, userId: message.author.id, $pull: { winkels: winkelName } },
                { upsert: true }
            )
        }
    }
    else {
        if (args[0] === "add") {
            await schema.findOneAndUpdate(
                {
                    serverId: message.guild.id,
                    name: winkelName
                },
                {
                    serverId: message.guild.id,
                    name: winkelName,
                    $push: {
                        roles: tagged
                    }
                },
                {
                    upsert: true
                }
            )
        }
        if (args[0] === "remove") {
            await schema.findOneAndUpdate(
                {
                    serverId: message.guild.id,
                    name: winkelName
                },
                {
                    serverId: message.guild.id,
                    name: winkelName,
                    $pull: {
                        roles: tagged
                    }
                },
                {
                    upsert: true
                }
            )
        }
    }

    message.channel.send('Medewerker succesvol toegevoegd!')
	},
};