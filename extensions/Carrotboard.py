import discord
from discord.enums import MessageType
from discord.ext import commands
from discord import Embed
from datetime import datetime
from typing import TypedDict # remove this later
import random


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot
        self.board_channel_id = 860415733744795648
        self.bot_id = 831835566587772958  # remove this later
        self.storage = TempStorage()  # remove this later
        self.minimum = 2  # put this in config

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        # for reaction adding
        if payload.user_id != self.bot_id:
            # get the details
            emoji = payload.emoji.name
            message_id = payload.message_id
            channel_id = payload.channel_id
            user_id = payload.user_id

            # add it to storage
            self.storage.add(message_id, emoji, channel_id, user_id)

            print(self.storage.get(message_id, emoji))

            # check whether you need to send a new carrot alert
            if self.storage.get(message_id, emoji) >= self.minimum:
                await self.send_carrotboard_alert(payload)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        # for reaction removing
        if payload.user_id != self.bot_id:
            # get the details
            emoji = payload.emoji.name
            message_id = payload.message_id
            
            # subtract it from the storage
            self.storage.subtract(message_id, emoji)

    @commands.Cog.listener()
    async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
        # for reaction clearing, just delete the message_id storage
        message_id = payload.message_id
        self.storage.delete(message_id)

    async def send_carrotboard_alert(self, payload: discord.RawReactionActionEvent):
        board_channel = self.bot.get_channel(self.board_channel_id)

        message = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        embed = Embed(
            title=f"A new message has been Carrotted!",
            description=f"{message.content} \n [Click here to go to message]({message.jump_url})",
            colour=message.author.colour,
            timestamp=datetime.utcnow()
        )

        await board_channel.send(embed=embed)

    @commands.command()
    async def leaderboard(self, ctx):
        # Gets the carroted messages
        top_messages = self.storage.get_all('🥕')

        
        embed = Embed(
            title  = f'Top carroted messages',
            color = discord.Color(int(hex(random.randint(1, 16581374)), 16))
        )

        index = 1
        for entry in top_messages:
            print(entry)
            # entry = (message_id, count, ...)
            message_author = await self.bot.fetch_user(entry["user_id"])
            author = message_author.name
            message_channel = self.bot.get_channel(entry["channel_id"])
            message_content = await message_channel.fetch_message(entry["msg_id"])
            count = entry["count"]
            emoji = ":carrot:" # entry["emoji"]
            
            embed.add_field(
                name = f'{index}: {author}',
                value = f'{message_content.content} with {count} {emoji} \n [Click here to go to message]({message_content.jump_url})', 
                inline = False
            )

            index += 1

        await ctx.send(embed = embed)


def setup(bot):
    bot.add_cog(Carrotboard(bot))



# STUFF FOR STORAGE TO BE REMOVED LATER ONCE DATABASE
class carrotBoardEntry(TypedDict):
    cb_id: int
    emojis: dict # to be removed
    emoji: str
    count: int
    user_id: int
    msg_id: int
    channel_id: int 

class TempStorage():
    def __init__(self):
        self._data: dict[int, carrotBoardEntry] = {}
        self._next_id: int = 0

    def get(self, message_id: int, emoji: str):
        # get that message id's entry
        entry = self._data.get(message_id)
        if entry is not None and entry["emojis"].get(emoji) is not None:
            # if its already in the database subtract
            return entry["emojis"][emoji]
        else:
            # otherwise increment it
            return 0

    def get_all(self, emoji: str) -> [carrotBoardEntry]:
        # iterate through all entries and check if they have that emoji
        results = []
        for message_id in self._data:
            print(self._data[message_id])
            # get the entry
            count = self._data[message_id]["emojis"].get(emoji)
            if count is not None and count != 0:
                # if it was in for that message
                results.append({
                    "cb_id": 0,
                    "emoji": emoji,
                    "count": count,
                    "user_id": self._data[message_id]["user_id"],
                    "msg_id": message_id,
                    "channel_id": self._data[message_id]["channel_id"]
                })

        # results.sort(key=lambda x: x[1], reverse=True)
        return results

    # def new(self, message_id: int, emoji: str, user_id: int, channel_id: int):
    #     entry = self._data.get(

    def add(self, message_id: int, emoji: str, channel_id: int, user_id: int):
        # get that message id's entry
        entry = self._data.get(message_id)
        if entry is None: # FIX THIS
            self._data[message_id] = {
                "cb_id": 0,
                "emojis": {},
                "user_id": user_id,
                "msg_id": message_id,
                "channel_id": channel_id
            }

            entry = self._data[message_id]
        
        if entry["emojis"].get(emoji) is not None:
            # if its already in the database subtract
            entry["emojis"][emoji] += 1
        else:
            # otherwise increment it
            entry["emojis"][emoji] = 0

    def subtract(self, message_id: int, emoji: str):
        # get that message id's entry
        entry = self._data.get(message_id)
        if entry is not None:
            if entry["emojis"].get(emoji) is not None and entry["emojis"][emoji] > 0:
                # if its already in the database subtract
                entry["emojis"][emoji] -= 1
            else:
                # otherwise increment it
                entry["emojis"][emoji] = 0

    def delete(self, message_id):
        # delete the message_id's storage
        if self._data.get(message_id) is not None:
            del self._data[message_id]
