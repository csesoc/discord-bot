from gc import is_finalized
import discord
from discord.ext import commands
from discord.ext import Cog
import logging
import traceback
from discord.ext.commands.errors import BadArgument


###############################################################
#                      MESSAGE LOGGING                        #
###############################################################
class Message_Log(Cog):

    def __init__(self, bot):
        self.bot = bot

    @Cog.listener()
    async def on_message(self, ctx, message):
        logging.basicConfig(filename='message.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = ctx.guild.name
        user_id = ctx.author.id
        user = ctx.author
        message = ctx.message.content
        
        logging.info(f'{server} - {user_id} - {user} - {message}')

    @Cog.listener()
    async def on_message_edit(self, ctx, before, after, message):
        logging.basicConfig(filename='message.edit.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = ctx.guild.name
        user_id = ctx.author.id
        user = ctx.author
        message_before = before.content
        message_after = after.content

        logging.info(f'{user_id} - {user} edited message in {server} \n Message before:{message_before} \n Message after:{message_after}')


    @Cog.listener()
    async def on_message_delete(self, ctx, message):
        logging.basicConfig(filename='message.delete.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = ctx.guild.name
        user_id = ctx.author.id
        user = ctx.author
        message = ctx.message.content
    
        logging.info (f'{server} - {user_id} - {user} - {message} - deleted')


def setup(bot):
    bot.add_cog(Message_Log(bot))