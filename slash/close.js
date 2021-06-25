const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const schema = require("../models/winkels");
const medwSchema = require("../models/werknemers");
const timeSchema = require("../models/time")

module.exports = {
  name: "close",
  description: "Sluit een winkel",
  args: [
    {
      name: "winkel",
      type: "STRING",
      description: "De winkel die je wilt sluiten",
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
    if (result2) if (!result2.activeWinkel === winkelName) return message.reply(`Je hebt je niet aangemeld bij deze winkel, gelieve je eerst aan te melden met /open.`)
    if (!result2 || !result2.winkels.includes(winkelName)) {
      if (!result) return interaction.reply("Winkel niet gevonden!");
      result.roles.forEach((role) => {
        if (interaction.member.roles.cache.has(role)) perms = true;
      });
    } else perms = true;

    if (perms === true) {

        var startDate = result2.date;
            var endDate = interaction.createdTimestamp;
            var duration = endDate-startDate;
            var today = new Date();
            var tYear = today.getFullYear();  
            var tMonth = today.getMonth();  
            var tDate = today.getDate();  
            tMonth = doHandleMonth(tMonth + 1);  
            tDate = doHandleMonth(tDate);  
            var datum = tDate+"-"+tMonth+"-"+tYear; 

            await new timeSchema({
                serverId: interaction.guild.id,
                userId: interaction.user.id,
                name: winkelName,
                startDate: startDate,
                endDate: endDate,
                duration: duration,
                day: datum
            }).save().catch(()=>{});

      await medwSchema.findOneAndUpdate(
        { serverId: interaction.guild.id, userId: interaction.user.id },
        {
          serverId: interaction.guild.id,
          userId: interaction.user.id,
          date: interaction.createdTimestamp,
          activeWinkel: winkelName,
          $pull: { winkels: winkelName },
        },
        { upsert: true }
      );

      await schema.findOneAndUpdate(
        { serverId: interaction.guild.id, name: winkelName },
        { serverId: interaction.guild.id, name: winkelName, $inc: { active: -1 } },
        { upsert: true }
      );

      var embed = new MessageEmbed()
        .setTitle(`Je bent nu afwezig bij ${winkelName}!`)
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply("Je werkt niet bij deze winkel!");
    }
  },
};

function doHandleMonth(month){  
    var m = month;  
    if(month.toString().length == 1){  
       m = "0" + month;  
    }  
    return m;  
}