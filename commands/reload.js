const fs = require('fs')
var counter = 0

module.exports = {
	name: 'reload',
	description: 'Reload een command, bot owner only!',
	ownerOnly: true,
	async execute(client, message, args, prefix) {
		if (args[0] === '--all') {
			var reloadMessage = await message.channel.send('Alle commands worden gereload...')
			client.commands.forEach(async command => {
				delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
	        const newCommand = require(`./${command.name}.js`);
	        message.client.commands.set(newCommand.name, newCommand);
			++counter
        } catch (error) {
	        console.error(error);
	        message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }
			});
			reloadMessage.edit(`${counter} commands gereload!`)
		} else {
		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			return message.channel.send(`Er is geen command met de naam \`${commandName}\`, ${message.author}!`);
		}
        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
	        const newCommand = require(`./${command.name}.js`);
	        message.client.commands.set(newCommand.name, newCommand);
	        message.channel.send(`Command \`${newCommand.name}\` is gereload!`);
        } catch (error) {
	        console.error(error);
	        message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }
	}
	},
};