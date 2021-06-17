const discord = require('discord.js')
const schema = require('../models/winkels')

module.exports = {
	name: 'close',
	description: 'Sluit een winkel',
	mineArgs: 1,
	usage: '<Winkel>',
	ownerOnly: false,
	async execute(client, message, args, prefix) {

        var winkelName = args.splice(0, args.length).join(" ")

		const result = await schema.findOne({ serverId: message.guild.id, name: winkelName })
        if (!result) return message.reply("Winkel niet gevonden!")
        
        if (!result.medewerkers.includes(message.author.id)) {
            result.roles.forEach(async role => {
                if(message.member.roles.cache.has(role)) {
                    await schema.findOneAndUpdate(
                        {
                            serverId: message.guild.id,
                            name: winkelName
                        },
                        {
                            serverId: message.guild.id,
                            name: winkelName,
                            $push: {
                                medewerkers: {
                                    userId: message.author.id,
                                    date: "null",
                                    active: false
                                }
                            }
                        },
                        {
                            upsert: true
                        }
                    )
                    
                    await schema.findOneAndUpdate(
                        {
                            serverId: message.guild.id,
                            name: winkelName
                        },
                        {
                            serverId: message.guild.id,
                            name: winkelName,
                            $inc: {
                                active: -1
                            },
                            $: {
                                medewerkers: {
                                    userId: message.author.id,
                                    active: false
                                }
                            }
                        },
                        {
                            upsert: true
                        }
                    )
            
                    var embed = new discord.MessageEmbed()
                        .setTitle(`Je bent nu afwezig bij ${winkelName}!`)
            
                    message.channel.send(embed)
                }
            })
        }
	},
};