import asyncio
import random
import discord


class DiscordScrollHandler:
    def __init__(self, message_ttl):
        if not isinstance(message_ttl, int):
            wrong_type = message_ttl.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected int for message_ttl, but received {wrong_type} instead.")

        self._cached = []
        self._message_ttl = message_ttl

    async def _add_ttl(self, seconds, scroller):
        if not isinstance(seconds, int):
            wrong_type = seconds.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected int for seconds, but received {wrong_type} instead.")
        elif seconds < 30:
            raise TypeError(f"DiscordScrollHandler expected seconds to be larger than or equal to 30.")
        elif not isinstance(scroller, DiscordScroll):
            wrong_type = seconds.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected DiscordScroll for scroller, but received {wrong_type} instead.")

        # adds a time to live to a scroller
        await asyncio.sleep(seconds)
        await scroller.deactivate()
        self._cached.remove(scroller)

    async def new(self, ctx, title, pages):
        # creates a new scroller
        scroller = DiscordScroll(title, pages)
        # sends the scroller to the channel
        await scroller.send(ctx)
        # appends the scroller to the cached scrollers
        self._cached.append(scroller)
        # add the ttl to the scroller, so that itll turn off after abit
        asyncio.create_task(self._add_ttl(self._message_ttl, scroller))

        return scroller

    async def handle_reaction(self, reaction: discord.Reaction, user):
        # handles a reaction on a scroller
        if not isinstance(reaction, discord.Reaction):
            wrong_type = reaction.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected discord.Reaction for reaction, but received {wrong_type} instead.")
        elif not (isinstance(user, discord.Member) or isinstance(user, discord.Member)):
            wrong_type = user.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected discord.User for user, but received {wrong_type} instead.")

        if user.id != reaction.message.author.id:
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


class DiscordScroll:
    def __init__(self, title, pages):
        # creates the embed and the discord scroll
        self.title = title
        self.pages = pages
        self._pagenum = 0  # indexed from 0
        self._message = None
        self.embed = self.generate_embed()
        self._left = "⬅️"
        self._right = "➡️"
        self._delete = "❌"

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

        embed.color = discord.Color(int(hex(random.randint(1, 16581374)), 16))
        embed.title = self.title
        embed.description = "```\n" + self.current_page + "\n```"
        embed.set_footer(text=f"Page: {self._pagenum+1}")

        return embed

    async def send(self, ctx):
        # sends the scroller to the channel, and adds the reactions
        if not isinstance(ctx, discord.ext.commands.context.Context):
            wrong_type = ctx.__class__.__name__
            raise TypeError(f"DiscordScroll.send expected discord.ext.commands.context.Context but received {wrong_type} instead.")

        message = await ctx.send(embed=self.embed)

        await message.add_reaction(self._delete)
        await message.add_reaction(self._left)
        await message.add_reaction(self._right)

        self._message = message
        return message

    async def scroll(self, reaction):
        # scrolls the scroller, requires a reaction type
        if not isinstance(reaction, discord.Reaction):
            wrong_type = reaction.__class__.__name__
            raise TypeError(f"DiscordScroll.scroll expected discord.Reaction but received {wrong_type} instead.")

        if str(reaction) == self._left:
            # scroll left
            await self._previous_page()
        elif str(reaction) == self._right:
            # scroll right
            await self._next_page()
        elif str(reaction) == self._delete:
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

    async def deactivate(self):
        # removes the reactions, deactivating the scroller
        if self._message is not None:
            await self._message.clear_reactions()
