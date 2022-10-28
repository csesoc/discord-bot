const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createvc")
        .setDescription("Create a temporary voice channel"),
    async execute(interaction) {
        try {
            // Limit on concurrent temporary channels
            const CHANNEL_LIMIT = 10;
            // Name of the category under which the temporary channels are
            const CATEGORY_NAME = "TEMPORARY VCS";

            const data = JSON.parse(fs.readFileSync("./data/createvc.json", "utf8"));
            // console.log(data);
            // const authorid = interaction.user.id;

            const size = data.channels.length;
            // console.log(size);
            if (size < CHANNEL_LIMIT) {
                // let temp = {"authorid":authorid,"count":1};
                // data.users.unshift(temp);

                const channelmanager = interaction.guild.channels;
                let parentChannel = null;
                const allchannels = await channelmanager.fetch();

                // See if there is a category channel with name - TEMPORARY VCs
                // If not, it creates a new category with name CATEGORY_NAME
                try {
                    allchannels.forEach((item) => {
                        if (
                            item != null &&
                            item.type == "GUILD_CATEGORY" &&
                            item.name == CATEGORY_NAME
                        ) {
                            parentChannel = item;
                        }
                    });
                } catch (error) {
                    await interaction.reply("Something is wrong!");
                }

                if (parentChannel == null) {
                    parentChannel = await channelmanager.create(CATEGORY_NAME, {
                        type: 4,
                    });
                }

                // Create a new channel and then add it to the limit

                const tempchannel = await channelmanager.create("Temp VC", {
                    type: 2,
                    parent: parentChannel,
                });
                const data_add = { channel_id: tempchannel.id, delete: false };
                data.channels.unshift(data_add);

                fs.writeFileSync(
                    "./data/createvc.json",
                    JSON.stringify({ users: data.users, channels: data.channels }, null, 4),
                );
                await interaction.reply("New temporary vc has been created");
            } else {
                await interaction.reply("Sorry, daily voice channel limit reached!");
            }
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
