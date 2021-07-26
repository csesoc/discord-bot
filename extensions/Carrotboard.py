import discord
from discord import partial_emoji
from discord.ext import commands
from discord import Embed
from datetime import datetime
from typing import TypedDict, List  # remove this later
import random
import psycopg2
import asyncio

from discord.raw_models import RawReactionActionEvent


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot

        self.board_channel_id = 869186939834757160  # put in config
        self.pin = 'U0001f4cc'  # put in config
        self.carrot = ':this:864812598485581884'  # put in config

        self.storage = Database()  # remove this later
        self.minimum = 1  # put this in config

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        # for reaction adding
        if payload.user_id != self.bot.user.id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
            reaction_user_id = payload.user_id

            message = await self.bot.get_channel(channel_id).fetch_message(message_id)
            message_user_id = message.author.id

            # add it to storage
            self.storage.add_value(emoji, message_id, message_user_id, channel_id)

            # now get the entry and None check it
            cb_entry = self.storage.get_by_msg_emoji(message_id, emoji)
            if cb_entry is None:
                print("wtf this shouldn't happen")
                return

            print("just added", cb_entry, emoji, str(payload.emoji), str(payload.emoji.name), str(payload.emoji.id))

            # check whether you need to send a new carrot alert, equal so it doesn't happen everytime
            if cb_entry["count"] == self.minimum:
                # check whether it is a pin
                if cb_entry["emoji"] == self.pin:
                    message = await self.bot.get_channel(channel_id).fetch_message(message_id)
                    await message.pin(reason="New Community Pin")
                    await self.send_carrotboard_alert(payload, is_pin=True)
                else:
                    await self.send_carrotboard_alert(payload)

    # @commands.Cog.listener()
    # async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
    #     # for reaction removing
    #     if payload.user_id != self.bot_id:
    #         # get the details
    #         emoji = partial_emoji_to_str(payload.emoji)
    #         message_id = payload.message_id

    #         # subtract it from the storage
    #         self.storage.subtract_real(message_id, emoji)

    # @commands.Cog.listener()
    # async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
    #     # for reaction clearing, just delete the message_id storage
    #     # message_id = payload.message_id
    #     # self.storage.delete_real(message_id)

    async def send_carrotboard_alert(self, payload: discord.RawReactionActionEvent, is_pin=False):
        board_channel = self.bot.get_channel(self.board_channel_id)

        message = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        embed = Embed(
            description=f"{message.content} \n [Click here to go to message]({message.jump_url})",
            colour=message.author.colour,
            timestamp=datetime.utcnow()
        )

        # now check if it was a special pin board
        if is_pin is True:
            # was a pin
            embed.title = "Wow! A new community Pin! :pushpin: :tada:"
        else:
            # was a normal carrotboard
            embed.title = "A new message has been Carrotted! :partying_face: :tada:"

        embed.set_thumbnail(url='https://stories.freepiklabs.com/storage/15806/messages-rafiki-1343.png')

        await board_channel.send(embed=embed)

    @commands.command()
    async def carrotboard(self, ctx, cb_id_str=None):
        # prints out that carrotboard message
        if cb_id_str is None:
            # check if an id was given
            # here might go printing the entire carrotboard
            await ctx.send("Please include a valid carrotboard ID! <a:party_blob:867059602176213032>")
            # await ctx.send("$leaderboard")
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

        print(cb_entry)

        # now send the embed
        message_channel = self.bot.get_channel(cb_entry["channel_id"])
        message_content = await message_channel.fetch_message(cb_entry["message_id"])
        embed = Embed(
            title=f'Carrot id {cb_id} message',
            description=f'{message_content.content} [Click here to go to message]({message_content.jump_url})',
            timestamp=datetime.utcnow()
        )
        msg = await ctx.send(embed=embed)

        # if command typed in carrotboard output channel
        if ctx.message.channel.id == self.board_channel_id:
            await asyncio.sleep(5)
            await msg.delete()
            await ctx.message.delete()

    @commands.command()
    async def carrotboarduser(self, ctx, user_id_str=None):
        # prints out user messages that have been carroted
        if user_id_str is None:
            await ctx.send("please include a valid user ID! <a:party_blob:867059602176213032>")
            return

        # try convert the string into an int
        try:
            user_id = int(user_id_str)
        except ValueError:
            # it wasn't given an id
            await ctx.send("Please include a valid user ID!")
            return

        # gets the user's entry in carrotboard and send embed
        user_entrys = self.storage.get_all(self.carrot, self.minimum)
        # set found user entry to be false
        entry_found = False
        print("\nuser entrys", user_entrys, "\n")
        for entry in user_entrys:
            print("\n", user_id, "\n", entry)
            if user_id == entry["user_id"]:
                # found user id in carrotboard database
                entry_found = True
                print("got in here for\n")
                message_channel = self.bot.get_channel(entry["channel_id"])
                message_content = await message_channel.fetch_message(entry["message_id"])
                count = entry["count"]
                emoji = str_to_chatable_emoji(entry["emoji"])

                # sends carrroted messages by user
                embed = Embed(
                    title=f"{user_id}'s Carroted Messages",
                    description=f'{entry["carrot_id"]}{message_content.content} with {count} {emoji} at {message_content.created_at}\n [Click here to go to message]({message_content.jump_url})',
                    timestamp=datetime.utcnow()
                )
                await ctx.send(embed=embed)

        # no entries matched with user id
        if entry_found is False:
            await ctx.send("The User does not have any Carroted Messages")

    @commands.command()
    async def leaderboard(self, ctx):
        # Gets the carroted messages
        carrot_emoji = self.carrot
        # carrot_emoji = ":this:864812598485581884"
        top_messages = self.storage.get_all(carrot_emoji, self.minimum)

        # sends leaderboard embed
        embed = Embed(
            title=f'Top carroted messages :trophy: :medal:',
            color=0xf1c40f,
            # random color generator: discord.Color(int(hex(random.randint(1, 16581374)), 16)),
            timestamp=datetime.utcnow()
        )

        index = 1
        for entry in top_messages:
            print(entry)
            # entry = (message_id, count, ...)
            message_author = await self.bot.fetch_user(entry["user_id"])
            author = message_author.name
            message_channel = self.bot.get_channel(entry["channel_id"])
            message_content = await message_channel.fetch_message(entry["message_id"])
            count = entry["count"]
            emoji = str_to_chatable_emoji(entry["emoji"])

            embed.add_field(
                name=f'{index}:  {author}',
                value=f'Time:{message_content.created_at}',
                inline=True
            )
            embed.add_field(
                name='Message',
                value=f'{message_content.content}\n [Click here to go to message]({message_content.jump_url}) \n Carrot id {entry["carrot_id"]} \n \u200b',
                inline=True
            )
            embed.add_field(
                name=f'Number of {emoji}',
                value=count,
                inline=True
            )
            index += 1

        embed.set_thumbnail(url='https://stories.freepiklabs.com/storage/28019/winners-cuate-4442.png')

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
        result = str(emoji_unicode.encode('unicode-escape').decode('ASCII')).replace("\\", "")
        print("RESULT YOO", result)
        return result
    else:
        # should never be hit
        return "uhm something went wrong"


def str_to_chatable_emoji(emoji_str: str):
    # converts the emojistr from partial_emoji_to_str to an emoji you can send
    # will assume its valid
    str_array = emoji_str.split(":")
    if len(str_array) == 1:
        # assume its a normal emoji
        unicode_str = "\\\\" + str_array[0]
        unicode = unicode_str.encode('ASCII').decode('unicode-escape')
        print("JUST CONVERTED", unicode_str, unicode)
        return str(unicode)

    elif len(str_array) == 3 and str_array[0] != 'a':
        # assume its a custom emoji
        name = str_array[1].replace(" ", "")
        id = str_array[2].replace(" ", "")
        return f"<:{name}:{id}>"

    elif len(str_array) == 3 and str_array[0] == 'a':
        # its an animated custom emoji
        name = str_array[1].replace(" ", "")
        id = str_array[2].replace(" ", "")
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


class Database():
    def __init__(self):
        # Connect to the PostgreSQL database server
        self.postgresConnection = psycopg2.connect(user="user", password="pass", host="192.168.0.16", port="44444")

    def create_table(self):
        # Get cursor object from the database connection
        cursor = self.postgresConnection.cursor()

        # Create table statement
        sqlCreateTable = '''CREATE TABLE CARROT_BOARD(
               CARROT_ID SERIAL PRIMARY KEY,
               EMOJI CHAR(20) NOT NULL,
               MESSAGE_ID INT NOT NULL,
               USER_ID INT NOT NULL,
               CHANNEL_ID INT NOT NULL,
               COUNT INT
            )'''

        try:
            # Create a table in PostgreSQL database
            cursor.execute(sqlCreateTable)
            cursor.close()
            self.postgresConnection.commit()

        except(Exception, psycopg2.DatabaseError) as error:
            print(error)

        finally:
            cursor.close()
            self.postgresConnection.commit()

    def check_table(self, table_name):
        cur = self.postgresConnection.cursor()
        cur.execute("select * from information_schema.tables where table_name=%s", (table_name,))
        return bool(cur.rowcount)

    def count_values(self, emoji, message_id, user_id, channel_id):
        print("count the value", (emoji, message_id, user_id, channel_id))
        cursor = self.postgresConnection.cursor()
        print((emoji, message_id, user_id, channel_id))
        postgres_insert_query = ''' SELECT count(*) FROM carrot_board WHERE emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''

        record_to_insert = (emoji, message_id, user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchall()
        cursor.close()

        return record[0][0]

    def get_count(self, emoji, message_id, user_id, channel_id):
        cursor = self.postgresConnection.cursor()
        print("getting count", (emoji, message_id, user_id, channel_id))
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
        record_to_insert = (emoji, message_id, user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()

        # None check
        if record is None:
            return 0

        return record[5]

    def add_value(self, emoji, message_id, user_id, channel_id):
        print("adding input into database", (emoji, message_id, user_id, channel_id))
        # Increase the count if the value exists else create a new value

        if (self.count_values(emoji, message_id, user_id, channel_id)) == 0:
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT) VALUES (%s,%s,%s,%s,%s)'''
            record_to_insert = (emoji, message_id, user_id, channel_id, 1)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

        else:
            count = self.get_count(emoji, message_id, user_id, channel_id)
            count = count + 1
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
            record_to_insert = (count, emoji, message_id, user_id, channel_id)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

    def get_by_cb_id(self, cb_id):
        print("getting carrotboard id", (cb_id))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where carrot_id = %s'''
        record_to_insert = (cb_id,)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()

        # None check
        if record is None:
            return None

        return {
            'carrot_id': record[0],
            'emoji': record[1],
            'message_id': record[2],
            'user_id': record[3],
            'channel_id': record[4],
            'count': record[5]
        }

    def get_by_msg_emoji(self, message_id, emoji):
        print("getting by msg emoji", (message_id, emoji))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where message_id = %s and emoji = %s'''
        record_to_insert = (message_id, emoji)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()

        # None check
        if record is None:
            return None

        return {
            'carrot_id': record[0],
            'emoji': record[1],
            'message_id': record[2],
            'user_id': record[3],
            'channel_id': record[4],
            'count': record[5]
        }

    def get_all(self, emoji, count_min):
        print("getting all inputs", (emoji, count_min))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s'''
        record_to_insert = (emoji, count_min)
        cursor.execute(postgres_insert_query, record_to_insert)
        records = cursor.fetchall()
        cursor.close()

        results = []
        for record in records:
            results.append(
                {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5]
                }
            )

        return results


# class TempStorage():
#     def __init__(self):
#         self._data: dict[int, carrotBoardEntry] = {}
#         self._data_real: dict[int, carrotBoardEntry] = {}
#         self._next_id: int = 0

#     def get_by_cb_id(self, cb_id: int):
#         # gets the cb entry by cb id
#         if cb_id is None:
#             return None

#         return self._data_real.get(cb_id)

#     def get_real(self, message_id: int, emoji: str):
#         # get that message id's entry
#         cb_id = self._reaction_to_cb_id(message_id, emoji)
#         if cb_id is not None:
#             # if its in the database
#             return self._data_real[cb_id]
#         else:
#             # otherwise increment it
#             return None

#     def get_all_real(self, emoji: str, count_min: int):
#         # iterate through all entries and check if they have that emoji
#         results: List[carrotBoardEntry] = []
#         for cb_id in self._data_real:
#             print(self._data_real[cb_id])
#             # get the entry
#             curr_emoji = self._data_real[cb_id].get("emoji")
#             if curr_emoji == emoji:
#                 # found an entry, check the count
#                 if self._data_real[cb_id]["count"] >= count_min:
#                     # found a valid entry, now append it
#                     results.append(self._data_real[cb_id])

#         results.sort(key=lambda x: x["count"], reverse=True)
#         return results

#     def add_real(self, message_id: int, emoji: str, user_id: int, channel_id: int):
#         # check if its in the database
#         cb_id = self._reaction_to_cb_id(message_id, emoji)
#         if cb_id is not None:
#             # found it, increase the count
#             self._data_real[cb_id]["count"] += 1
#             return

#         # wasn't in the database, so create a new one
#         self._data_real[self._next_id] = carrotBoardEntry(
#             cb_id=self._next_id,
#             emoji=emoji,
#             count=1,
#             user_id=user_id,
#             msg_id=message_id,
#             channel_id=channel_id,
#         )

#         # increment the next id
#         self._next_id += 1

#     def subtract_real(self, message_id: int, emoji: str):
#         # check if its in the database
#         cb_id = self._reaction_to_cb_id(message_id, emoji)
#         if cb_id is not None:
#             # it was found, decrease it
#             if self._data_real[cb_id]["count"] > 0:
#                 self._data_real[cb_id]["count"] -= 1
#             else:
#                 self._data_real[cb_id]["count"] = 0

#     def delete_real(self, message_id):
#         # delete the message_id
#         deleting_ids = []
#         # getting all the cb_ids for this message_id
#         for cb_id in self._data_real:
#             curr_message_id = self._data_real[cb_id].get("msg_id")
#             if curr_message_id is not None and curr_message_id == message_id:
#                 # found it in the database, add it to the list
#                 deleting_ids.append(cb_id)

#         # now delete them all
#         for cb_id in deleting_ids:
#             del self._data_real[cb_id]

#     def _reaction_to_cb_id(self, message_id, emoji):
#         if message_id is None or emoji is None:
#             return None

#         # find the cb_id of the message_id
#         for cb_id in self._data_real:
#             curr_message_id = self._data_real[cb_id].get("msg_id")
#             curr_emoji = self._data_real[cb_id].get("emoji")
#             if curr_message_id == message_id and curr_emoji == emoji:
#                 # found it in the database, return it
#                 return cb_id

#         # wasnt found
#         return None
