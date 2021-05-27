from lib.discordscroll.discordscroll import DiscordScrollHandler
from discord.ext import commands


class Dev_Scroll(commands.Cog):
    def __init__(self, client):
        self.client = client
        self.scroller = DiscordScrollHandler(60)

    @commands.command()
    async def test(self, ctx):
        await self.scroller.new(ctx, "myembed", ["blablabla", "lalalallala\nhello\nnewline"])

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroller.handle_reaction(reaction, user)


def setup(client):
    client.add_cog(Dev_Scroll(client))
