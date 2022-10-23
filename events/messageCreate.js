const fs = require("fs");

function messagelog(message) {
    // ignore messages sent from bot
    if (message.author.bot) {
        return;
    }

    const logDB = global.logDB;
    logDB.message_create(
        message.id,
        message.author.id,
        message.author.username,
        message.content,
        message.channelId,
    );
}

module.exports = {
    name: "messageCreate",
    async execute(message) {
        // console.log(message);
        let teamName = "";
        // console.log(message);
        messagelog(message);
        if (message.content.startsWith("$standup")) {
            let tempData;
            try {
                tempData = fs.readFileSync("./config/standup.json", "utf8");
            } catch (err) {
                console.error(err);
            }
            let data = JSON.parse(tempData)["data"];

            console.log(data);
            const messages = String(message.content);
            const messageContent = messages.slice(8);
            // console.log(message.channel.parent.name)
            teamName = message.channel.parent.name;
            const mentions = message.mentions.users;
            const mentionsArr = [...mentions.values()];

            // Contains the list of all users mentioned in the message
            const result = mentionsArr.map((a) => a.id);

            const voteauthorid = message.author.id;
            let voteauthorname = message.member.nickname;
            if (voteauthorname == null) {
                voteauthorname = message.author.username;
            }
            if (data == undefined) {
                data = {};
                data[teamName] = [
                    {
                        voteauthorid: voteauthorid,
                        voteauthorname: voteauthorname,
                        standup: messageContent,
                        mentions: result,
                    },
                ];
            }
            if (teamName in data) {
                let flag = 0;
                data[teamName].forEach((item) => {
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
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));
        }
    },
};
