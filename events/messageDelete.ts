export const messageDelete = {
    name: "messageDelete",
    once: false,
    async execute(message: any): Promise<void> {
        // ignore messages sent from bot
        if (message.author.bot) {
            return;
        }
  
        const logDB = (global as any).logDB;
        logDB.message_delete(message.id);
    },
};
  