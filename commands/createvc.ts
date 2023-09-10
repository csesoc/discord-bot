// @ts-check
import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, CategoryChannel } from "discord.js";
import fs from "fs";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("createvc")
        .setDescription("Create a temporary voice channel"),

    /**
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            // Limit on concurrent temporary channels
            const CHANNEL_LIMIT = 10;
            // Name of the category under which the temporary channels are
            const CATEGORY_NAME = "TEMPORARY VCS";

            interface VCData {
                users: { authorid: string; count: number; }[];
                channels: { channel_id: string; delete: boolean; }[];
            }

            const data: VCData = JSON.parse(fs.readFileSync("./data/createvc.json", "utf8"));
            // console.log(data);
            // const authorid = interaction.user.id;

            const size = data.channels.length;
            // console.log(size);
            if (size < CHANNEL_LIMIT) {
                // let temp = {"authorid":authorid,"count":1};
                // data.users.unshift(temp);
                if (!interaction.guild) return;
                const channelmanager = interaction.guild.channels;
                /** @type {CategoryChannel | null} */
                let parentChannel: CategoryChannel | null = null;
                const allchannels = await channelmanager.fetch();

                // See if there is a category channel with name - TEMPORARY VCs
                // If not, it creates a new category with name CATEGORY_NAME
                try {
                    allchannels.forEach((item) => {
                        if (
                            item != null &&
                            item.type == ChannelType.GuildCategory &&
                            item.name == CATEGORY_NAME
                        ) {
                            parentChannel = item;
                        }
                    });
                } catch (error) {
                    await interaction.reply("Something is wrong!");
                }

                if (parentChannel == null) {
                    parentChannel = await channelmanager.create({
                        name: CATEGORY_NAME,
                        type: ChannelType.GuildCategory,
                    });
                    // parentChannel = await channelmanager.create(CATEGORY_NAME, {
                    //     type: 4,
                    // });
                }

                // Create a new channel and then add it to the limit

                const tempchannel = await channelmanager.create({
                    name: "Temp VC",
                    type: ChannelType.GuildVoice,
                    parent: parentChannel
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