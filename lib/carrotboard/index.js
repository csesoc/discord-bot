//@ts-check

const { Client } = require("discord.js");
const { DBcarrotboard } = require("../database/dbcarrotboard")

class CarrotboardStorage {
    pin = "📌";
    maxMsgLen = 50;
    rowsPerPage = 5;
    config = new CarrotboardConfig();

    /** @protected @type {Client} */
    _client;
    
    /** @param {Client} client */
    constructor(client) {
        this.db = new DBcarrotboard();
        this._client = client;
    }

    async sendCBAlert(messageReaction, id, emoji) {
        // const boardChannel = await this._client.channels.fetch(this.config.alertChannelID);
    }

    async updateLeaderboard() {
        ;
    }
}

class CarrotboardEntryType {
    /** @readonly @type {Number} */
    carrot_id;
    /** @readonly @type {String} */
    emoji;
    /** @readonly @type {Number} */
    count;
    /** @readonly @type {Number} */
    user_id;
    /** @readonly @type {Number} */
    message_id;
    /** @readonly @type {Number} */
    channel_id;
    /** @readonly @type {String} */
    message_contents;
}

class CarrotboardConfig {
    /** @protected */
    _leaderboardID;
    /** @protected */
    _permaChannelID;
    /** @protected */
    _alertChannelID;
    /** @protected */
    _carrot;
    /** @protected */
    _minimum;
    /** @protected */
    _pinMinimum;

    constructor() {
        const {
            leaderboard_message_id, 
            leaderboard_channel_id,
            carrotboard_alert_channel_id,
            carrot_emoji,
            minimum_carrot_count,
            minimum_pin_count
        } = require("../../config/carrotboard.json");

        this.leaderboardID = leaderboard_message_id;
        this.permaChannelID = leaderboard_channel_id;
        this.alertChannelID = carrotboard_alert_channel_id;
        this.carrot = carrot_emoji;
        this.minimum = minimum_carrot_count;
        this.pinMinimum = minimum_pin_count;
    }


    set leaderboardID(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: leaderboard_message_id");
        }
        this._leaderboardID = value;
    }

    set permaChannelID(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: leaderboard_channel_id");
        }
        this._permaChannelID = value;
    }

    set alertChannelID(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: carrotboard_alert_channel_id");
        }
        this._alertChannelID = value;
    }

    set carrot(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: carrot_emoji");
        }
        this._carrot = value;
    }

    set minimum(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: minimum_carrot_count");
        }
        this._minimum = value;
    }

    set pinMinimum(value) {
        if (value == undefined) {
            throw new TypeError("Missing config option: minimum_pin_count");
        }
        this._pinMinimum = value;
    }

    get leaderboardID() { return this._leaderboardID }
    get permaChannelID() { return this._permaChannelID }
    get alertChannelID() { return this._alertChannelID }
    get carrot() { return this._carrot }
    get minimum() { return this._minimum }
    get pinMinimum() { return this._pinMinimum }
}

module.exports = {
    CarrotboardStorage,
    CarrotboardEntryType,
}