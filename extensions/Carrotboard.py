import discord
from discord.ext import commands
from discord import Embed
from datetime import datetime
from typing import TypedDict, List  # remove this later
import random


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot
        self.board_channel_id = 860415733744795648
        self.bot_id = 831835566587772958  # remove this later
        self.storage = TempStorage()  # remove this later
        self.minimum = 1  # put this in config

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        # for reaction adding
        if payload.user_id != self.bot_id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
            user_id = payload.user_id

            # add it to storage
            self.storage.add_real(message_id, emoji, user_id, channel_id)

            # now get the entry and None check it
            cb_entry = self.storage.get_real(message_id, emoji)
            if cb_entry is None:
                print("wtf this shouldn't happen")
                return

            print("just added", cb_entry, emoji, str(payload.emoji), str(payload.emoji.name), str(payload.emoji.id))

            # check whether you need to send a new carrot alert, equal so it doesn't happen everytime
            if cb_entry["count"] == self.minimum:
                await self.send_carrotboard_alert(payload)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        # for reaction removing
        if payload.user_id != self.bot_id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id

            # subtract it from the storage
            self.storage.subtract_real(message_id, emoji)

    @commands.Cog.listener()
    async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
        # for reaction clearing, just delete the message_id storage
        message_id = payload.message_id
        self.storage.delete_real(message_id)

    async def send_carrotboard_alert(self, payload: discord.RawReactionActionEvent):
        board_channel = self.bot.get_channel(self.board_channel_id)

        message = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        embed = Embed(
            title=f"A new message has been Carrotted! :partying_face: :tada:",
            description=f"{message.content} \n [Click here to go to message]({message.jump_url})",
            colour=message.author.colour,
            timestamp=datetime.utcnow()
        )
        # ######### NEED TO CHECK THIS ###########
        # embed.set_thumbnail(url=payload.user_id.avatar_url) doesn't work just yet :(

        await board_channel.send(embed=embed)

        # ########## Pins the message: pin_message(message)

    @commands.command()
    async def carrotboard(self, ctx, cb_id_str=None):
        # prints out that carrotboard message
        if cb_id_str is None:
            # check if an id was given
            # here might go printing the entire carrotboard
            await ctx.send("Please include a valid carrotboard ID! <a:party_blob:867059602176213032>")
            return

        # try convert the string into an int
        try:
            cb_id = int(cb_id_str)
        except ValueError:
            # it wasn't given an id
            await ctx.send("Please include a valid carrotboard ID!")
            return

        # now get the carrotboard entry
        cb_entry = self.storage.get_by_cb_id(cb_id)
        if cb_entry is None:
            # the id doesn't exist
            await ctx.send("Please include a valid carrotboard ID!")
            return

        # now send the embed, JUST TEXT FOR NOW
        message_channel = self.bot.get_channel(cb_entry["channel_id"])
        message_content = await message_channel.fetch_message(cb_entry["msg_id"])
        await ctx.send(f"Insert Message Embed [Click here to go to message]({message_content.jump_url})'")

    @commands.command()
    async def leaderboard(self, ctx):
        # Gets the carroted messages
        carrot_emoji = str('🥕'.encode('unicode-escape').decode('ASCII'))
        # carrot_emoji = ":this:864812598485581884"
        top_messages = self.storage.get_all_real(carrot_emoji, self.minimum)

        # sends leaderboard embed
        embed = Embed(
            title=f'Top carroted messages :trophy: :medal:',
            color=discord.Color(int(hex(random.randint(1, 16581374)), 16)),
            timestamp=datetime.utcnow()
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
            emoji = str_to_chatable_emoji(entry["emoji"])

            embed.add_field(
                name=f'{index}: {author}',
                value=f'{message_content.content} with {count} {emoji} \n [Click here to go to message]({message_content.jump_url})',
                inline=True
            )
            embed.add_field(
                name=f'number of {emoji}',
                value={count},
                inline=True
            )
            index += 1

        # embed.set_thumbnail(url={emoji}) doesn't work just yet :(

        await ctx.send(embed=embed)


def setup(bot):
    bot.add_cog(Carrotboard(bot))


def partial_emoji_to_str(emoji: discord.PartialEmoji):
    # converts the emoji into its future database identifier
    # normal emojis will be emoji.name.encode('unicode-escape').decode('ASCII')
    # custom emojis will be :name:id
    if emoji.name is None:
        # casual None check
        return "uhm deleted"
    elif emoji.is_custom_emoji() and not emoji.animated:
        # is a custom emoji
        return f":{str(emoji.name)}:{str(emoji.id)}"
    elif emoji.is_custom_emoji() and emoji.animated:
        # is an animated emoji :o
        return f"a:{str(emoji.name)}:{str(emoji.id)}"
    elif emoji.is_unicode_emoji():
        # is a normal emoji
        emoji_unicode = emoji.name
        return str(emoji_unicode.encode('unicode-escape').decode('ASCII'))
    else:
        # should never be hit
        return "uhm something went wrong"


def str_to_chatable_emoji(emoji_str: str):
    # converts the emojistr from partial_emoji_to_str to an emoji you can send
    # will assume its valid
    str_array = emoji_str.split(":")
    if len(str_array) == 1:
        # assume its a normal emoji
        unicode_str = str_array[0]
        unicode = unicode_str.encode('ASCII').decode('unicode-escape')
        return str(unicode)
    elif len(str_array) == 3 and str_array[0] != 'a':
        # assume its a custom emoji
        name = str_array[1]
        id = str_array[2]
        return f"<:{name}:{id}>"
    elif len(str_array) == 3 and str_array[0] == 'a':
        # its an animated custom emoji
        name = str_array[1]
        id = str_array[2]
        return f"<a:{name}:{id}>"


# STUFF FOR STORAGE TO BE REMOVED LATER ONCE DATABASE

class carrotBoardEntry(TypedDict):
    cb_id: int
    emojis: dict  # to be removed
    emoji: str
    count: int
    user_id: int
    msg_id: int
    channel_id: int


class TempStorage():
    def __init__(self):
        self._data: dict[int, carrotBoardEntry] = {}
        self._data_real: dict[int, carrotBoardEntry] = {}
        self._next_id: int = 0

    def get_by_cb_id(self, cb_id: int):
        # gets the cb entry by cb id
        if cb_id is None:
            return None

        return self._data_real.get(cb_id)

    def get_real(self, message_id: int, emoji: str):
        # get that message id's entry
        cb_id = self._reaction_to_cb_id(message_id, emoji)
        if cb_id is not None:
            # if its in the database
            return self._data_real[cb_id]
        else:
            # otherwise increment it
            return None

    def get_all_real(self, emoji: str, count_min: int):
        # iterate through all entries and check if they have that emoji
        results: List[carrotBoardEntry] = []
        for cb_id in self._data_real:
            print(self._data_real[cb_id])
            # get the entry
            curr_emoji = self._data_real[cb_id].get("emoji")
            if curr_emoji == emoji:
                # found an entry, check the count
                if self._data_real[cb_id]["count"] >= count_min:
                    # found a valid entry, now append it
                    results.append(self._data_real[cb_id])

        results.sort(key=lambda x: x["count"], reverse=True)
        return results

    def add_real(self, message_id: int, emoji: str, user_id: int, channel_id: int):
        # check if its in the database
        cb_id = self._reaction_to_cb_id(message_id, emoji)
        if cb_id is not None:
            # found it, increase the count
            self._data_real[cb_id]["count"] += 1
            return

        # wasn't in the database, so create a new one
        self._data_real[self._next_id] = carrotBoardEntry(
            cb_id=self._next_id,
            emoji=emoji,
            count=1,
            user_id=user_id,
            msg_id=message_id,
            channel_id=channel_id,
        )

        # increment the next id
        self._next_id += 1

    def subtract_real(self, message_id: int, emoji: str):
        # check if its in the database
        cb_id = self._reaction_to_cb_id(message_id, emoji)
        if cb_id is not None:
            # it was found, decrease it
            if self._data_real[cb_id]["count"] > 0:
                self._data_real[cb_id]["count"] -= 1
            else:
                self._data_real[cb_id]["count"] = 0

    def delete_real(self, message_id):
        # delete the message_id
        deleting_ids = []
        # getting all the cb_ids for this message_id
        for cb_id in self._data_real:
            curr_message_id = self._data_real[cb_id].get("msg_id")
            if curr_message_id is not None and curr_message_id == message_id:
                # found it in the database, add it to the list
                deleting_ids.append(cb_id)

        # now delete them all
        for cb_id in deleting_ids:
            del self._data_real[cb_id]

    def _reaction_to_cb_id(self, message_id, emoji):
        if message_id is None or emoji is None:
            return None

        # find the cb_id of the message_id
        for cb_id in self._data_real:
            curr_message_id = self._data_real[cb_id].get("msg_id")
            curr_emoji = self._data_real[cb_id].get("emoji")
            if curr_message_id == message_id and curr_emoji == emoji:
                # found it in the database, return it
                return cb_id

        # wasnt found
        return None

    # def get(self, message_id: int, emoji: str):
    #     # get that message id's entry
    #     entry = self._data.get(message_id)
    #     if entry is not None and entry["emojis"].get(emoji) is not None:
    #         # if its already in the database subtract
    #         return entry["emojis"][emoji]
    #     else:
    #         # otherwise increment it
    #         return 0

    # def get_all(self, emoji: str):
    #     # iterate through all entries and check if they have that emoji
    #     results: List[carrotBoardEntry] = []
    #     for message_id in self._data:
    #         print(self._data[message_id])
    #         # get the entry
    #         count = self._data[message_id]["emojis"].get(emoji)
    #         if count is not None and count != 0:
    #             # if it was in for that message
    #             results.append({
    #                 "cb_id": 0,
    #                 "emoji": emoji,
    #                 "count": count,
    #                 "user_id": self._data[message_id]["user_id"],
    #                 "msg_id": message_id,
    #                 "channel_id": self._data[message_id]["channel_id"]
    #             })

    #     # results.sort(key=lambda x: x[1], reverse=True)
    #     return results

    # def add(self, message_id: int, emoji: str, channel_id: int, user_id: int):
    #     # get that message id's entry
    #     entry = self._data.get(message_id)
    #     if entry is None:  # FIX THIS
    #         self._data[message_id] = {
    #             "cb_id": 0,
    #             "emojis": {},
    #             "user_id": user_id,
    #             "msg_id": message_id,
    #             "channel_id": channel_id
    #         }

    #         entry = self._data[message_id]

    #     if entry["emojis"].get(emoji) is not None:
    #         # if its already in the database subtract
    #         entry["emojis"][emoji] += 1
    #     else:
    #         # otherwise increment it
    #         entry["emojis"][emoji] = 0

    # def subtract(self, message_id: int, emoji: str):
    #     # get that message id's entry
    #     entry = self._data.get(message_id)
    #     if entry is not None:
    #         if entry["emojis"].get(emoji) is not None and entry["emojis"][emoji] > 0:
    #             # if its already in the database subtract
    #             entry["emojis"][emoji] -= 1
    #         else:
    #             # otherwise increment it
    #             entry["emojis"][emoji] = 0

    # def delete(self, message_id):
    #     # delete the message_id's storage
    #     if self._data.get(message_id) is not None:
    #         del self._data[message_id]
