const discord = require('discord.js');
const winkelEmbedSchema = require('../models/winkel-embed')
const winkelSchema = require('../models/winkels')

module.exports = {
	name: 'ready',
	async execute(client) {
		setInterval(async function() {
            const results = await winkelEmbedSchema.find()
            for (var result of results) {
                var guild = client.guilds.cache.get(result.serverId)
                if (!guild) {
                    await winkelSchema.deleteOne({ serverId: result.serverId })
                    await winkelEmbedSchema.deleteOne({ serverId: result.serverId })
                }
                var channel = guild.channels.cache.get(result.channelId)
                if (!channel) return
                var message = channel.messages.fetch(result.messageId)

                const winkels = winkelSchema.find({ serverId: result.serverId })
                var embed = new discord.MessageEmbed()
                if(result.title) embed.setTitle(result.title)
                else embed.setTitle('Open winkels')
                if(result.description) embed.setDescription(result.description)
                if(result.image) embed.setImage(result.image)
                if(result.footer) embed.setFooter(result.footer)
                if(result.color) embed.setColor(result.color)

                for (const winkel of winkels) {
                    embed.addField(`${winkel.name} (${winkel.stad})`, `${winkel.description}\nLocatie: ${winkel.location}`)
                }
                if (!message) {
                    channel.send(embed).then(msg => {
                        result.messageId = msg.id
                        await result.save().catch((err) => {console.log(err)});
                    })
                }
                message.edit(embed)
            }
        }, 10000)
	},
};