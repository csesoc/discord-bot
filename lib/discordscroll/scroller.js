const { EmbedBuilder, CommandInteraction, ButtonBuilder, ActionRowBuilder } = require("discord.js");

class DiscordScroll {
    /** @protected @type {Boolean} */
    _active = false;
    /** @protected @type {Boolean} */
    _used = false;

    /** @protected @type {?Message} */
    _message = null;
    /** @protected @type {?InteractionCollector<MessageComponentInteraction>} */
    _collector = null;
    /** @protected */
    _buttons = {
        left: new ButtonBuilder().setCustomId("scrollLeft").setEmoji("⬅️").setStyle("SECONDARY"),
        right: new ButtonBuilder().setCustomId("scrollRight").setEmoji("➡️").setStyle("SECONDARY"),
        delete: new ButtonBuilder().setCustomId("scrollDelete").setEmoji("🚮").setStyle("DANGER"),
    };

    /** @protected @type {?EmbedBuilder} */
    _embed = null;
    /** @protected @type {Number} */
    _pagenum = 0;
    /** @protected @type {EmbedBuilder[]} */
    _pages = [];

    /**
     * Constructor for the Scroller
     * @param {EmbedBuilder[]} pages
     */
    constructor(pages) {
        this.pages = pages;
        this._embed = this.currentPage;
    }

    /**
     * The pages of the Scroller.
     * @type {EmbedBuilder[]}
     */
    get pages() {
        return this._pages;
    }

    /**
     * @param {EmbedBuilder[]} value The array of Embeds
     */
    set pages(value) {
        // type check the array
        if (!(value instanceof Array)) {
            throw new TypeError("DiscordScroll.pages expected an array.");
        } else if (value.length == 0) {
            throw new TypeError("DiscordScroll.pages expected at least one element in the array.");
        } else if (!value.every((e) => e instanceof EmbedBuilder)) {
            throw new TypeError("DiscordScroll.pages expected an array of EmbedBuilders.");
        }

        this._pages = value;
    }

    /**
     * The current shown Embed.
     * @type {EmbedBuilder}
     * @readonly
     */
    get embed() {
        return this._embed;
    }

    /**
     * The current page.
     * @type {EmbedBuilder}
     * @readonly
     */
    get currentPage() {
        return this.pages[this._pagenum];
    }

    /**
     * The message id of the scroller
     * @type {String}
     * @readonly
     */
    get messageID() {
        return this._message.id;
    }

    /**
     * Sends the Scroller
     * @param {CommandInteraction} interaction The CommandInteraction
     * @returns {Promise<Message>}
     */
    async send(interaction) {
        // error checking
        if (this._used) {
            throw new Error("This Scroller has already been sent.");
        } else if (!(interaction instanceof CommandInteraction)) {
            throw new TypeError(
                "DiscordScroll.send expected a CommandInteraction for first parameter.",
            );
        }

        // send the reply
        /** @type {InteractionReplyOptions} */
        const replyOptions = {
            embeds: [this.embed],
            components: [this._getButtonRow],
            fetchReply: true,
        };
        /** @type {Message} */
        const replyMessage = await interaction.reply(replyOptions);
        this._active = true;
        this._used = true;
        this._message = replyMessage;

        this._setupCollector(replyMessage);
        return replyMessage;
    }

    /**
     * Disables the scroller, as if it has ended.
     */
    disable() {
        this._collector.stop();
    }

    /**
     * Gets the Button Row, updating the button status if needed.
     * @protected
     * @readonly
     * @returns {ActionRowBuilder}
     */
    get _getButtonRow() {
        if (this._pagenum === 0) {
            this._buttons.left.setDisabled(true);
        } else {
            this._buttons.left.setDisabled(false);
        }

        if (this._pagenum === this._pages.length - 1) {
            this._buttons.right.setDisabled(true);
        } else {
            this._buttons.right.setDisabled(false);
        }

        return new ActionRowBuilder().addComponents(
            this._buttons.left,
            this._buttons.right,
            this._buttons.delete,
        );
    }

    /**
     * Sets up the Button Collector
     * @param {Message} message The message to attach it to.
     */
    async _setupCollector(message) {
        const buttonCollector = message.createMessageComponentCollector({
            componentType: "BUTTON",
            time: 120000,
            idle: 30000,
            max: 1000,
        });

        this._collector = buttonCollector;

        buttonCollector.on("collect", (buttonInt) => {
            this._scroll(buttonInt);
        });

        buttonCollector.on("end", () => {
            this._deactivate();
        });
    }

    /**
     * Scrolls the scroller.
     * @param {MessageComponentInteraction} buttonInt The Button Interaction.
     * @protected
     */
    async _scroll(buttonInt) {
        if (buttonInt.customId === "scrollLeft" && this._pagenum > 0) {
            this._pagenum -= 1;
            await this._update(buttonInt);
        } else if (buttonInt.customId === "scrollRight" && this._pagenum < this.pages.length - 1) {
            this._pagenum += 1;
            await this._update(buttonInt);
        } else if (buttonInt.customId === "scrollDelete") {
            this._active = false;
            await this._message.delete();
        }
    }

    /**
     * Updates the scroller.
     * @param {MessageComponentInteraction} buttonInt The Button Interaction.
     * @protected
     */
    async _update(buttonInt) {
        this._embed = this.currentPage;
        await buttonInt.update({
            embeds: [this.embed],
            components: [this._getButtonRow],
        });
    }

    /**
     * Deactivates the scroller.
     * @protected
     */
    async _deactivate() {
        if (this._message != null && this._active) {
            this._active = false;
            await this._message.edit({ components: [] });
        }
    }
}

module.exports = {
    DiscordScroll,
};
