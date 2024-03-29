const discord = require('discord.js');
const winkelEmbedSchema = require('../models/winkel-embed')
const winkelSchema = require('../models/winkels')

module.exports = {
	name: 'ready',
	async execute(client) {
		setInterval(async function() {
            const results = await winkelEmbedSchema.find()
            for (var result of results) {
                var guild = await client.guilds.cache.get(result.serverId)
                if (!guild) {
                    await winkelSchema.deleteOne({ serverId: result.serverId })
                    await winkelEmbedSchema.deleteOne({ serverId: result.serverId })
                    return
                }
                var channel = await guild.channels.cache.get(result.channelId)
                if(!channel) return
                const winkels = await winkelSchema.find({ serverId: result.serverId })
                var embed = new discord.MessageEmbed()
                if(result.title) embed.setTitle(result.title)
                else embed.setTitle('Open winkels')
                if(result.description) embed.setDescription(result.description)
                if(result.image) embed.setThumbnail(result.image)
                if(result.footer) embed.setFooter(result.footer)
                if(result.color) embed.setColor(result.color)
                embed.setTimestamp()
                var message = await channel.messages.fetch(result.messageId).catch((err) => { channel.send({ embeds: [embed] }) })

                for (const winkel of winkels) {
                    if (winkel.active > 0) {
                        embed.addField(`${winkel.name} (${winkel.stad})`, `✅ - Geopend\n${winkel.description}\n**Locatie:** ${winkel.location}`, true)
                    }
                    else {
                        embed.addField(`${winkel.name} (${winkel.stad})`, `❌ - Gesloten\n${winkel.description}\n**Locatie:** ${winkel.location}`, true)
                    }
                }
                try {
                    await message.edit({ embeds: [embed] })
                } catch(err) {
                    channel.send({ embeds: [embed] }).then(async msg => {
                        result.messageId = msg.id
                        await result.save().catch((err) => {console.log(err)});
                    })
                }
            }
        }, 20000)
	},
};