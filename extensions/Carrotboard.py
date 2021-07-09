import discord
from discord.ext import commands
from discord import Embed
from datetime import datetime


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot
        self.board_channel_id = 860415733744795648
        self.bot_id = 831835566587772958  # remove this later
        self.storage = {}  # remove this later
        self.minimum = 2  # put this in config

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.user_id != self.bot_id:
            emoji = payload.emoji.name
            message_id = payload.message_id
            board_channel = self.bot.get_channel(self.board_channel_id)

            string = f"{emoji} react was added to {message_id}!"
            await board_channel.send(content=string)
            # add it to storage
            await self.storage_add(payload)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        board_channel = self.bot.get_channel(self.board_channel_id)
        emoji = payload.emoji.name
        message_id = payload.message_id

        string = f"{emoji} react was removed from {message_id}!"
        await board_channel.send(content=string)

    @commands.Cog.listener()
    async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
        board_channel = self.bot.get_channel(self.board_channel_id)
        message_id = payload.message_id

        string = f"{message_id} had it's reacts cleared!"
        await board_channel.send(content=string)

    async def send_carrotboard_new(self, payload: discord.RawReactionActionEvent):
        board_channel = self.bot.get_channel(self.board_channel_id)

        # ("Author", message.author.mention, False),
        # ("Content", message.content, False),
        # ("Carrots", carrots + 1, False))

        message = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        embed = Embed(
            title=f"A new message has been Carrotted!",
            description=message.content,
            colour=message.author.colour,
            timestamp=datetime.utcnow(),
        )

        await board_channel.send(embed=embed)

    async def storage_add(self, payload: discord.RawReactionActionEvent):
        # change this stuff out for the later real storage and multi emoji storage
        if self.storage.get(str(payload.message_id)) is None:
            # check whether its not already stored
            self.storage[str(payload.message_id)] = 1
        else:
            # else just increment it
            self.storage[str(payload.message_id)] += 1

        # print(self.storage[str(payload.message_id)])
        if self.storage[str(payload.message_id)] == self.minimum:
            # if its ready for the starboard alert
            await self.send_carrotboard_new(payload)

    async def storage_remove(self, payload: discord.RawReactionActionEvent):
        # change this stuff out for the later real storage and multi emoji storage
        if self.storage.get(str(payload.message_id)) is not None:
            # check whether its stored
            self.storage[str(payload.message_id)] -= 1

    async def storage_clear(self, payload: discord.RawReactionActionEvent):
        # change this stuff out for the later real storage and multi emoji storage
        if self.storage.get(str(payload.message_id)) is not None:
            # check whether its stored
            self.storage[str(payload.message_id)] = 0


def setup(bot):
    bot.add_cog(Carrotboard(bot))

# class TempStorage():
#     def __init__(self):
#         self._data: dict[int, carrotBoardEntry]

# class carrotBoardEntry(TypedDict):
#     cb_id: int
#     msg_id: int
#     emoji: str
#     count: int
