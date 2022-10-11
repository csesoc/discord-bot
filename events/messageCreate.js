const fs = require("fs");
const axios = require("axios");

function messagelog(message) {
    // ignore messages sent from bot
    if (message.author.bot) {return;}

    // console.log(message);

    const logDB = global.logDB;
    logDB.message_create(message.id, message.author.id, message.author.username, message.content, message.channelId);
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
            // Get standup content
            const messages = String(message.content);
            const messageContent = messages.slice(8);
            // console.log(message.channel.parent.name)

            teamName = message.channel.parent.name;

            // Get the list of all users mentioned in the message
            const mentions = message.mentions.users;
            const mentionsArr = [...mentions.values()];
            const mentionedIds = mentionsArr.map(a => a.id);

            const voteauthorid = message.author.id;

            // Get author's nickname else username
            let voteauthorname = message.member.nickname;
            if (voteauthorname == null) {
                voteauthorname = message.author.username;
            }

            if (data == undefined) {
                data = {};
                data[teamName] = [{
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup":messageContent,
                    "mentions": mentionedIds,
                }];
            }
            // This team already exists
            if (teamName in data) {
                // flag is tripped if we are replacing a previous standup
                let flag = 0;
                data[teamName].forEach(function(item, index) {
                    if (item["voteauthorid"] == voteauthorid) {
                        item["standup"] = messageContent;
                        item["mentions"] = mentionedIds;
                        flag = 1;
                    }
                });
                if (flag == 0) {
                    data[teamName].push({
                        "voteauthorid": voteauthorid,
                        "voteauthorname": voteauthorname,
                        "standup": messageContent,
                        "mentions": mentionedIds,
                    });
                }
            } 
            // first standup ever in this team
            else {
                data[teamName] = [{
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup":messageContent,
                    "mentions": mentionedIds,
                }];
            }
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));
        }
        if (message.content.startsWith("/run")) {
            const newlineIndex = message.content.indexOf("\n");

            const language = message.content.substring(5, newlineIndex);

            // Message without the "/run language" part
            const rawContent = message.content.substring(newlineIndex + 1);

            const firstLine = rawContent.split("\n")[0];
            const args = firstLine.startsWith("args") ? firstLine.substring(5).split(" ") : [];

            const lastLine = rawContent.split("\n").slice(-1)[0];
            const stdin = lastLine.startsWith("stdin") ? lastLine.substring(6) : "";

            // Remove the first and last line from rawContent
            // Remove extra lines for args and stdin if needed
            const code = rawContent.split("\n").slice(args.length === 0 ? 1 : 2, stdin === "" ? -1 : -2).join("\n");

            let data = {};
            try {
                const response = await axios.get("https://emkc.org/api/v2/piston/runtimes");
                data = response.data;
            } catch (e) {
                return message.reply("Could not retrieve runtimes.");
            }

            const runtime = data.find(r => r.language === language);

            if (!runtime) {
                return message.reply("Language not found.");
            }

            const version = runtime.version;

            try {
                const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
                    "language": language,
                    "version": version,
                    "files": [
                        { "content": code },
                    ],
                    "args": args,
                    "stdin": stdin,
                });
                data = response.data;
            } catch (e) {
                return message.reply("Could not execute code.");
            }

            // Trim the output if it is too long
            const output = data.run.output.length > 1000 ? data.run.output.substring(0, 1000) + `\n...${data.run.output.length - 1000} more characters` : data.run.output;

            if (!output) {
                return message.reply("No output.");
            }

            message.reply(
                "Output:\n" +
                "```\n" +
                `${output}` +
                "```\n",
            );
        }
    },
};
