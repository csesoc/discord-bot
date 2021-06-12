import asyncio
import random
import discord


class DiscordScrollHandler:
    """A handler class for the Discord Scroll instances.

    Parameters
    ----------
    message_ttl: `int`
        The time, in seconds, until new Scrolls are deactivated.

    Raises
    ------
    TypeError
        Raised if ``message_ttl`` is an invalid type.

    Notes
    -----
    This class depends on the DiscordScroll class to be present.
    """

    def __init__(self, message_ttl):
        if not isinstance(message_ttl, int):
            wrong_type = message_ttl.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected int for message_ttl, but received {wrong_type} instead.")

        # _cached has the structure {message_id (`int`): {"scroll": DiscordScroll, "ttl_task": Task}}
        self._cached = {}
        self._message_ttl = message_ttl

    async def new(self, ctx, pages, title=None):
        """Creates a new DiscordScroll instance to be handled.

        Parameters
        ----------
        ctx: `discord.ext.commands.context.Context`
            The context of the command to create the scroll.
        pages: `List[str]` or `List[discord.Embed]`
            A list str OR list of prepared embeds, each signifying a page.
            If `List[discord.Embed]`, ``title`` cannot be present.
        title: `str`, optional
            The title of the Scroll. Needed if ``pages`` is `List[str]`.

        Returns
        -------
        scroller: `DiscordScroll`
            The scroller which was created.

        Raises
        ------
        TypeError
            Raised by `DiscordScroll` if any of the parameters are invalid types.
        """
        scroller = DiscordScroll(pages, title)
        await scroller.send(ctx)

        # add the ttl to the scroller, and cache the scroller
        ttl_task = asyncio.create_task(self._add_ttl(self._message_ttl, scroller))
        self._cached[scroller.message_id] = {"scroll": scroller, "ttl_task": ttl_task}

        return scroller

    async def handle_reaction(self, reaction, user):
        """Handles any reaction, and updates the appropriate Scroller.

        Parameters
        ----------
        reaction: `discord.Reaction`
            The reaction object, usually given by the listener.
        user: ` discord.Member` or `discord.Member`
            The user who reacted, usually given by the listener.

        Raises
        ------
        TypeError
            Raised if ``reaction`` or ``user`` are invalid types.

        Notes
        -----
        This is meant to be given the raw reaction and user, and will do all the processing.
        """
        if not isinstance(reaction, discord.Reaction):
            wrong_type = reaction.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected discord.Reaction for reaction, but received {wrong_type} instead.")
        elif not (isinstance(user, discord.Member) or isinstance(user, discord.Member)):
            wrong_type = user.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected discord.User for user, but received {wrong_type} instead.")

        if user.id != reaction.message.author.id:
            # checks if the reaction isnt performed by the bot
            cached_scroller = self._cached.get(reaction.message.id)

            if cached_scroller is not None:
                # make sure a scroller was found
                await reaction.remove(user)  # in this order since removed msg
                scroller = cached_scroller["scroll"]
                await scroller.scroll(reaction)
                # remove the scroll from cached if reaction was delete
                if str(reaction) == scroller.emojis["delete"]:
                    await self._stop_handling(scroller.message_id)

    async def shutdown(self):
        """Stops handling all the cached messages, useful in graceful shutdowns.

        Raises
        ------
        discord.errors.NotFound
            Raised by DiscordScroll if the message no longer exists at time of deactivation.
        """
        for scroller_id in list(self._cached.keys()):
            # Goes through each of the current scrollers and stops handling them
            await self._stop_handling(scroller_id)

    async def _add_ttl(self, seconds, scroller):
        """(Private) Add a TTL to a DiscordScroll.

        Parameters
        ----------
        seconds: `int`
            The time, in seconds, for the ttl.
        scroller: `DiscordScroll`
            The DiscordScroll instance that is having the ttl added to it.

        Raises
        ------
        TypeError
            Raised if ``seconds`` or ``scroller`` are invalid types.
        """
        if not isinstance(seconds, int):
            wrong_type = seconds.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected int for seconds, but received {wrong_type} instead.")
        elif seconds < 30:
            raise TypeError(f"DiscordScrollHandler expected seconds to be larger than or equal to 30.")
        elif not isinstance(scroller, DiscordScroll):
            wrong_type = seconds.__class__.__name__
            raise TypeError(f"DiscordScrollHandler expected DiscordScroll for scroller, but received {wrong_type} instead.")

        await asyncio.sleep(seconds)

        self._cached.pop(scroller.message_id)
        await scroller.deactivate()

    async def _stop_handling(self, scroller_id):
        """Stops handling a specific DiscordScroll instance, will deactivate it.

        Parameters
        ----------
        scroller_id: `int`
            The message_id of the DiscordScroll instance that is being dropped.
        """
        cached_scroller = self._cached.get(scroller_id)

        if cached_scroller is not None:
            # make sure a scroller is cached, then dismantle it
            cached_scroller["ttl_task"].cancel()
            del cached_scroller["ttl_task"]
            scroller = cached_scroller["scroll"]
            self._cached.pop(scroller_id)
            await scroller.deactivate()


class DiscordScroll:
    """Represents the Scoller message.

    Parameters
    ----------
    pages: `List[str]` or `List[discord.Embed]`
        A list str OR list of prepared embeds, each signifying a page.
        If `List[discord.Embed]`, ``title`` cannot be present.
    title: `str`, optional
        The title of the Scroll. Needed if ``pages`` is `List[str]`.

    Raises
    ------
    TypeError
        Raised if ``title`` or ``pages`` are invalid types.
    AttributeError
        Raised if ``title`` is set when ``pages`` is of type `List[discord.Embed]`.

    Notes
    -----
    This class should be used in conjunction with DiscordScrollHandler.
    """

    def __init__(self, pages, title=None):
        # The default emojis
        self._left = "⬅️"
        self._right = "➡️"
        self._delete = "❌"

        self._pagenum = 0  # indexed from 0
        self._message = None
        self._active = False
        self._using_embeds = False  # whether or not current using embeds for pages

        self._title = None
        self.pages = pages
        if title is not None:  # checking first time setting
            self.title = title
        self.embed = self._generate_embed()

    @property
    def title(self):
        """The title of the Scroll (`str`)."""
        if self._using_embeds:
            raise AttributeError(f"DiscordScroll.title does not exist.")

        return self._title

    @title.setter
    def title(self, value):
        """Setter method for title, expects a `str`."""
        # Type Checking the value
        if not self._using_embeds:
            if not isinstance(value, str):
                wrong_type = value.__class__.__name__
                raise TypeError(f"DiscordScroll.title expected str but received {wrong_type} instead.")
            elif len(value) == 0:
                raise TypeError(f"DiscordScroll.title expected str with length of at least one.")
        else:
            raise AttributeError(f"DiscordScroll.title cannot be set when using embeds.")

        self._title = value

    @property
    def pages(self):
        """The Pages in the Scroll (`List[str]` or `List[discord.Embed])."""
        return self._pages

    @pages.setter
    def pages(self, value):
        """Setter method for pages, expects `List[str]` or `List[discord.Embed]."""
        if not isinstance(value, list):
            wrong_type = value.__class__.__name__
            raise TypeError(f"DiscordScroll.pages expected list but received {wrong_type} instead.")
        elif len(value) == 0:
            raise TypeError(f"DiscordScroll.pages expected at least one element in list.")

        # fixing the title, and updating self._using_embeds
        if all(isinstance(element, str) for element in value):
            # when user gives str for pages
            self._using_embeds = False
            if self._title is None:  # ensure there is a title for _generate_embed
                self.title = "Default Title"
        elif all(isinstance(element, discord.Embed) for element in value):
            # when user gives embeds for pages
            self._using_embeds = True
            self._title = None
        else:
            raise TypeError(f"DiscordScroll.pages expected list of str OR list of discord.Embed.")

        self._pages = value

    @property
    def embed(self):
        """The embed of the Scroll (`discord.Embed`)."""
        return self._embed

    @embed.setter
    def embed(self, value):
        """Setter method for embed, expects `discord.Embed`."""
        if not isinstance(value, discord.Embed):
            wrong_type = value.__class__.__name__
            raise TypeError(f"DiscordScroll.embed expected discord.Embed but received {wrong_type} instead.")

        self._embed = value

    @property
    def current_page(self):
        """The current page the scroll is on (`str` or `discord.Embed`, read-only)."""
        return self.pages[self._pagenum]

    @property
    def message_id(self):
        """The DiscordScroll's message_id (`int`, read-only)."""
        return self._message.id

    @property
    def emojis(self):
        """The DiscordScroll's set emojis (`dict[str, str]`, read-only)."""
        return {"next": self._left, "previous": self._right, "delete": self._delete}

    @property
    def using_embeds(self):
        """Whether the DiscordScroll is using premade embeds for pages (`bool`, read-only)."""
        return self._using_embeds

    async def send(self, ctx):
        """Send the message to the channel of the command called.

        Parameters
        ----------
        ctx: `discord.ext.commands.context.Context`
            The context of the command that was called to create the scroll.

        Returns
        -------
        message: `discord.Message`
            The message that contains the Scoller.

        Raises
        ------
        TypeError
            Raised if ``ctx`` is an invalid type.
        """
        if not isinstance(ctx, discord.ext.commands.context.Context):
            wrong_type = ctx.__class__.__name__
            raise TypeError(f"DiscordScroll.send expected discord.ext.commands.context.Context but received {wrong_type} instead.")

        message = await ctx.send(embed=self.embed)

        await message.add_reaction(self._delete)
        await message.add_reaction(self._left)
        await message.add_reaction(self._right)

        self._active = True
        self._message = message
        return message

    async def scroll(self, reaction):
        """Handles the reaction added to the Scroll.

        Parameters
        ----------
        reaction: `discord.Reaction`
            The reaction added to the Scroll.

        Raises
        ------
        TypeError
            Raised if ``reaction`` is an invalid type.

        Notes
        -----
        Assumes the reaction belongs to this Scroller. Handles everything after that.
        """
        if not isinstance(reaction, discord.Reaction):
            wrong_type = reaction.__class__.__name__
            raise TypeError(f"DiscordScroll.scroll expected discord.Reaction but received {wrong_type} instead.")

        if self._active:
            if str(reaction) == self._left:
                # scroll left
                await self._previous_page()
            elif str(reaction) == self._right:
                # scroll right
                await self._next_page()
            elif str(reaction) == self._delete:
                # deletes the message
                await self._delete_message()

    async def deactivate(self):
        """Removes all the reactions of the embed, and deactivates it.

        Raises
        ------
        discord.errors.NotFound
            Raised if the message no longer exists at time of deactivation.
        """
        if self._message is not None and self._active:
            self._active = False
            await self._message.clear_reactions()

    def _generate_embed(self):
        """(Private) Generate the embed using the current known attributes.

        Returns
        -------
        embed: `discord.Embed`
            The embed page which was generated.
        """
        if not self._using_embeds:
            # generate a new page
            embed = discord.Embed()

            embed.color = discord.Color(int(hex(random.randint(1, 16581374)), 16))
            embed.title = self.title
            embed.description = "```\n" + self.current_page + "\n```"
            embed.set_footer(text=f"Page: {self._pagenum+1}")

            return embed
        else:
            # returning the pregenerated embed page
            return self.current_page

    async def _update(self):
        """(Private) Regenerates the embed, and edits the message to the new embed."""
        self.embed = self._generate_embed()
        await self._message.edit(embed=self.embed)

    async def _next_page(self):
        """(Private) Changes to the next page of the Scroll.
        Nothing happens if it is the last page.
        """
        if self._pagenum < len(self._pages) - 1 and self._active:
            self._pagenum += 1
            await self._update()

    async def _previous_page(self):
        """(Private) Changes to the previous page of the Scroll.
        Nothing happens if it is the first page.
        """
        if self._pagenum > 0 and self._active:
            self._pagenum -= 1
            await self._update()

    async def _delete_message(self):
        """(Private) Deletes the Scroller."""
        self._active = False
        await self._message.delete()
