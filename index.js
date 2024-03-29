console.log('===\nBot starting...\n===')

const Discord = require("discord.js");
const mongoose = require("mongoose");
const config = require("./config.js");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");
const fs = require('fs');
const winkelSchema = require('./models/winkels')

const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER', 'GUILD_MEMBER']
});

const botOwner = "552132590044315668"
client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();

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

  fs.readdir("./slash/", (err, files) => {

    if (err) console.log(err);
  
    files.forEach(async (f, i) => {
  
        var fileGet = require(`./slash/${f}`);
        const data = {
          name: fileGet.name,
          description: fileGet.description,
          options: fileGet.args,
        }
        await client.application?.commands.create(data);
        client.slashCommands.set(fileGet.name, fileGet);
    });
    console.log(`${files.length} slash commands geladen!`)
  });

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
  const messageArray = message.content.split(" ")
  const command = messageArray[0].toLowerCase()
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

client.on('interaction', async interaction => {
	if (!interaction.isCommand()) return;

  var command = client.slashCommands.get(interaction.commandName);
  if (!command) return interaction.reply('Er is een error opgetreden tijdens het uitvoeren van dit command.')
  try {
		command.execute(client, interaction);
	} catch (error) {
		console.error(error);
		interaction.reply('Er is een error opgetreden tijdens het uitvoeren van dit command.');
	}
});

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(config.token);