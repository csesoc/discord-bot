import discord
from discord.ext import commands, tasks
from datetime import datetime
import json

class reminders(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.send_messages.start()

    @commands.command()
    async def schedule_reminder(self, ctx, date, time, *title):
        if ctx.message.reference and title:

            scheduled_time = date + " " + time
            title = " ".join(title)
            message_id = ctx.message.reference.message_id
            user = ctx.message.author

            await ctx.message.delete()
            react_message = await ctx.send(f'React to this message to receive a reminder about "{title}" at {scheduled_time}.\nThis reminder was created by {user}.')
            react_message_id = react_message.id

            with open("data/reminders.json", 'r') as f:
                reminders_list = json.load(f)

            reminders_list.append([scheduled_time, ctx.channel.id, message_id, title, react_message_id])

            with open("data/reminders.json", 'w') as f:
                reminders_list = json.dump(reminders_list, f)



    @tasks.loop(seconds=60)
    async def send_messages(self):
        time_now = datetime.now().replace(second=0, microsecond=0)
        with open("data/reminders.json", 'r') as f:
            to_send_list = json.load(f)
        for to_send in to_send_list:
            send_time = datetime.strptime(to_send[0], "%Y/%m/%d %H:%M")
            if send_time == time_now:
                original_channel = self.bot.get_channel(to_send[1])
                original_message = await original_channel.fetch_message(to_send[2])
                react_message = await original_channel.fetch_message(to_send[4])
                users = set()
                for reaction in react_message.reactions:
                    async for user in reaction.users():
                        users.add(user)
                for user in users:
                    await user.send("Here's a reminder that you've opted to receive: ")
                    await user.send(original_message.content)

def setup(bot):
    bot.add_cog(reminders(bot))