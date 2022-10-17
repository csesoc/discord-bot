const { data } = require("../config/standup.json");
const fs = require("fs");

module.exports = {
    name: "messageUpdate",
    async execute(_oldMessage, message) {
        // console.log(message);
        if (message.author.bot == true) {
            return;
        }

        const logDB = global.logDB;
        logDB.message_update(_oldMessage.id, message.id, message.content);

        if (message.content.startsWith("$standup")) {
            const messages = String(message.content);
            const messageContent = messages.slice(8);
            // console.log(message.channel.parent.name)
            let teamName = message.channel.parent.name;

            const mentions = message.mentions.users;
            const mentionsArr = [...mentions.values()];

            // Contains the list of all users mentioned in the message
            const result = mentionsArr.map((a) => a.id);

            const voteauthorid = message.author.id;
            let voteauthorname = message.member.nickname;
            if (voteauthorname == null) {
                voteauthorname = message.author.username;
            }

            if (teamName in data) {
                let flag = 0;
                data[teamName].forEach(function (item) {
                    if (item["voteauthorid"] == voteauthorid) {
                        item["standup"] = messageContent;
                        item["mentions"] = result;
                        flag = 1;
                    }
                });
                if (flag == 0) {
                    data[teamName].push({
                        voteauthorid: voteauthorid,
                        voteauthorname: voteauthorname,
                        standup: messageContent,
                        mentions: result,
                    });
                }
            } else {
                data[teamName] = [
                    {
                        voteauthorid: voteauthorid,
                        voteauthorname: voteauthorname,
                        standup: messageContent,
                        mentions: result,
                    },
                ];
            }
            // console.log(data);

            // data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));
        }
    },
};
