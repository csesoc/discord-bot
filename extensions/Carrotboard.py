import discord
from discord.ext import commands
from discord import Embed
from datetime import datetime
from typing import TypedDict  # remove this later
import random
import psycopg2
import asyncio
from lib.discordscroll.discordscroll import DiscordScrollHandler
from ruamel.yaml import YAML
from emoji import UNICODE_EMOJI


class Carrotboard(commands.Cog):
    def __init__(self, bot: discord.Client):
        self.bot = bot

        # read the config file
        self._read_config()

        self.pin = "U0001f4cc"
        self.max_msg_len = 50
        self.row_per_page = 5
        self.storage = Database()  # remove this later
        self.scroll_handler = DiscordScrollHandler(60)

    #####################################
    #           ADMIN COMMANDS          #
    #####################################
    @commands.command(brief="Sets the updated leaderboard message.", usage="<reply to board>", name="setcarrotboardperma", aliases=["cbsetperma"])
    @commands.has_permissions(administrator=True)
    async def set_carrotboard_perma(self, ctx):
        # checking if message id is none and reply is none
        reply = ctx.message.reference
        if reply is None:
            # they didn't reply, BUT they didn't give a message_id either
            msg = await ctx.send('Please reply to the leaderboard message!')
            await self._delete_messages(ctx, msg)
            return

        # save the change
        self.leaderboard_id = reply.message_id
        self.perma_channel_id = ctx.channel.id
        msg = await ctx.send(f'Leaderboard has been set to {self.leaderboard_id}')
        await self._delete_messages(ctx, msg)

        # update settings file
        with open('./data/config/carrotboard.yml') as file:
            settings = YAML().load(file)
            settings['leaderboard_message_id'] = self.leaderboard_id  # would need to check this
            settings['leaderboard_channel_id'] = self.perma_channel_id

        # saving it to the file
        if settings is not None:
            with open('./data/config/carrotboard.yml', 'w') as file:
                YAML().dump(settings, file)

    @commands.command(brief="Sets channel for carrotboard output.", name="setcarrotboardchannel", aliases=["cbsetchannel"])
    @commands.has_permissions(administrator=True)
    async def set_carrotboard_channel(self, ctx):
        # setting the carrotboard channel id into the config file
        with open('./data/config/carrotboard.yml') as file:
            settings = YAML().load(file)
            settings['carrotboard_alert_channel_id'] = ctx.channel.id  # would need to check this
            self.alert_channel_id = ctx.channel.id

        # saving it to the file
        if settings is not None:
            with open('./data/config/carrotboard.yml', 'w') as file:
                YAML().dump(settings, file)

        msg = await ctx.send("Carrotboard channel Id has been set")
        if ctx.message.channel.id == self.alert_channel_id:
            await self._delete_messages(ctx, msg)

    @commands.command(brief="Sets the used carrot emoji.", usage="<emoji>", name="setcarrot", aliases=["cbsetcarrot"])
    @commands.has_permissions(administrator=True)
    async def set_carrot(self, ctx, emoji=None):
        # sets the carrotemoji
        if emoji is None or len(emoji) == 0:
            msg = await ctx.send("Please give a valid emoji in your message.")
            await self._delete_messages(ctx, msg)
            return

        # check if it is an discord emoji
        try:
            extracted = await commands.PartialEmojiConverter().convert(ctx, emoji)
        except commands.PartialEmojiConversionFailure:
            # check if its a normal emoji then
            if emoji[0] in UNICODE_EMOJI['en']:
                extracted = emoji[0]
            else:
                await ctx.send("Please give a valid emoji in your message.")
                return

        # convert the emoji to a config safe emoji
        config_safe = partial_emoji_to_str(extracted)
        if config_safe == "deleted_emoji" or config_safe == "error":
            await ctx.send("Please give a valid emoji in your message.")
            return

        # setting the carrotboard channel id into the config file
        with open('./data/config/carrotboard.yml') as file:
            settings = YAML().load(file)
            settings['carrot_emoji'] = config_safe  # would need to check this
            self.carrot = config_safe

        # saving it to the file
        if settings is not None:
            with open('./data/config/carrotboard.yml', 'w') as file:
                YAML().dump(settings, file)

        await ctx.send(f"Set the carrot emoji to {extracted}")

    #####################################
    #           USER COMMANDS           #
    #####################################
    @commands.command(brief="Sends carrotboard, or a specific carrotmessage.", usage="[carrotboard id|none]", aliases=["cb"])
    async def carrotboard(self, ctx, cb_id_str=None):
        # prints out that carrotboard message
        if cb_id_str is None:
            # check if an id was given, if nothing given then print the leaderboard
            embed_list = await self._generate_leaderboard(specific_emoji=self.carrot)

            await self.scroll_handler.new(ctx, embed_list)
            return

        # try convert the string into an int
        try:
            cb_id = int(cb_id_str)
        except ValueError:
            # it wasn't given an id
            msg = await ctx.send("Please include a valid carrotboard ID!")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # Gets the carrotboard entry
        cb_entry = self.storage.get_by_cb_id(cb_id)
        if cb_entry is None:
            # the id doesn't exist
            msg = await ctx.send("Please include a valid carrotboard ID!")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        print(cb_entry)

        # get the channel of the message
        message_channel = self.bot.get_channel(cb_entry["channel_id"])
        if message_channel is None:
            msg = await ctx.send("Channel no longer exists.")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # send the embed
        message_object = message_channel.get_partial_message(cb_entry["message_id"])
        if message_object is None:  # shouldn't happen really I believe
            msg = await ctx.send("Message ID was not found.")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # get the message content, trim it if needed
        message_text = cb_entry["contents"]
        if len(message_text) >= self.max_msg_len:
            message_text = message_text[:self.max_msg_len] + "..."

        embed = Embed(
            title=f'Carrot id {cb_id} message',
            description=f'{message_text}\n[Click here to go to message]({message_object.jump_url})',
            timestamp=datetime.utcnow(),
            color=discord.Color(int(hex(random.randint(1, 16581374)), 16))
        )

        msg = await ctx.send(embed=embed)
        # if command typed in carrotboard output channel
        if ctx.message.channel.id == self.alert_channel_id:
            await self._delete_messages(ctx, msg)

    @commands.command(brief="Sends carrotboard for a specific user.", usage="<user>", aliases=["cbuser"])
    async def carrotboarduser(self, ctx, user_id_str=None):
        # check if a user was given
        if user_id_str is None:
            msg = await ctx.send("Please give a valid user ID or tag the user in the command!")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # get rid of the discord user markup
        user_id_str = user_id_str.replace("<", "").replace(">", "").replace("@", "").replace("!", "")

        # try convert the string into an int, or the username to user id
        try:
            user_id = int(user_id_str)
        except ValueError:
            # it wasn't given an id
            msg = await ctx.send("Please include a valid user ID!")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        user = await self.bot.fetch_user(user_id)
        if user is None:
            # user didn't exist
            msg = await ctx.send("Please include a valid user ID!")
            if ctx.message.channel.id == self.alert_channel_id:
                await self._delete_messages(ctx, msg)
            return

        # send the users leaderboard
        embed_list = await self._generate_leaderboard(specific_user_id=user_id)

        await self.scroll_handler.new(ctx, embed_list)

    @commands.command(brief="Sends all emojiboard, or a specific emojiboard.", usage="[emoji|none]", aliases=["cball", "cbemoji"])
    async def carrotboardall(self, ctx, emoji=None):
        # sends the all emoji
        if emoji is None or len(emoji) == 0:
            embed_list = await self._generate_leaderboard()
            await self.scroll_handler.new(ctx, embed_list)
            return

        # check if it is an discord emoji
        try:
            extracted = await commands.PartialEmojiConverter().convert(ctx, emoji)
        except commands.PartialEmojiConversionFailure:
            # check if its a normal emoji then
            if emoji[0] in UNICODE_EMOJI['en']:
                extracted = emoji[0]
            else:
                await ctx.send("Please give a valid emoji in your message, or none at all.")
                return

        # convert the emoji to a db safe emoji
        db_safe = partial_emoji_to_str(extracted)
        if db_safe == "deleted_emoji" or db_safe == "error":
            await ctx.send("Please give a valid emoji in your message, or none at all.")
            return

        embed_list = await self._generate_leaderboard(specific_emoji=db_safe)
        await self.scroll_handler.new(ctx, embed_list)

    #####################################
    #             LISTENERS             #
    #####################################
    # for scroller handling
    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)

    # for reaction adding
    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        # get the channel and the message
        channel = self.bot.get_channel(payload.channel_id)
        message = await channel.fetch_message(payload.message_id)

        # check that the reactor is not the bot, and that the author is not the bot
        if not message.author.bot and payload.user_id != self.bot.user.id and message.author.id != self.bot.user.id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
            message_user_id = message.author.id
            message_text = message.content
            if len(message_text) > self.max_msg_len:
                message_text = message_text[:self.max_msg_len]

            # add it to storage
            self.storage.add_value(emoji, message_id, message_user_id, channel_id, message_text)

            # now get the entry and None check it
            cb_entry = self.storage.get_by_msg_emoji(message_id, emoji)
            if cb_entry is None:
                print("this shouldn't happen")
                return

            print("just added", cb_entry, emoji, str(payload.emoji), str(payload.emoji.name), str(payload.emoji.id))

            # check whether it is a pin
            if str_to_chatable_emoji(cb_entry["emoji"]) == str_to_chatable_emoji(self.pin):
                if cb_entry["count"] == self.pin_minimum:
                    await message.pin(reason="New Community Pin")
                    await self._send_carrotboard_alert(payload, cb_entry["carrot_id"], cb_entry["emoji"])
            elif cb_entry["count"] == self.minimum:
                # check whether you need to send a new carrot alert, equal so it doesn't happen everytime
                await self._send_carrotboard_alert(payload, cb_entry["carrot_id"], cb_entry["emoji"])

            await self._update_leaderboard()

    # for reaction removing
    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        channel = self.bot.get_channel(payload.channel_id)
        try:
            message = await channel.fetch_message(payload.message_id)
        except discord.errors.NotFound:
            return  # it was the scroller X so ignore

        # check that the reactor is not the bot, and that the author is not the bot
        if not message.author.bot and payload.user_id != self.bot.user.id and message.author.id != self.bot.user.id:
            # get the details
            emoji = partial_emoji_to_str(payload.emoji)
            message_id = payload.message_id
            channel_id = payload.channel_id
            message_user_id = message.author.id

            # subtract it from storage storage
            self.storage.sub_value(emoji, message_id, message_user_id, channel_id)

            print("just subbed from", emoji, str(payload.emoji), str(payload.emoji.name), str(payload.emoji.id))

            await self._update_leaderboard()

    # for reaction clearing
    @commands.Cog.listener()
    async def on_raw_reaction_clear(self, payload: discord.RawReactionClearEvent):
        # remove it from storage, wont do anything if doesnt exist for some reason
        self.storage.del_entry(payload.message_id, payload.channel_id)

        print("just cleared from", payload.message_id)

        await self._update_leaderboard()

    # for message deletion, should act the same as clearing
    @commands.Cog.listener()
    async def on_raw_message_delete(self, payload: discord.RawMessageDeleteEvent):
        # remove from storage
        self.storage.del_entry(payload.message_id, payload.channel_id)

        print("just deleted", payload.message_id)

        await self._update_leaderboard()

    #####################################
    #              HELPERS              #
    #####################################
    # sends the carrotboard alert
    async def _send_carrotboard_alert(self, payload: discord.RawReactionActionEvent, cb_id, cb_emoji):
        board_channel = self.bot.get_channel(self.alert_channel_id)
        if board_channel is None:
            return  # skip if no valid board channel set

        message_object = await self.bot.get_channel(payload.channel_id).fetch_message(payload.message_id)

        # get the message content, trim it if needed
        message_text = message_object.content
        if len(message_text) > self.max_msg_len:
            message_text = message_text[:self.max_msg_len] + "..."

        embed = Embed(
            # title=f"{message_text}",
            description=f"**{message_text}**",
            colour=message_object.author.colour,
        )
        embed.set_footer(text=f"ID: {cb_id}")
        embed.url = message_object.jump_url

        # now check if it was a special pin board
        emoji = str_to_chatable_emoji(cb_emoji)
        if emoji == str_to_chatable_emoji(self.pin):
            # was a pin
            embed.title = "Wow! A new community Pin! :pushpin: :tada:"
        elif emoji == str_to_chatable_emoji(self.carrot):
            # was a normal carrotboard
            embed.title = "A new message has been Carrotted! :partying_face: :tada:"
        else:
            # was something else
            embed.title = f"A new message has been {emoji}-ed! :tada:"

        embed.set_thumbnail(url='https://stories.freepiklabs.com/storage/15806/messages-rafiki-1343.png')

        await board_channel.send(embed=embed)

    # generates the leaderboard Embed
    async def _generate_leaderboard(self, only_first_page=False, specific_user_id=None, specific_emoji=None):
        print("\ngenerating leaderboard\n")

        # Gets the carroted messages
        if specific_user_id is not None:
            top_messages = self.storage.get_all_by_user(self.carrot, self.minimum, specific_user_id)
        elif specific_emoji is not None:
            top_messages = self.storage.get_all_by_emoji(specific_emoji, self.minimum)
        else:
            top_messages = self.storage.get_all(self.minimum)

        # leaderboard content
        embed_pages = []
        index = 1
        cached_users = {}
        for entry in top_messages:
            # skip if count = 0, print error message as this shouldnt happen
            if entry['count'] <= 0:
                print(f"Error: Count <= 0: {entry['message_id']}")
                continue

            # get the page number and check if its a top ten only
            page = int((index - 1) / self.row_per_page)
            if only_first_page and page > 0:
                break

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

            # get the user data (only if its not already cached)
            if entry["user_id"] not in cached_users.keys():
                print(f"caching {entry['user_id']}")
                fetched_message_author = await self.bot.fetch_user(entry["user_id"])
                cached_users[entry["user_id"]] = fetched_message_author

            message_author = cached_users[entry["user_id"]]
            if message_author is None:
                continue  # skip this user since it was not successfully cached, meaning probs deleted

            author = message_author.name

            message_channel = self.bot.get_channel(entry["channel_id"])
            if message_channel is None:
                continue  # skip this channel since it was deleted

            # print("\ngetting", entry["message_id"], "\n")
            message_object = message_channel.get_partial_message(entry["message_id"])
            if message_object is None:
                continue  # skip since message was deleted, shouldnt really happen

            count = entry["count"]
            emoji = str_to_chatable_emoji(entry["emoji"])

            # get the message content, trim it if needed
            message_text = entry["contents"]
            if len(message_text) >= self.max_msg_len:
                message_text = message_text[:self.max_msg_len] + "..."

            embed_pages[page].add_field(
                name=f'{index}:  {author}',
                value='\u200b',  # Waleed said to delete, maybe try shorten time to only dates and no time? f'Time:{message_object.created_at}'
                inline=True
            )
            embed_pages[page].add_field(
                name='Message',
                value=f'{message_text}\n[Click here to go to message]({message_object.jump_url})\nCarrot ID {entry["carrot_id"]}\n\u200b',
                inline=True
            )
            embed_pages[page].add_field(
                name=f'Number of {emoji}',
                value=count,
                inline=True
            )
            index += 1

        # if no carroted message
        if embed_pages == []:
            sad_embed = Embed(title="There are no Carroted Messages :( :sob: :smiling_face_with_tear:", description='\u200b')
            embed_pages.append(sad_embed)

        print(embed_pages)
        return embed_pages

    # updates the permanent leaderboard
    async def _update_leaderboard(self):
        embed_pages = await self._generate_leaderboard(only_first_page=True, specific_emoji=self.carrot)
        embed = embed_pages[0]

        # get the leaderboard channel
        channel = self.bot.get_channel(self.perma_channel_id)
        if channel is None:
            return

        # get the leaderboard message
        try:
            message = await channel.fetch_message(self.leaderboard_id)
        except discord.NotFound:
            return

        # update the message
        await message.edit(embed=embed)

    # deletes the command and reply message
    async def _delete_messages(self, ctx, msg):
        await asyncio.sleep(5)
        await msg.delete()
        await ctx.message.delete()

    # reads the config into the self variables
    def _read_config(self):
        # Load settings and set variables
        with open('./data/config/carrotboard.yml', 'r') as file:
            settings = YAML().load(file)

        self.leaderboard_id = settings.get('leaderboard_message_id')
        self.perma_channel_id = settings.get('leaderboard_channel_id')
        self.alert_channel_id = settings.get('carrotboard_alert_channel_id')
        self.carrot = settings.get('carrot_emoji')
        self.minimum = settings.get('minimum_carrot_count')
        self.pin_minimum = settings.get("minimum_pin_count")

        # check if any were None
        missing_keys = []
        required_key_list = [
            "leaderboard_message_id", "leaderboard_channel_id", "carrotboard_alert_channel_id", "carrot_emoji", "minimum_carrot_count", "minimum_pin_count"
        ]
        for required_key in required_key_list:
            if settings.get(required_key) is None:
                missing_keys.append(required_key)

        if len(missing_keys) > 0:
            raise KeyError(f"Missing Config Keys: {', '.join(missing_keys)}")


def setup(bot):
    bot.add_cog(Carrotboard(bot))


#####################################
#          OTHER FUNCTIONS          #
#####################################
def partial_emoji_to_str(emoji: discord.PartialEmoji):
    # DEBUG:
    # return str(emoji)

    # converts the emoji into its future database identifier
    # normal emojis will be emoji.name.encode('unicode-escape').decode('ASCII')
    # custom emojis will be :name:id

    if isinstance(emoji, str):
        return str(emoji.encode('unicode-escape').decode('ASCII')).replace("\\", "")
    elif isinstance(emoji, discord.PartialEmoji):
        if emoji.name is None:
            # casual None check
            return "deleted_emoji"
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
        return "error"

    # should never be hit
    return "uhm something went wrong"


def str_to_chatable_emoji(emoji_str: str):
    # converts the emojistr from partial_emoji_to_str to an emoji you can send
    # will assume its valid
    emoji_str = emoji_str.rstrip(" ")
    if emoji_str == "deleted_emoji":
        return "?"

    str_array = emoji_str.split(":")
    if len(str_array) == 1:
        # assume its a normal emoji
        unicode_str = "\\" + str_array[0]
        unicode = unicode_str.encode('ASCII').decode('unicode-escape')
        print("JUST CONVERTED", unicode_str, unicode)
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
    emoji: str
    count: int
    user_id: int
    msg_id: int
    channel_id: int
    contents: str


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
               COUNT BIGINT,
               MESSAGE_CONTENTS CHAR(50)
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

    def add_value(self, emoji, message_id, user_id, channel_id, message_contents):
        print("adding input into database", (emoji, message_id, user_id, channel_id))
        # Increase the count if the value exists else create a new value

        count = self.get_count(emoji, message_id, user_id, channel_id)

        if count is None:
            # doesnt exist already in database
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT, MESSAGE_CONTENTS) VALUES (%s,%s,%s,%s,%s,%s)'''
            record_to_insert = (emoji, message_id, user_id, channel_id, 1, message_contents)
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

        print(record)

        return {
            'carrot_id': record[0],
            'emoji': record[1],
            'message_id': record[2],
            'user_id': record[3],
            'channel_id': record[4],
            'count': record[5],
            'contents': record[6].rstrip(" "),
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
            'count': record[5],
            'contents': record[6].rstrip(" "),
        }

    def get_all(self, count_min):
        print("getting all inputs", (count_min))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where count >= %s'''
        record_to_insert = (str(count_min))
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
                    'count': record[5],
                    'contents': record[6].rstrip(" "),
                }
            )

        results.sort(key=lambda x: x["count"], reverse=True)
        return results

    def get_all_by_emoji(self, emoji, count_min):
        print("getting all inputs by emoji", (emoji, count_min))
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
                    'count': record[5],
                    'contents': record[6].rstrip(" "),
                }
            )

        results.sort(key=lambda x: x["count"], reverse=True)
        return results

    def get_all_by_user(self, emoji, count_min, user):
        print("getting all inputs from user", (emoji, count_min, user))
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s and user_id = %s'''
        record_to_insert = (emoji, count_min, user)
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
                    'count': record[5],
                    'contents': record[6].rstrip(" "),
                }
            )

        results.sort(key=lambda x: x["count"], reverse=True)
        return results
