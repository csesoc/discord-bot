import discord
from discord.ext import commands, tasks
from datetime import datetime
import json

class schedule_message(commands.Cog):
    def __init__(self, bot):
        self.bot = bot


    @commands.command()
    async def schedule_send(self, ctx, date, time, channel_id):
        if ctx.message.reference:
            message = await ctx.channel.fetch_message(ctx.message.reference.message_id)
            print(message.content)

            scheduled_time = date + " " + time        
        
            with open("data/scheduled_messages.json", 'r') as f:
                schedule_list = json.load(f)
            
            schedule_list.append([scheduled_time, channel_id, message.content])

            with open("data/scheduled_messages.json", 'w') as f:
                schedule_list = json.dump(schedule_list, f)

            await ctx.message.add_reaction("👍")


    @tasks.loop(seconds=60)
    async def send_messages(self):
        time_now = datetime.now().replace(second=0, microsecond=0)
        with open("data/scheduled_messages.json", 'r') as f:
            to_send_list = json.load(f)
            for todo in to_send_list:
                send_time = datetime.strptime(todo[0], "%Y/%m/%d %H:%M")
                if send_time == time_now:
                    channel = self.bot.get_channel(todo[1][1:])
                    await channel.send(todo[2])
                    print("message sent!")


    send_messages.start()

def setup(bot):
    bot.add_cog(schedule_message(bot))