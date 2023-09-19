import { EmbedBuilder } from "discord.js";

export default {
    name: "messageReactionAdd",
    once: false,
    async execute(reaction:any, user:any) {
        if (user.bot) return;
        console.log(user);
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Something went wrong when fetching the message:", error);
                return;
            }
        }

        const messageId = reaction.message.id;
        const reactRoles = (global as any).reactRoles;
        const data = await reactRoles.get_roles(messageId, reaction.emoji.name);

        // Return if message id and emoji don't match anything in the database
        if (data.length == 0) return;

        const roleId = data[0].role_id;
        const senderId = await reactRoles.get_sender(messageId);
        console.log(senderId);
        console.log(user.id);

        // Check if emoji is ⛔ and if the user is the sender
        if (reaction.emoji.name === "⛔" && user.id !== senderId) return;

        // Check if message has ⛔ reacted by the sender
        // If not assign the role to the user
        const reactions = reaction.message.reactions;
        const noEntryReact = reactions.resolve("⛔");
        if (noEntryReact) {
            noEntryReact.users.fetch().then(async (userList:any) => {
                if (!userList.has(senderId)) {
                    reactions.resolve(reaction).users.remove(user);

                    const botName = await reaction.message.author.username;

                    // Notify user that role was not assigned
                    const notification = new EmbedBuilder()
                        .setColor("#7cd699")
                        .setTitle("Role could not be assigned")
                        .setAuthor({ name: botName, iconURL: "https://avatars.githubusercontent.com/u/164179?s=200&v=4" })
                        .setDescription(
                            `You can no longer react to the message in "${reaction.message.guild.name}" to get a role`,
                        );
                    user.send({
                        embeds: [notification],
                    });
                } else {
                    giveRole(reaction, user, roleId);
                }
            });
        } else {
            giveRole(reaction, user, roleId);
        }
    },
};
async function giveRole(reaction:any, user:any, roleId:any) {
    try {
        reaction.message.guild.members.cache.get(user.id).roles.add(roleId);
        const roleName = await reaction.message.guild.roles.cache.find(
            (r:any) => r.id === roleId
        ).name;
        const botName = await reaction.message.author.username;

        // Notify user role was successfully added
        const notification = new EmbedBuilder()
            .setColor("#7cd699")
            .setTitle("Roles updated!")
            .setAuthor({ name: botName, iconURL: "https://avatars.githubusercontent.com/u/164179?s=200&v=4" })
            .setDescription(`You reacted to a message in "${reaction.message.guild.name}" and were assigned the "${roleName}" role`);
        
        user.send({
            embeds: [notification],
        });

    } catch (err) {
        console.log(err);
    }
}
