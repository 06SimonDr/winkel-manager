const { DiscordInteractions } = require("slash-commands");

module.exports = {
  name: "test",
  description: "Ping!",
  aliases: ["ping", "create"],
  minArgs: 0,
  usage: "<naam> <beschrijving> <actie> <waarde>",
  ownerOnly: true,
  async execute(client, message, args, prefix) {
    /*const interaction = new DiscordInteractions({
      applicationId: "637304257090945024",
      authToken: "NjM3MzA0MjU3MDkwOTQ1MDI0.XbMN1w.RVWvrY8q52gSZ0U2OCqlz0PdGXY",
      publicKey:
        "b5f0b23b2680a4a722be71f055b4f29a46f97c54e554009c02b3fb596c00cf8d",
    });*/

    const commands = await client.application?.commands
	commands.cache.forEach(async command => {
		client.application?.commands.delete(command.id)
		console.log(`Command ${command.name} is verwijderd!`)
	})

    /*commands.forEach(async (command) => {
      await interaction
        .deleteApplicationCommand(command.id)
        .then(console.log)
        .catch(console.error);
    });*/
  },
};
