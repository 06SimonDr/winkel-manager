const schema = require('../models/custom-commands')
const GuildSettings = require("../models/settings");

module.exports = {
	name: 'message',
	async execute(message) {
        if (message.author.bot) return;
  var storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  if (!storedSettings) {
    const newSettings = new GuildSettings({
      gid: message.guild.id
    });
    await newSettings.save().catch(()=>{});
    storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  }
  if (!message.content.startsWith(storedSettings.prefix)) return;
  const prefix = storedSettings.prefix;
  const messageArray = message.content.split(" ");
  const command = messageArray[0];
  var args = messageArray.slice(1);
  if(message.client.commands.get(command.slice(prefix.length)) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command.slice(prefix.length)))) return

  const result = await schema.findOne({ serverId: message.guild.id, name: command.slice(prefix.length) })
  if (!result) return
  const { action, value } = result
  if (action === 'SEND') {
      message.channel.send(value)
  }
},
};