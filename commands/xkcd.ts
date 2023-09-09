// @ts-check
import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import xkcd from "xkcd-api";


interface xkcdJSON {
    month: string;
    link: string;
    year: string;
    safe_title: string;
    transcript: string;
    alt: string;
    img: string;
    title: string;
    day: string;
}

/**
 * @description helper function used to minimise repetitive code 
 * for xkcd commands
 * @async
 * @param {*} err error when requesting an xkcd comic
 * @param {xkcdJSON} res JSON object containing a successful response w/ comic
 * @param {ChatInputCommandInteraction} interaction
 * @returns 
 */
const xkcd_response = async (err: any, res: xkcdJSON, interaction: ChatInputCommandInteraction) => {
    if (err) {
        console.log(err);
        await interaction.reply({
            content: `sorry something went wrong!😔`,
            ephemeral: true,
        });
    } else {
        const embed = new EmbedBuilder()
            .setTitle(res.safe_title)
            .setImage(res.img);
        await interaction.reply({ embeds: [embed] });
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
     * @returns
     */

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case "latest":
                xkcd.latest(async (/** @type {any} */ err: any, /** @type {xkcdJSON} */ res: xkcdJSON) => xkcd_response(err, res, interaction));
                break;
            case "get":
                /** @type {number} */
                const comic_id: number = interaction.options.getInteger("comic-id", true);

                xkcd.get(
                    comic_id,
                    async (/** @type {any} */ err: any, /** @type {xkcdJSON} */ res: xkcdJSON) => xkcd_response(err, res, interaction)
                );
                break;
            case "random":
                xkcd.random(async (/** @type {any} */ err: any, /** @type {xkcdJSON} */ res: xkcdJSON) => xkcd_response(err, res, interaction));
                break;
            default:
                break;
        }
    },
};
