/* eslint-disable */
// const { Embed } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { DBcarrotboard } = require("../database/dbcarrotboard");
import fs from "fs";
const YAML = require("yaml");

export class CarrotboardStorage {
    pin = "📌";
    maxMsgLen = 50;
    rowsPerPage = 5;

    /** @protected @type {Client} */
    _client;
    config: CarrotboardConfig;
    db: any;

    /** @param {Client} client */
    constructor(client: any) {
        this.config = new CarrotboardConfig();
        this.db = new DBcarrotboard();
        this._client = client;
    }

    /** Sends the carrotboard alert
     * @param {MessageReaction} messageReaction
     * @param {Number} CBID
     * @param {String} emoji
     */
    async sendCBAlert(messageReaction: any, CBID: any, emoji: any) {
        // get the alert channel and check it
        let alertChannel;
        try {
            alertChannel = await this._client.channels.fetch(this.config.alertChannelID);
        } catch {
            console.error("Carrotboard: sendCBAlert: Alert channel not found");
            console.error(this.config);
            return;
        }

        if (alertChannel.type != "GUILD_TEXT") {
            console.error("Carrotboard: sendCBAlert: Alert channel is not a Guild text channel.");
            return;
        }

        // get the message content
        const message = messageReaction.message;
        let messageContent = message.cleanContent;
        if (messageContent.length > this.maxMsgLen) {
            messageContent = messageContent.slice(0, this.maxMsgLen) + "...";
        }

        // create the embed
        /** @type {MessageEmbedOptions} */
        const embedOptions = {
            description: `**${messageContent}**`,
            color: message.member.displayHexColor,
            footer: { text: `ID: ${CBID}` },
            url: message.url,
            thumbnail: {
                url: "https://stories.freepiklabs.com/storage/15806/messages-rafiki-1343.png",
            },
        };

        // set title
        switch (emoji) {
            case this.pin:
                embedOptions.title = "Wow! A new community Pin! :pushpin: :tada:";
                break;
            case this.config.carrot:
                embedOptions.title = "A new message has been Carrotted! :partying_face: :tada:";
                break;
            default:
                embedOptions.title = `A new message has been ${emoji}-ed! :tada:`;
        }

        // send it
        const embed = new MessageEmbed(embedOptions);
        await alertChannel.send({ embeds: [embed] });
    }

    async updateLeaderboard() {
        // generate the leaderboard
        const embedPages = await this.generateLeaderboard({
            onlyFirstPage: true,
            emoji: this.config.carrot,
        });
        const embed = embedPages[0];

        // get the leaderboard channel
        let channel;
        try {
            channel = await this._client.channels.fetch(this.config.permaChannelID);
        } catch {
            return;
        }

        // get the msg
        /** @type {Message} */
        let message;
        try {
            message = await channel.messages.fetch(this.config.leaderboardID);
        } catch {
            return;
        }

        // update the leaderboard
        await message.edit({ embeds: [embed] });
    }

    /** @param {LeaderboardOptionsType} options */
    async generateLeaderboard({ onlyFirstPage = false, userID = null, emoji = null }) {
        // get the entries
        let entries = [];
        if (userID != null) {
            entries = await this.db.get_all_by_user(
                this.config.carrot,
                this.config.minimum,
                userID,
            );
        } else if (emoji != null) {
            entries = await this.db.get_all_by_emoji(emoji, this.config.minimum);
        } else {
            entries = await this.db.get_all(this.config.minimum);
        }
        entries.sort((a: any, b: any) => Number(b["count"]) - Number(a["count"]));

        // generate the leaderboard
        const embedPages = [];
        let entryIndex = 1;
        const userCache = new Map();
        for (const entry of entries) {
            // calculate the page number
            const pageNum = Math.floor((entryIndex - 1) / this.rowsPerPage);
            if (onlyFirstPage == true && pageNum > 0) {
                break;
            }

            // check if new page need to be made
            if ((entryIndex - 1) % this.rowsPerPage == 0) {
                const newPage = new MessageEmbed({
                    title: "Top carroted messages :trophy: :medal:",
                    color: 0xf1c40f,
                    timestamp: new Date().getTime(),
                    thumbnail: {
                        url: "https://stories.freepiklabs.com/storage/28019/winners-cuate-4442.png",
                    },
                });

                embedPages.push(newPage);
            }

            // get the user data
            if (!userCache.has(entry["user_id"])) {
                // fetch the user data
                let messageAuthor;
                try {
                    messageAuthor = await this._client.users.fetch(entry["user_id"]);
                } catch {
                    continue;
                }
                userCache.set(entry["user_id"], messageAuthor);
            }
            /** @type {User} */
            const messageAuthor = userCache.get(entry["user_id"]);

            // get the url
            const guildID = this.config.guildID;
            const channelID = entry["channel_id"];
            const messageID = entry["message_id"];
            const count = entry["count"];
            const emoji = entry["emoji"];
            const cbID = entry["carrot_id"];
            const url = `https://discord.com/channels/${guildID}/${channelID}/${messageID}`;

            // get the message contents
            let content = entry["message_contents"].trimEnd();
            if (content.length >= this.maxMsgLen) {
                content = content.slice(0, this.maxMsgLen) + "...";
            }

            // add the row to the embed
            embedPages[pageNum].addFields([
                {
                    name: `${entryIndex}: ${messageAuthor.username}`,
                    value: `[ID: ${cbID}](${url})\n` + "\u2800".repeat(6),
                    inline: true,
                },
                {
                    // 20 for full but messed up on thin display
                    name: "Message" + "\u2800".repeat(6),
                    value: `${content}\n\u200b`,
                    inline: true,
                },
                {
                    name: `Number of ${emoji}`,
                    value: `${count}\n\n\n\u200b`,
                    inline: true,
                },
            ]);

            entryIndex += 1;
        }

        // there werent any results, add the empty embed
        if (embedPages.length == 0) {
            const sadEmbed = new MessageEmbed({
                title: "There are no Carroted Messages :( :sob: :smiling_face_with_tear:",
                description: " ",
            });
            embedPages.push(sadEmbed);
        }

        return embedPages;
    }
}

class CarrotboardEntryType {
    /** @readonly @type {Number} */
    carrot_id;
    /** @readonly @type {String} */
    emoji;
    /** @readonly @type {String} */
    count;
    /** @readonly @type {String} */
    user_id;
    /** @readonly @type {String} */
    message_id;
    /** @readonly @type {String} */
    channel_id;
    /** @readonly @type {String} */
    message_contents;

    static keys = [
        "carrot_id",
        "emoji",
        "count",
        "user_id",
        "message_id",
        "channel_id",
        "message_contents",
    ];
}

/**
 * @typedef {Object} LeaderboardOptionsType
 * @property {Boolean} [onlyFirstPage]
 * @property {String} [userID]
 * @property {String} [emoji]
 */

class CarrotboardConfig {
    /** @protected @type {String} */
    _leaderboardID;
    /** @protected @type {String} */
    _permaChannelID;
    /** @protected @type {String} */
    _alertChannelID;
    /** @protected @type {String} */
    _guildID;
    /** @protected @type {String} */
    _carrot;
    /** @protected @type {Number} */
    _minimum;
    /** @protected @type {Number} */
    _pinMinimum;

    constructor() {
        // read the file
        const file = fs.readFileSync("./config/carrotboard.yaml", "utf8");
        const parsed = YAML.parse(file, { intAsBigInt: true });
        const expectedKeys = {
            leaderboard_message_id: "leaderboardID",
            leaderboard_channel_id: "permaChannelID",
            carrotboard_alert_channel_id: "alertChannelID",
            guild_id: "guildID",
            carrot_emoji: "carrot",
            minimum_carrot_count: "minimum",
            minimum_pin_count: "pinMinimum",
        };

        // check the config keys
        for (const key in expectedKeys) {
            const value = parsed[key];
            if (value == null) {
                throw new TypeError(`Carrotboard: Missing config option: ${key}`);
            }
            this[expectedKeys[key]] = value;
        }
    }

    saveToFile() {
        // convert into yaml
        const yamlStr = YAML.stringify({
            leaderboard_message_id: BigInt(this.leaderboardID),
            leaderboard_channel_id: BigInt(this.permaChannelID),
            carrotboard_alert_channel_id: BigInt(this.alertChannelID),
            guild_id: BigInt(this.guildID),
            carrot_emoji: String(this.carrot),
            minimum_carrot_count: Number(this.minimum),
            minimum_pin_count: Number(this.pinMinimum),
        });

        // write it to the file
        fs.writeFile("./config/carrotboard.yaml", yamlStr, function (err) {
            if (err) {
                console.error(err);
            }
        });
    }

    keys() {
        return [
            "leaderboardID",
            "permaChannelID",
            "alertChannelID",
            "guildID",
            "carrot",
            "minimum",
            "pinMinimum",
        ];
    }

    /** @param {String} value */
    set leaderboardID(value) {
        if (typeof value != "string" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: leaderboardID must be type String | BigInt");
        }
        this._leaderboardID = String(value);
    }

    /** @param {String} value */
    set permaChannelID(value) {
        if (typeof value != "string" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: permaChannelID must be type String | BigInt");
        }
        this._permaChannelID = String(value);
    }

    /** @param {String} value */
    set alertChannelID(value) {
        if (typeof value != "string" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: alertChannelID must be type String | BigInt");
        }
        this._alertChannelID = String(value);
    }

    /** @param {String} value */
    set guildID(value) {
        if (typeof value != "string" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: guildID must be type String | BigInt");
        }
        this._guildID = String(value);
    }

    /** @param {String} value */
    set carrot(value) {
        if (typeof value != "string") {
            throw new TypeError("Carrotboard: carrot must be type String");
        }
        this._carrot = String(value);
    }

    /** @param {Number} value */
    set minimum(value) {
        if (typeof value != "number" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: minimum must be type Number | BigInt");
        }
        this._minimum = Number(value);
    }

    /** @param {Number} value */
    set pinMinimum(value) {
        if (typeof value != "number" && typeof value != "bigint") {
            throw new TypeError("Carrotboard: pinMinimum must be type Number | BigInt");
        }
        this._pinMinimum = Number(value);
    }

    get leaderboardID() {
        return this._leaderboardID;
    }
    get permaChannelID() {
        return this._permaChannelID;
    }
    get alertChannelID() {
        return this._alertChannelID;
    }
    get guildID() {
        return this._guildID;
    }
    get carrot() {
        return this._carrot;
    }
    get minimum() {
        return this._minimum;
    }
    get pinMinimum() {
        return this._pinMinimum;
    }
}

/**
 * Returns the first emoji seen in the message, or null sometimes
 * @param {String} messageStr
 */
function extractOneEmoji(messageStr: String) {
    if (messageStr.length == 0) {
        return null;
    }

    // the emoji regexs
    const customEmojiRegex = /<a?:\w+:\d{18}>/;
    const normalEmojiRegex =
        /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/;
    // `normalEmojiRegex` yoinked from "https://medium.com/reactnative/emojis-in-javascript-f693d0eb79fb"

    // match the regexs
    const customMatch = messageStr.match(customEmojiRegex);
    const normalMatch = messageStr.match(normalEmojiRegex);
    if (customMatch != null && normalMatch != null) {
        // both occured, bad
        return null;
    }

    // get the winning match
    const match = customMatch ?? normalMatch;
    if (match == null) {
        // none occured, bad
        return null;
    }

    // only one occured, return index and emoji
    return { emoji: match[0], index: match.index };
}

module.exports = {
    CarrotboardStorage,
    CarrotboardEntryType,
    extractOneEmoji,
};
