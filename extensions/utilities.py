from discord.ext import commands

class utilities(commands.Cog):
    def __init__(self,bot):
        self.bot = bot


    @commands.command(brief = "Sends a message to a specified channel")
    @commands.has_permissions(administrator=True)
    async def sendmsg(self,ctx, channel_name, message_data = None):
        
        if message_data is None:
            await ctx.send("Command Syntax - [sendmsg] [#channel_name] \"String to be sent\" ")
            return

        try:
            channel_mentions = ctx.message.channel_mentions
            
            send_channel = channel_mentions[0]
            await send_channel.send(message_data)
        except:
            await ctx.send("Invalid channel")

def setup(bot):
    bot.add_cog(utilities(bot))