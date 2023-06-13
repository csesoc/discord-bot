const COURSE_CHATS_CHANNEL_ID: string = "860388285511630868";

export const messageCreate = {
    name: "messageCreate",
    async execute(message: any): Promise<void> {
        try {
            /* eslint-disable */
            if (message.content.includes("/role") && message.channelId === COURSE_CHATS_CHANNEL_ID) {
                const msg: string =
                    "❌ Role command entered incorrectly. Please see the above messages on how to correctly give or remove a role.";

                // Send error and then delete it shortly afterwards
                // Can't send ephemeral messages though...
                await message
                    .reply({ content: msg, ephemeral: true })
                    .then((msg: any) => {
                        setTimeout(() => msg.delete(), 5000);
                    })
                    .catch((e: any) => console.log("error: " + e));

                return message.delete();
            }
        } catch (e: any) {
            await message.reply("An error occurred: " + e);
        }
    },
};
