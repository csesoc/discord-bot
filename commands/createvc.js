const { SlashCommandBuilder } = require("@discordjs/builders");
const data = require("../data/createvc.json");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createvc")
        .setDescription("Create a temporary voice channel")
        ,
    async execute(interaction) {
        const limit = 2
        var authorid = interaction.user.id;
        const found = data.users.find(element => element.authorid == authorid);

        if(found == undefined || found.count < limit) {
            var temp = {"authorid":authorid,"count":1};
            data.users.unshift(temp);
            
            var channelmanager = interaction.guild.channels;
            var tempchannel = await channelmanager.create('Temp VC', {type:2});

            data.channels.unshift(tempchannel.id);

            fs.writeFileSync("./data/createvc.json", JSON.stringify({ users: data.users, channels:data.channels}, null, 4));
            await interaction.reply("New temporary vc has been created");

        }
        else {
            await interaction.reply("Sorry, daily voice channel limit reached!");
        }

    },
};