## Example usage of DiscordScroll.py in a Cog:
```python
from discord.ext import commands
from lib.discordscroll.discordscroll import DiscordScrollHandler

class Example_Cog_Using_Scroll(commands.Cog):
    def __init__(self, client):
        self.client = client

        scroll_ttl = 60  # The time in seconds that a scroll will work
        self.scroll_handler = DiscordScrollHandler(scroll_ttl)

    @commands.command()
    async def example_command(self, ctx):
        title = "example_title"
        pages = [
            "example page 1",
            "example page 2",
            "example page 3\nwith\nnewlines"
        ]

        await self.scroll_handler.new(ctx, title, pages)

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)


def setup(client):
    client.add_cog(Example_Cog_Using_Scroll(client))
```
