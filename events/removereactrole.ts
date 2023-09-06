import { EmbedBuilder } from "discord.js";

export default {
    name: "messageReactionRemove",
    once: false,
    async execute(reaction: any, user: any): Promise<void> {
        if (user.bot) return;

        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error("Something went wrong when fetching the message:", error);
                return;
            }
        }

        const messageId: string = reaction.message.id;
        const reactRoles = (global as any).reactRoles;
        const data = await reactRoles.get_roles(messageId, reaction.emoji.name);

        // Return if message id and emoji don't match anything in the database
        if (data.length === 0) return;

        const roleId: string = data[0].role_id;
        const senderId: string = await reactRoles.get_sender(messageId);

        // Check if message has ⛔ reacted by the sender and if the user already has the role
        // If so, remove the role from the user
        const noEntryReact = reaction.message.reactions.resolve("⛔");
        if (noEntryReact) {
            try {
                noEntryReact.users.fetch().then(async (userList: any) => {
                    const hasRole: boolean = await reaction.message.guild.members.cache
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

async function removeRole(reaction: any, user: any, roleId: string): Promise<void> {
    try {
        reaction.message.guild.members.cache.get(user.id).roles.remove(roleId);
        const roleName = await reaction.message.guild.roles.cache.find((r: any) => r.id === roleId).name;
        const botName = await reaction.message.author.username;

        // Notify user role was successfully removed
        const notification = new EmbedBuilder()
            .setColor("#7cd699")
            .setTitle("Roles updated!")
            .setAuthor(botName)
            .setDescription(
                `You unreacted to a message in "${reaction.message.guild.name}" and were unassigned the "${roleName}" role`,
            );
        user.send({
            embeds: [notification],
        });
    } catch (err) {
        console.log(err);
    }
}
