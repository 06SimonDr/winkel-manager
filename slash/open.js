const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const schema = require("../models/winkels");
const medwSchema = require("../models/werknemers");

module.exports = {
  name: "open",
  description: "Open een winkel",
  args: [
    {
      name: "winkel",
      type: "STRING",
      description: "De winkel die je wilt openen",
      required: true,
    },
  ],
  async execute(client, interaction) {
      const winkelName = interaction.options.get("winkel").value
      console.log(winkelName)

    const result = await schema.findOne({
      serverId: interaction.guild.id,
      name: winkelName,
    });
    const result2 = await medwSchema.findOne({
      serverId: interaction.guild.id,
      userId: interaction.user.id,
    });
    if (result2)
      if (!result2.activeWinkel === null)
        return interaction.reply(
          `Meld je eerst af bij ${result2.activeWinkel}, voor je een nieuwe winkel opent!`
        );
    if (!result2 || !result2.winkels.includes(winkelName)) {
      if (!result) return interaction.reply("Winkel niet gevonden!");
      result.roles.forEach((role) => {
        if (interaction.member.roles.cache.has(role)) perms = true;
      });
    } else perms = true;

    if (perms === true) {
      await medwSchema.findOneAndUpdate(
        { serverId: interaction.guild.id, userId: interaction.user.id },
        {
          serverId: interaction.guild.id,
          userId: interaction.user.id,
          date: interaction.createdTimestamp,
          activeWinkel: winkelName,
          $push: { winkels: winkelName },
        },
        { upsert: true }
      );

      await schema.findOneAndUpdate(
        { serverId: interaction.guild.id, name: winkelName },
        { serverId: interaction.guild.id, name: winkelName, $inc: { active: 1 } },
        { upsert: true }
      );

      var embed = new MessageEmbed()
        .setTitle(`Je bent nu aanwezig bij ${winkelName}!`)
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply("Je werkt niet bij deze winkel!");
    }
  },
};
