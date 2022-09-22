const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "messageReactionRemove",
    once: false,
    async execute(reaction, user) {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Something went wrong when fetching the message:", error);
                return;
            }
        }

        const messageId = reaction.message.id;

        const reactRoles = global.reactRoles;

        const data = await reactRoles.get_roles(messageId, reaction.emoji.name);

        // Return if message id and emoji doesn't match anything in the database
        if (data.length == 0) return;

        const roleId = data[0].role_id;

        const senderId = await reactRoles.get_sender(messageId);

        // Check if message has ⛔ reacted by the sender and if the user already has the role
        // If so remove the role from the user
        const noEntryReact = reaction.message.reactions.resolve("⛔");
        if (noEntryReact) {
            try {
                noEntryReact.users.fetch().then(async (userList) => {
                    const hasRole = await reaction.message.guild.members.cache
                        .get(user.id)
                        ._roles.includes(roleId);
                    if (!userList.has(senderId) || hasRole) {
                        removeRole(reaction, user, roleId);
                    }
                });
            } catch (err) {
                console.log(err);
            }
        } else {
            removeRole(reaction, user, roleId);
        }
    },
};

async function removeRole(reaction, user, roleId) {
    try {
        reaction.message.guild.members.cache.get(user.id).roles.remove(roleId);
        const roleName = await reaction.message.guild.roles.cache.find((r) => r.id === roleId).name;
        const botName = await reaction.message.author.username;

        // Notify user role was successfully removed
        const notification = new MessageEmbed()
            .setColor("#7cd699")
            .setTitle("Roles updated!")
            .setAuthor(botName, "https://avatars.githubusercontent.com/u/164179?s=200&v=4")
            .setDescription(
                `You unreacted to a message in "${reaction.message.guild.name}" and was unassigned the "${roleName}" role`,
            );
        user.send({
            embeds: [notification],
        });
    } catch (err) {
        console.log(err);
    }
}
