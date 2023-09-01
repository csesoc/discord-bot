const {
    SlashCommandBuilder,
    InteractionResponse,
    EmbedBuilder,
    ChatInputCommandInteraction
} = require("discord.js");
const xkcd = require("xkcd-api");


/**
 * @typedef {Object} xkcdJSON
 * @property {string} month
 * @property {string} link
 * @property {string} year
 * @property {string} safe_title
 * @property {string} transcript
 * @property {string} alt
 * @property {string} img
 * @property {string} title
 * @property {string} day
 */

/**
 * @description helper function used to minimise repetitive code 
 * for xkcd commands
 * @async
 * @param {*} err error when requesting an xkcd comic
 * @param {xkcdJSON} res JSON object containing a successful response w/ comic
 * @param {ChatInputCommandInteraction} interaction
 * @returns {Promise<InteractionResponse<boolean>>}
 */
const xkcd_response = async (err, res, interaction) => {
    if (err) {
        console.log(err);
        interaction.reply({
            content: `sorry something went wrong!😔`,
            ephemeral: true,
        });
    } else {
        const embed = new EmbedBuilder()
            .setTitle(res.safe_title)
            .setImage(res.img);
        return await interaction.reply({ embeds: [embed] });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("xkcd")
        .setDescription("Replies with a new xkcd joke!")
        .addSubcommand((subcommand) =>
            subcommand.setName("latest").setDescription("Get the latest xkcd comic."),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("get")
                .setDescription("Get xkcd comic by its id.")
                .addIntegerOption((option) =>
                    option
                        .setName("comic-id")
                        .setRequired(true)
                        .setDescription("The number id of the xkcd comic you want to get"),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("random").setDescription("Get a random xkcd comic."),
        ),

    /**
     *
     * @async
     * @param {ChatInputCommandInteraction} interaction
     * @returns {Promise<InteractionResponse<boolean>>}
     */

    async execute(interaction) {
        switch (interaction.options.getSubcommand()) {
            case "latest":
                xkcd.latest(async (err, res) => xkcd_response(err, res, interaction));
                break;
            case "get":
                /**
                 * @type {number}
                 */
                const comic_id = interaction.options.getInteger("comic-id");

                xkcd.get(
                    comic_id,
                    async (err, res) => xkcd_response(err, res, interaction)
                );
                break;
            case "random":
                xkcd.random(async (err, res) => xkcd_response(err, res, interaction));
                break;
            default:
                break;
        }
    },
};
