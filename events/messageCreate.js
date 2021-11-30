const axios = require("axios");

module.exports = {
    name: "messageCreate",
    async execute(message) {
        // console.log(message);
        if (message.content.startsWith("!```")) {
            const rawContent = message.content.substring(4, message.content.length - 3);

            const newlineIndex = rawContent.indexOf("\n");

            const language = rawContent.substring(0, newlineIndex);

            const code = rawContent.substring(newlineIndex + 1);

            let data;
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
                // TODO: Support stdin and args
                // "stdin": "",
                // "args": [],
                });
                data = response.data;
            } catch (e) {
                return message.reply("Could not execute code.");
            }

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
