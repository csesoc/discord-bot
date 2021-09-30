module.exports = {
    name: "messageReactionRemove",
    once: false,
    execute(messageReaction, user) {
        console.log("reaction remove to msg");
    },
};