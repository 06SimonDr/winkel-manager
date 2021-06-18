const { MessageEmbed } = require('discord.js')

const settingSchema = require('../models/settings')
const timeSchema = require('../models/time')
const medwSchema = require('../models/werknemers')
const embedSchema = require('../models/winkel-embed')
const winkelSchema = require('../models/winkels')

const schemas = [settingSchema, timeSchema, medwSchema, embedSchema, winkelSchema]

module.exports = {
	name: 'guildDelete',
	async execute(guild) {
        schemas.forEach(async schema => {
            await schema.deleteMany({ serverId: guild.id })
        })

        var leaveEmbed = new MessageEmbed()
            .setTitle(`Server ${guild.name} geleaved!`)
            .setDescription(`${guild.memberCount} members\nGejoined op ${guild.joinedAt}`)
            .setTimestamp()

        guild.client.guilds.cache.get("648242808943280136").channels.cache.get("855495618599059496").send(leaveEmbed)
	}
};