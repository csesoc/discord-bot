from gc import is_finalized
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
            format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = message.guild.name
        user = message.author.id
        message = message.content
        
        logging.info(f'{server} - {user} - {message}')

    @commands.Cog.listener()
    async def on_message_edit(self, before, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = message.guild.name
        user = message.author.id
        message_before = before.content
        message_after = message.content

        logging.info(f'{user} edited message in {server}\n\tMessage before: {message_before}\n\tMessage after: {message_after}')


    @commands.Cog.listener()
    async def on_message_delete(self, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = message.guild.name
        user = message.author.id
        message = message.content
    
        logging.info (f'{server} - {user} - {message} - deleted')


def setup(bot):
    bot.add_cog(Message_Log(bot))