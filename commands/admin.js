const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField } = require("discord.js");

const COMMAND_KICKUNVERIFIED = "kickunverified";
const COMMAND_DROPUSERTABLE = "dropusertable";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Admin-only commands.")
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_KICKUNVERIFIED)
                .setDescription("Kicks all unverified users from the server."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName(COMMAND_DROPUSERTABLE)
                .setDescription("Deletes the user table and reliant tables."),
        ),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

            if (interaction.options.getSubcommand() === COMMAND_KICKUNVERIFIED) {
                const role = await interaction.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === "unverified",
                );

                // Make sure that the "unverified" role exists
                if (role === undefined) {
                    return await interaction.reply('Error: no "unverified" role exists.');
                }

                const kickMessage =
                    "You have been removed from the CSESoc Server as you have not verified via the instructions in #welcome.\
                    If you wish to rejoin, visit https://cseso.cc/discord";

                // Member list in the role is cached
                let numRemoved = 0;
                await role.members.each((member) => {
                    member.createDM().then((DMChannel) => {
                        // Send direct message to user being kicked
                        DMChannel.send(kickMessage).then(() => {
                            // Message sent, time to kick.
                            member
                                .kick(kickMessage)
                                .then(() => {
                                    ++numRemoved;
                                    console.log(numRemoved + " people removed.");
                                })
                                .catch((e) => {
                                    console.log(e);
                                });
                        });
                    });
                });
                return await interaction.reply("Removed unverified members.");
            } else if (interaction.options.getSubcommand() === COMMAND_DROPUSERTABLE) {
                const userDB = global.userDB;
                await userDB.deleteUsers();
                await userDB.create_table_users();

                return await interaction.reply("Deleted user table.");
            }

            return await interaction.reply("Error: unknown subcommand.");
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
