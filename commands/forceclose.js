const discord = require('discord.js')
const schema = require('../models/winkels')
const medwSchema = require("../models/werknemers")

module.exports = {
	name: 'forceclose',
	description: 'Force close een winkel',
    aliases: ['fclose', 'fc', 'fsluit', 'forcesluit'],
	mineArgs: 1,
	usage: '<Winkel>',
    permissions: ["MANAGE_ROLES"],
	ownerOnly: false,
	async execute(client, message, args, prefix) {

        var winkelName = args.splice(0, args.length).join(" ")
        const result2 = await medwSchema.find({ serverId: message.guild.id, activeWinkel: winkelName })
        result2.forEach(async schema => {
            schema.activeWinkel = null
            await schema.save().catch((err) => {console.log(err)});
        })

        await schema.findOneAndUpdate(
            { serverId: message.guild.id, name: winkelName },
            { serverId: message.guild.id, name: winkelName, active: 0 },
            { upsert: true }
        )

        var embed = new discord.MessageEmbed()
            .setTitle(`${winkelName} is gesloten!`)

        message.channel.send(embed)
	},
};