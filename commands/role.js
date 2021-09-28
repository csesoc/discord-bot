const fs = require("fs");
const { SlashCommandBuilder } = require("@discordjs/builders");
const paginationEmbed = require("discordjs-button-pagination");
const { MessageEmbed, MessageButton } = require("discord.js");
const { allowedRoles } = require("../config/role.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("Manages roles.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("give")
                .setDescription("Gives a role to the user.")
                .addRoleOption(option => option.setName("role").setDescription("Role to give").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Removes a role from the user.")
                .addRoleOption(option => option.setName("role").setDescription("Role to remove").setRequired(true)))
        // TODO: Make these commands admin only
        .addSubcommand(subcommand =>
            subcommand
                .setName("allow")
                .setDescription("Allows a role to be added.")
                .addRoleOption(option => option.setName("role").setDescription("Role to allow").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("disallow")
                .setDescription("Disallows a role to be added.")
                .addRoleOption(option => option.setName("role").setDescription("Role to disallow").setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("whitelist")
                .setDescription("Displays the list of allowed roles."))
        .addSubcommand(subcommand =>
            subcommand
                .setName("count")
                .setDescription("Displays the number of members with a role.")
                .addRoleOption(option => option.setName("role").setDescription("Role to count members").setRequired(true))),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === "give") {
            const role = await interaction.options.getRole("role");

            if (!allowedRoles.some(r => r.toLowerCase() === role.name.toLowerCase())) {
                return await interaction.reply({ content: `❌ | You are not allowed to give yourself the role \`${role.name}\`.`, ephemeral: true });
            } else if (interaction.member.roles.cache.some(r => r === role)) {
                return await interaction.reply({ content: `❌ | You already have the role \`${role.name}\`.`, ephemeral: true });
            }

            await interaction.member.roles.add(role);

            await interaction.reply({ content: `✅ | Gave you the role \`${role.name}\`.`, ephemeral: true });
        } else if (interaction.options.getSubcommand() === "remove") {
            const role = await interaction.options.getRole("role");

            if (!allowedRoles.some(r => r.toLowerCase() === role.name.toLowerCase())) {
                return await interaction.reply({ content: `❌ | You are not allowed to remove the role \`${role.name}\`.`, ephemeral: true });
            } else if (!interaction.member.roles.cache.some(r => r === role)) {
                return await interaction.reply({ content: `❌ | You do not have the role \`${role.name}\`.`, ephemeral: true });
            }

            await interaction.member.roles.remove(role);

            await interaction.reply({ content: `✅ | Removed the role \`${role.name}\`.`, ephemeral: true });
        } else if (interaction.options.getSubcommand() === "allow") {
            const role = await interaction.options.getRole("role");

            if (allowedRoles.some(r => r.toLowerCase() === role.name.toLowerCase())) {
                return await interaction.reply({ content: `❌ | The allowed roles list already contains \`${role.name}\`.`, ephemeral: true });
            }

            allowedRoles.push(role.name);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/role.json", JSON.stringify({ allowedRoles: allowedRoles }, null, 4));

            await interaction.reply(`✅ | Allowed the role \`${role.name}\`.`);
        } else if (interaction.options.getSubcommand() === "disallow") {
            const role = await interaction.options.getRole("role");

            if (!allowedRoles.some(r => r.toLowerCase() === role.name.toLowerCase())) {
                return await interaction.reply({ content: `❌ | The allowed roles list does not contain \`${role.name}\`.`, ephemeral: true });
            }

            allowedRoles.splice(allowedRoles.indexOf(role.name.toLowerCase()), 1);

            // The path here is different to the require because it's called from index.js (I think)
            fs.writeFileSync("./config/role.json", JSON.stringify({ allowedRoles: allowedRoles }, null, 4));

            await interaction.reply(`✅ | Disallowed the role \`${role.name}\`.`);
        } else if (interaction.options.getSubcommand() === "whitelist") {
            // TODO: Convert to scroller?
            const rolesPerPage = 10;

            const embedList = [];
            for (let i = 0; i < allowedRoles.length; i += rolesPerPage) {
                embedList.push(
                    new MessageEmbed()
                        .setTitle("Allowed Roles")
                        .setDescription(allowedRoles.slice(i, i + rolesPerPage).join("\n")),
                );
            }

            const buttonList = [
                new MessageButton()
                    .setCustomId("previousbtn")
                    .setLabel("Previous")
                    .setStyle("DANGER"),
                new MessageButton()
                    .setCustomId("nextbtn")
                    .setLabel("Next")
                    .setStyle("SUCCESS"),
            ];

            paginationEmbed(interaction, embedList, buttonList);
        } else if (interaction.options.getSubcommand() === "count") {
            const role = await interaction.options.getRole("role");

            interaction.reply(`There are ${role.members.size} members with the role \`${role.name}\`.`);
        }
    },
};
