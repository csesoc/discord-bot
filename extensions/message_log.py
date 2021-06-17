import discord
from discord.ext import commands
import logging
import traceback
from discord.ext.commands.errors import BadArgument
import yaml

###############################################################
#                      MESSAGE LOGGING                        #
###############################################################
class Message_Log(commands.Cog):

    def __init__(self, bot):
        self.bot = bot
        self.path = self.load_directory()
        self.message_log = f'{self.path}message.log'
        self.on_message_edit = f'{self.path}message.log'
        self.on_message_delete = f'{self.path}message.log'

    @commands.Cog.listener()
    async def on_message(self, message):
        logging.basicConfig(filename=self.message_log, \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
            force=True)
        server = message.guild.name
        user_id = message.author.id
        message = message.content
        
        logging.info(f'{server} - {user_id} - {message}')

    @commands.Cog.listener()
    async def on_message_edit(self, before, message):
        logging.basicConfig(filename=self.on_message_edit, \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
            force=True)
        server = message.guild.name
        user_id = message.author.id
        message_before = before.content
        message_after = message.content

        logging.info(f'{user_id} edited message in {server}\n\tMessage before: {message_before}\n\tMessage after: {message_after}')


    @commands.Cog.listener()
    async def on_message_delete(self, message):
        logging.basicConfig(filename=self.on_message_delete, \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
            force=True)
        server = message.guild.name
        user_id = message.author.id
        message = message.content
    
        logging.info (f'{server} - {user_id} - {message} - deleted')
    
    def load_directory(self):
        with open('./config/settings.yml') as file:
            settings = yaml.full_load(file)

        if settings['enable_local_data']:
            return settings['local_directory']
        
        else:
            return settings['root_directory']



def setup(bot):
    bot.add_cog(Message_Log(bot))