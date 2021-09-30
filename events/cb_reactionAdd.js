module.exports = {
    name: "messageReactionAdd",
    once: false,
    execute(messageReaction, user) {
        console.log("reaction added to msg");
    },
};