const { SlashCommandBuilder } = require("@discordjs/builders");
const { Permissions } = require("discord.js");



// map of course aliases to their actual names
const course_aliases = {
  comp6841: "comp6441",
  comp9044: "comp2041",
  comp3891: "comp3231",
  comp9201: "comp3231",
  comp9101: "comp3121",
  comp9331: "comp3331",
  comp9415: "comp3421",
  comp9801: "comp3821",
  comp9102: "comp3131",
  comp9154: "comp3151",
  comp9164: "comp3161",
  comp9211: "comp3211",
  comp9222: "comp3221",
  comp9814: "comp3411",
  comp9511: "comp3511",
  comp9900: "comp3900",
  seng4920: "comp4920",
  comp9337: "comp4337",
  math1141: "math1131",
  math1241: "math1231",
};

const get_real_course_name = (course) => {
  if (course_aliases[course.toLowerCase()]) {
      return course_aliases[course.toLowerCase()];
  }
  return course.toLowerCase();
};




const is_valid_course = (course) => {
  const reg_comp_course = /^comp\d{4}$/;
  const reg_math_course = /^math\d{4}$/;
  const reg_binf_course = /^binf\d{4}$/;
  const reg_engg_course = /^engg\d{4}$/;
  const reg_seng_course = /^seng\d{4}$/;
  const reg_desn_course = /^desn\d{4}$/;

  return (
      reg_comp_course.test(course.toLowerCase()) ||
      reg_math_course.test(course.toLowerCase()) ||
      reg_binf_course.test(course.toLowerCase()) ||
      reg_engg_course.test(course.toLowerCase()) ||
      reg_seng_course.test(course.toLowerCase()) ||
      reg_desn_course.test(course.toLowerCase())
  );
};

function editChannels(interaction, channels, role) {
  channels.forEach(channel => {
    if (channel.type === "GUILD_TEXT" && channel.name.toLowerCase() === role.name.toLowerCase()) {
      // Remove all permissions from a role
      role.setPermissions(0n)
        .then(updated => console.log(`Updated permissions to ${updated.permissions.bitfield}`))
        .catch(console.error);
      // Set the permissions of the role
      // Add the member to the channel's permission overwrites
      channel.permissionOverwrites.create(role, {
        VIEW_CHANNEL: true,
        SEND_MESSAGES: true,
      });
      interaction.reply({
        content: `✅ | removed all permissions and set new permission overwrites for
                  ${interaction.channel.name} and ${role.name}.`,
        ephemeral: true,
      });
    }
  });
}

function editRoles(interaction, roles) {
  roles.forEach(role => {
    if (is_valid_course(role.name)) {
      const channels = interaction.guild.channels.fetch()
        .then(channels => (editChannels(interaction, channels, role), console.log(`There are ${channels.size} channels.`)))
        .catch(console.error);
    }
  });
}

module.exports = {
  data: new SlashCommandBuilder()
  .setName("rolespermoverride")
  .setDescription("Looks for matches between roles and course chats and attaches permissions."),
  async execute(interaction) {
    try {
      // for all roles with name == chat name involving 4 letter prefix comp, seng, engg or binf,
      // give the role the permission override to participate in the matching channel.
      const all_roles = interaction.guild.roles.fetch()
        .then(roles => (editRoles(interaction, roles), console.log(`There are ${roles.size} roles.`)))
        .catch(console.error);

    } catch (error) {
      await interaction.reply("Error: " + error);
    }
  },
};