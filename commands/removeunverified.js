module.exports = {
    data: new SlashCommandBuilder()
        .setName("removeunverified")
        .setDescription("[ADMIN] Removes all members with the unverified role."),
    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

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
        } catch (error) {
            await interaction.reply("Error: " + error);
        }
    },
};
