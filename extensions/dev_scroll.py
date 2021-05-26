import discord
from discord.client import Client
from discord.ext import commands


left = "⬅️"
right = "➡️"
delete = "❌"


class Dev_Scroll(commands.Cog):
    def __init__(self, client):
        self.client = client
        self.scroller = DiscordScrollHandler(831835566587772958)

    @commands.command()
    async def test(self, ctx):
        await self.scroller.new(ctx, "myembed", ["blablabla", "lalalallala"])

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroller.handle_reaction(reaction, user)


def setup(client):
    client.add_cog(Dev_Scroll(client))


class DiscordScroll:
    def __init__(self, title, pages):
        # creates the embed and the discord scroll
        self.title = title
        self.pages = pages
        self._pagenum = 0  # indexed from 0
        self._message = None
        self.embed = self.generate_embed()
        # TODO: Add a TTL

    @property
    def title(self):
        # The getter method for title
        return self._title

    @title.setter
    def title(self, value):
        # the setter method for title
        if not isinstance(value, str):
            wrong_type = value.__class__.__name__
            raise TypeError(f"DiscordScroll.title expected str but received {wrong_type} instead.")
        elif len(value) == 0:
            raise TypeError(f"DiscordScroll.title expected str with length of at least one")

        self._title = value

    @property
    def pages(self):
        # the getter method for content
        return self._pages

    @pages.setter
    def pages(self, value):
        # the setter method for pages
        if not isinstance(value, list):
            wrong_type = value.__class__.__name__
            raise TypeError(f"DiscordScroll.pages expected list but received {wrong_type} instead.")
        elif len(value) == 0:
            raise TypeError(f"DiscordScroll.pages expected at least one element in list.")
        elif not all(isinstance(element, str) for element in value):
            raise TypeError(f"DiscordScroll.pages expected list of str.")

        self._pages = value

    @property
    def current_page(self):
        # gets a string of the current page
        return self.pages[self._pagenum]

    @property
    def embed(self):
        # the getter method for embed
        return self._embed

    @embed.setter
    def embed(self, value):
        # the setter method for embed
        if not isinstance(value, discord.Embed):
            wrong_type = value.__class__.__name__
            raise TypeError(f"DiscordScroll.embed expected discord.Embed but received {wrong_type} instead.")

        self._embed = value

    @property
    def message_id(self):
        # the getter method for message id
        return self._message.id

    def generate_embed(self):
        # generates the embed based off the stored stuff
        embed = discord.Embed()

        embed.colour = discord.Colour(0xffffff)
        embed.title = self.title
        embed.description = "```" + self.current_page + "```"

        return embed

    async def send(self, ctx):
        # sends the scroller to the channel, and adds the reactions
        if not isinstance(ctx, discord.ext.commands.context.Context):
            wrong_type = ctx.__class__.__name__
            raise TypeError(f"DiscordScroll.send expected discord.ext.commands.context.Context but received {wrong_type} instead.")

        message = await ctx.send(embed=self.embed)

        await message.add_reaction(delete)
        await message.add_reaction(left)
        await message.add_reaction(right)

        self._message = message
        return message

    async def scroll(self, reaction):
        # scrolls the scroller, requires a reaction type
        if not isinstance(reaction, discord.Reaction):
            wrong_type = reaction.__class__.__name__
            raise TypeError(f"DiscordScroll.scroll expected discord.Reaction but received {wrong_type} instead.")

        if str(reaction) == left:
            # scroll left
            await self._previous_page()
        elif str(reaction) == right:
            # scroll right
            await self._next_page()
        elif str(reaction) == delete:
            # deletes the message
            await self._delete()

    async def _update(self):
        # updates the embed
        self.embed = self.generate_embed()
        await self._message.edit(embed=self.embed)

    async def _next_page(self):
        # changes to the next page
        if self._pagenum < len(self._pages) - 1:
            self._pagenum += 1
            await self._update()

    async def _previous_page(self):
        # changes to the previous page
        if self._pagenum > 0:
            self._pagenum -= 1
            await self._update()

    async def _delete(self):
        # deletes the message
        await self._message.delete()


class DiscordScrollHandler:
    def __init__(self, bot_id):
        if not isinstance(bot_id, int):
            wrong_type = bot_id.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected int for bot_id, but received {wrong_type} instead.")

        self._cached = []
        self._bot_id = bot_id

    async def new(self, ctx, title, pages):
        # creates a new scroller
        scroller = DiscordScroll(title, pages)
        # sends the scroller to the channel
        await scroller.send(ctx)
        # appends the scroller to the cached scrollers
        self._cached.append(scroller)
        return scroller

    async def handle_reaction(self, reaction, user):
        # handles a reaction on a scroller
        if user.id != self._bot_id:
            curr_scroller = None

            for cached in self._cached:
                # finding the cached scroller
                if cached.message_id == reaction.message.id:
                    curr_scroller = cached
                    break

            if curr_scroller is not None:
                # make sure a scroller was found
                await reaction.remove(user)
                await curr_scroller.scroll(reaction)
