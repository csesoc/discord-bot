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
                console.log(e);
            }

            const version = data.find(runtime => runtime.language === language).version;
            // TODO: Error check runtime doesn't exist

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
                console.log(e);
            }

            message.reply(
                "Output:\n" +
                "```\n" +
                `${data.run.output}` +
                "```\n",
            );
        }
    },
};
