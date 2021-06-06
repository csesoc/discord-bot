## Example usage of DiscordScroll.py in a Cog:
```python
from discord.ext import commands
from lib.discordscroll.discordscroll import DiscordScrollHandler
import discord

class Example_Cog_Using_Scroll(commands.Cog):
    def __init__(self, client):
        self.client = client

        scroll_ttl = 60  # The time in seconds that a scroll will work
        self.scroll_handler = DiscordScrollHandler(scroll_ttl)

    # An example using strings for pages
    # Needs to pass in a title
    @commands.command()
    async def example_str_pages(self, ctx):
        title = "example_title"
        pages = [
            "example page 1",
            "example page 2\nwith\nnewlines"
        ]

        await self.scroll_handler.new(ctx, pages, title)

    # An example using pregenerated Embeds for pages
    # Don't pass in a title
    @commands.command()
    async def example_embed_pages(self, ctx):
        pages = [
            discord.Embed(title="page1", description="desc1"),
            discord.Embed(title="page1", description="desc2")
        ]

        await self.scroll_handler.new(ctx, pages)

    # Required to handle all reaction
    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)


def setup(client):
    client.add_cog(Example_Cog_Using_Scroll(client))
```
