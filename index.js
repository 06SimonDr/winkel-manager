console.log('===\nBot starting...\n===')

const Discord = require("discord.js");
const mongoose = require("mongoose");
const config = require("./config");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");
const fs = require('fs');
const winkelSchema = require('./models/winkels')

const client = new Discord.Client({
  ws: {
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
  }
});

const botOwner = "552132590044315668"
client.commands = new Discord.Collection();

mongoose.connect(config.mongodbUrl, {
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
client.config = config;

fs.readdir("./commands/", (err, files) => {

  if (err) console.log(err);

  files.forEach((f, i) => {

      var fileGet = require(`./commands/${f}`);
      client.commands.set(fileGet.name, fileGet);
  });
  console.log(`${files.length} commands geladen!`)
});

const eventFiles = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  console.log(`Event ${file} aan het laden`)
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

// We listen for client's ready event.
client.on("ready", async () => {
  console.log(`===\nBot ingelogd als ${client.user.username}\n===`)
  Dashboard(client);

  setInterval(async () => {
    var aantalWinkels = await winkelSchema.find().length
    const activities = [
      { name: `${aantalWinkels} winkels`, type: "LOOKING" },
      { name: "help", type: "LISTENING" },
      { name: "dashboard", type: "STREAMING", url: "https://winkelmanager.herokuapp.com" }
    ]
    const randomIndex = Math.floor(Math.random() * (activities.length - 1) + 1);
    client.user.setActivity(activities[randomIndex])
  }, 5000);
});

// We listen for message events.
client.on("message", async (message) => {
  if (message.author.bot) return;
  var storedSettings = await GuildSettings.findOne({ serverId: message.guild.id });
  if (!storedSettings) {
    const newSettings = new GuildSettings({
      serverId: message.guild.id
    });
    await newSettings.save().catch(()=>{});
    storedSettings = await GuildSettings.findOne({ serverId: message.guild.id });
  }
  if (!message.content.startsWith(storedSettings.prefix)) return;
  const prefix = storedSettings.prefix;
  const lower = message.content.toLowerCase()
  const messageArray = lower.split(" ")
  const command = messageArray[0];
  var commands = client.commands.get(command.slice(prefix.length)) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command.slice(prefix.length)));
  var args = messageArray.slice(1);
  if (!commands) return
  if (commands.ownerOnly) if (message.author.id !== botOwner) return;
  if (commands.permissions) {
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
      return message.reply('Je hebt de permissie `'+commands.permissions+"` nodig om dit command te kunnen uitvoeren!");
    }
  }
  if (commands.minArgs) {
    if (commands.minArgs > args.length) {
    var reply = `Je hebt te weinig argumenten opgegeven!`;
    if (commands.usage) {
      reply += `\nGebruik: \`${prefix}${commands.name} ${commands.usage}\``;
    }
    return message.channel.send(reply);
  }
}
if (command.maxArgs) {
    if (commands.maxArgs < args.length) {
    var reply = `Je hebt te veel argumenten opgegeven!`;
    if (commands.usage) {
      reply += `\nGebruik: \`${prefix}${commands.name} ${commands.usage}\``;
    }
    return message.channel.send(reply);
  }
}

  if (commands) {
	try {
		commands.execute(client, message, args, prefix);
	} catch (error) {
		console.error(error);
		message.reply('Er is een error opgetreden tijdens het uitvoeren van dit command.');
	}
}
});

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(config.token);