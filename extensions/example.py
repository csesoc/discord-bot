import discord
from discord.ext import commands


class Example(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command()
    async def examplecommand(self, ctx):
        pass


def setup(bot):
    bot.add_cog(Example(bot))
