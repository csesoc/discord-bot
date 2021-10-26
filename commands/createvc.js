const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createvc")
        .setDescription("Create a temporary voice channel")
        ,
    async execute(interaction) {

        
            const data = JSON.parse(fs.readFileSync("./data/createvc.json", 'utf8'));
            // console.log(data);
            var authorid = interaction.user.id;

            var size = data.channels.length;
            // console.log(size);
            if(size < 50) {
                // var temp = {"authorid":authorid,"count":1};
                // data.users.unshift(temp);
                
                var channelmanager = interaction.guild.channels;
                var tempchannel = await channelmanager.create('Temp VC', {type:2});
                var data_add = {'channel_id' : tempchannel.id, 'delete':false};
                data.channels.unshift(data_add);

                fs.writeFileSync("./data/createvc.json", JSON.stringify({ users: data.users, channels:data.channels}, null, 4));
                await interaction.reply("New temporary vc has been created");

            }
            else {
                await interaction.reply("Sorry, daily voice channel limit reached!");
            }
        

    },
};