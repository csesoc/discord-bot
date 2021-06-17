import discord
from discord.ext import commands
import logging
import traceback
from discord.ext.commands.errors import BadArgument


###############################################################
#                      MESSAGE LOGGING                        #
###############################################################
class Message_Log(commands.Cog):

    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
                force = True)
        server = message.guild.name
        user_id = message.author.id
        message = message.content
        
        logging.info(f'{server} - {user_id} - {message}')

    @commands.Cog.listener()
    async def on_message_edit(self, before, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
                force = True)
        server = message.guild.name
        user_id = message.author.id
        message_before = before.content
        message_after = message.content

        logging.info(f'{user_id} edited message in {server}\n\tMessage before: {message_before}\n\tMessage after: {message_after}')


    @commands.Cog.listener()
    async def on_message_delete(self, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
                force = True)
        server = message.guild.name
        user_id = message.author.id
        message = message.content
    
        logging.info (f'{server} - {user_id} - {message} - deleted')


def setup(bot):
    bot.add_cog(Message_Log(bot))