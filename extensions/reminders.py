import discord
from discord.ext import commands, tasks
from datetime import datetime
import json

class reminders(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.send_messages.start()

    @commands.command()
    async def schedule_reminder(self, ctx, date, time, *contents):
        try:
            scheduled_time = datetime.strptime(date + " " + time, "%Y/%m/%d %H:%M")
            if contents:
                print(date, time, ctx.message.id)

                with open("data/reminders.json", 'r') as f:
                    reminders_list = json.load(f)

                reminders_list.append([date + " " + time, ctx.channel.id, ctx.message.id])

                with open("data/reminders.json", 'w') as f:
                    json.dump(reminders_list, f)
            else:
                raise ValueError
        except ValueError:
            await ctx.send("USAGE for schedule_reminder:\n\n$schedule_reminder YYYY/MM/DD HH:MM\nfollowed by the message contents on a new line.", delete_after=5)


    @tasks.loop(seconds=60)
    async def send_messages(self):
        time_now = datetime.now().replace(second=0, microsecond=0)
        with open("data/reminders.json", 'r') as f:
            to_send_list = json.load(f)
        for to_send in to_send_list:
            send_time = datetime.strptime(to_send[0], "%Y/%m/%d %H:%M")
            if send_time == time_now:
                original_channel = self.bot.get_channel(to_send[1])
                message = await original_channel.fetch_message(to_send[2])

                users = set()
                for reaction in message.reactions:
                    async for user in reaction.users():
                        users.add(user)

                content = message.content.split("\n")
                content = "\n".join(content[1:])
                e = discord.Embed(title="Reminder!", description=content, color=0xFF0000)
                for user in users:
                    await user.send(embed=e)
                    print("Done")

def setup(bot):
    bot.add_cog(reminders(bot))