import discord
from discord.ext import commands
from discord import Embed
from datetime import datetime
from typing import TypedDict  # remove this later
import random
import psycopg2
import asyncio
from lib.discordscroll.discordscroll import DiscordScrollHandler


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot

        self.board_channel_id = 869186939834757160  # put in config
        self.leaderboard_id = 870642741103706132  # message id of leaderboard
        self.pin = 'U0001f4cc'  # put in config
        self.carrot = ':this:864812598485581884'  # put in config

        self.minimum = 1  # put this in config
        self.max_msg_len = 50
        self.row_per_page = 5
        self.storage = Database()  # remove this later
        self.scroll_handler = DiscordScrollHandler(60)

    @commands.command()
    async def set_leaderboard(self, ctx, message_id=None):
        # checking if message id is none and reply is none
        reply = ctx.message.reference
        if reply is None and message_id is None:
            # they didn't reply, BUT they didn't give a message_id either
            msg = await ctx.send('Please reply to the leaderboard message!')
            await self._delete_messages(ctx, msg)

        elif reply is None and message_id is not None:
            # they didn't reply, BUT they gave a message_id
            self.leaderboard_id = message_id
            msg = await ctx.send(f'Leaderboard has been set to {self.leaderboard_id}')
            await self._delete_messages(ctx, msg)
        elif reply is not None and message_id is None:
            # they replied and didn't give a message id
            self.leaderboard_id = reply.message_id
            msg = await ctx.send(f'Leaderboard has been set to {self.leaderboard_id}')
            await self._delete_messages(ctx, msg)
        elif reply is not None and message_id is not None:
            # they replied and gave a message id LOL
            msg = await ctx.send('Please either reply to leaderboard message or enter a valid message ID')
            await self._delete_messages(ctx, msg)

    @commands.command()
    async def update_leaderboard(self, ctx):
        # forces an update to the leaderabord
        await self._update_leaderboard()

        msg = await ctx.send("Leaderboard Force-Updated")
        await self._delete_messages(ctx, msg)

    @commands.command()
    async def set_carrotboard(self, ctx):
        self.board_channel_id = ctx.channel.id
        msg = await ctx.send("Carrotboard channel Id has been set")
        await self._delete_messages(ctx, msg)

    @commands.command()
    async def carrotboard(self, ctx, cb_id_str=None):
        # prints out that carrotboard message
        if cb_id_str is None:
            # check if an id was given, if not print the leaderboard
            embed_list = await self._generate_leaderboard()

            await self.scroll_handler.new(ctx, embed_list)
            return

        # try convert the string into an int
        try:
            cb_id = int(cb_id_str)
        except ValueError:
            # it wasn't given an id
            msg = await ctx.send("Please include a valid carrotboard ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # now get the carrotboard entry
        cb_entry = self.storage.get_by_cb_id(cb_id)
        if cb_entry is None:
            # the id doesn't exist
            msg = await ctx.send("Please include a valid carrotboard ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        print(cb_entry)

        # now send the embed
        message_channel = self.bot.get_channel(cb_entry["channel_id"])
        try:
            message_object = await message_channel.fetch_message(cb_entry["message_id"])
        except discord.NotFound:
            msg = await ctx.send("Please include a valid carrotboard ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # get the message content, trim it if needed
        message_text = message_object.content
        if len(message_text) > self.max_msg_len:
            message_text = message_text[:self.max_msg_len] + "..."

        embed = Embed(
            title=f'Carrot id {cb_id} message',
            description=f'{message_text} [Click here to go to message]({message_object.jump_url})',
            timestamp=datetime.utcnow(),
            color=discord.Color(int(hex(random.randint(1, 16581374)), 16))
        )

        msg = await ctx.send(embed=embed)
        # if command typed in carrotboard output channel
        if ctx.message.channel.id == self.board_channel_id:
            await self._delete_messages(ctx, msg)

    @commands.command()
    async def carrotboarduser(self, ctx, user_id_str=None):
        user_id_str = user_id_str.replace("<", "").replace(">", "").replace("@", "").replace("!", "")

        # prints out user messages that have been carroted
        if user_id_str is None:
            msg = await ctx.send("Please include a valid user ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # try convert the string into an int, or the username to user id
        try:
            user_id = int(user_id_str)
        except ValueError:
            # it wasn't given an id
            msg = await ctx.send("Please include a valid user ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        user = await self.bot.fetch_user(user_id)
        if user is None:
            # user didn't exist
            msg = await ctx.send("Please include a valid user ID!")
            if ctx.message.channel.id == self.board_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # send the users leaderboard
        embed_list = await self._generate_leaderboard(specific_user_id=user_id)

        await self.scroll_handler.new(ctx, embed_list)

    # for scroller handling
    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        # for reaction adding

        channel = self.bot.get_channel(payload.channel_id)
        message = await channel.fetch_message(payload.message_id)
        # check that the reactor is not the bot, and that the author is not the bot
        if payload.user_id != self.bot.user.id and message.author.id != self.bot.user.id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
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
                if str_to_chatable_emoji(cb_entry["emoji"]) == str_to_chatable_emoji(self.pin):
                    message = await self.bot.get_channel(channel_id).fetch_message(message_id)
                    await message.pin(reason="New Community Pin")
                    await self.send_carrotboard_alert(payload, is_pin=True)
                else:
                    await self.send_carrotboard_alert(payload)

            await self._update_leaderboard()

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        # for reaction removing

        channel = self.bot.get_channel(payload.channel_id)
        message = await channel.fetch_message(payload.message_id)
        # check that the reactor is not the bot, and that the author is not the bot
        if payload.user_id != self.bot.user.id and message.author.id != self.bot.user.id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
            message_user_id = message.author.id

            # subtract it from storage storage
            self.storage.sub_value(emoji, message_id, message_user_id, channel_id)

            print("just subbed from", emoji, str(payload.emoji), str(payload.emoji.name), str(payload.emoji.id))

            await self._update_leaderboard()

    @commands.Cog.listener()
    async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
        # for reaction clearing
        # remove it from storage, wont do anything if doesnt exist for some reason
        self.storage.del_entry(payload.message_id, payload.channel_id)

        print("just cleared from", payload.message_id)

        await self._update_leaderboard()

    @commands.Cog.listener()
    async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent):
        # for message deletion, same as reaction_clear
        # remove from storage
        self.storage.del_entry(payload.message_id, payload.channel_id)

        print("just deleted", payload.message_id)

        await self._update_leaderboard()

    async def send_carrotboard_alert(self, payload: discord.RawReactionActionEvent, is_pin=False):
        board_channel = self.bot.get_channel(self.board_channel_id)

        message_object = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        # get the message content, trim it if needed
        message_text = message_object.content
        if len(message_text) > self.max_msg_len:
            message_text = message_text[:self.max_msg_len] + "..."

        embed = Embed(
            description=f"{message_text} \n [Click here to go to message]({message_object.jump_url})",
            colour=message_object.author.colour,
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

    # generates the leaderboard Embed
    async def _generate_leaderboard(self, only_top_ten=False, specific_user_id=None):
        # Gets the carroted messages
        top_messages = self.storage.get_all(self.carrot, self.minimum)

        # leaderboard content
        embed_pages = []
        index = 1
        for entry in top_messages:
            # for specific userboard, skip if specific userid given, but not current
            if specific_user_id is not None and entry["user_id"] != specific_user_id:
                print(f"skipping {entry['user_id']} != {specific_user_id}")
                continue

            # skip if count = 0, print error message as this shouldnt happen
            if entry['count'] <= 0:
                print(f"Error: Count <= 0: {entry['message_id']}")
                continue

            # get the page number and check if its a top ten only
            page = int((index - 1) / self.row_per_page)
            if only_top_ten and page > 0:
                return embed_pages

            # check if needs to make a new embed
            if ((index - 1) % self.row_per_page) == 0:
                # new page
                new_embed_page = Embed(
                    title=f'Top carroted messages :trophy: :medal:',
                    color=0xf1c40f,
                    timestamp=datetime.utcnow()
                )
                new_embed_page.set_thumbnail(url='https://stories.freepiklabs.com/storage/28019/winners-cuate-4442.png')
                embed_pages.append(new_embed_page)

            # get all the data
            message_author = await self.bot.fetch_user(entry["user_id"])
            if message_author is None:
                continue  # skip this user
            author = message_author.name

            message_channel = self.bot.get_channel(entry["channel_id"])
            if message_channel is None:
                continue  # skip this channel since it was deleted

            # print("\ngetting", entry["message_id"], "\n")
            try:
                message_object = await message_channel.fetch_message(entry["message_id"])
            except discord.NotFound:
                # print("WOW NONE\n\n")
                continue  # skip this message as it was deleted
            # print(message_object)

            count = entry["count"]
            emoji = str_to_chatable_emoji(entry["emoji"])

            # get the message content, trim it if needed
            message_text = message_object.content
            if len(message_text) > self.max_msg_len:
                message_text = message_text[:self.max_msg_len] + "..."

            embed_pages[page].add_field(
                name=f'{index}:  {author}',
                value=f'Time:{message_object.created_at}',
                inline=True
            )
            embed_pages[page].add_field(
                name='Message',
                value=f'{message_text}\n [Click here to go to message]({message_object.jump_url}) \n Carrot ID {entry["carrot_id"]} \n \u200b',
                inline=True
            )
            embed_pages[page].add_field(
                name=f'Number of {emoji}',
                value=count,
                inline=True
            )
            index += 1

        print(embed_pages)

        if embed_pages == []:
            sad_embed = Embed(title="There are no Carroted Messages :( :sob: :smiling_face_with_tear:", description='\u200b')
            embed_pages.append(sad_embed)

        print(embed_pages)

        return embed_pages

    # creating permanent leaderboard
    async def _update_leaderboard(self):
        embed_pages = await self._generate_leaderboard(only_top_ten=True)
        embed = embed_pages[0]

        channel = self.bot.get_channel(self.board_channel_id)
        if channel is None:
            return

        try:
            message = await channel.fetch_message(self.leaderboard_id)
        except discord.NotFound:
            return

        await message.edit(embed=embed)

    async def _delete_messages(self, ctx, msg):
        await asyncio.sleep(5)
        await msg.delete()
        await ctx.message.delete()


def setup(bot):
    bot.add_cog(Carrotboard(bot))


#####################################
#          OTHER FUNCTIONS          #
#####################################
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
        return str(unicode).replace(" ", "")

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
               EMOJI CHAR(40) NOT NULL,
               MESSAGE_ID BIGINT NOT NULL,
               USER_ID BIGINT NOT NULL,
               CHANNEL_ID BIGINT NOT NULL,
               COUNT BIGINT
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
        print((emoji, message_id, user_id, channel_id))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT count(*) FROM carrot_board WHERE emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''

        record_to_insert = (emoji, message_id, user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchall()
        cursor.close()

        return record[0][0]

    def get_count(self, emoji, message_id, user_id, channel_id):
        print("getting count", (emoji, message_id, user_id, channel_id))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''

        record_to_insert = (emoji, message_id, user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()

        # None check
        if record is None:
            return None

        return record[5]

    def add_value(self, emoji, message_id, user_id, channel_id):
        print("adding input into database", (emoji, message_id, user_id, channel_id))
        # Increase the count if the value exists else create a new value

        count = self.get_count(emoji, message_id, user_id, channel_id)

        if count is None:
            # doesnt exist already in database
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT) VALUES (%s,%s,%s,%s,%s)'''
            record_to_insert = (emoji, message_id, user_id, channel_id, 1)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()
        else:
            count = count + 1
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
            record_to_insert = (count, emoji, message_id, user_id, channel_id)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

    # subtract a count
    def sub_value(self, emoji, message_id, user_id, channel_id):
        print("subbing input into database", (emoji, message_id, user_id, channel_id))
        # Increase the count if the value exists else create a new value

        count = self.get_count(emoji, message_id, user_id, channel_id)

        if count is None:
            # doesnt exist already in database
            print("uhm subbing", emoji, message_id, user_id, channel_id)
            return
        elif (count - 1) <= 0:
            # remove from database
            self.del_entry(message_id, channel_id)
        else:
            count = count - 1
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
            record_to_insert = (count, emoji, message_id, user_id, channel_id)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

    def del_entry(self, message_id, channel_id):
        print("deleting:", (message_id, channel_id))

        cursor = self.postgresConnection.cursor()
        postgres_delete_query = '''DELETE FROM carrot_board where message_id = %s and channel_id = %s'''
        record_to_delete = (message_id, channel_id)
        cursor.execute(postgres_delete_query, record_to_delete)
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

        results.sort(key=lambda x: x["count"], reverse=True)
        return results
