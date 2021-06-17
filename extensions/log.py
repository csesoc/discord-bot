import discord
from discord.ext import commands
import logging
import traceback
from discord.ext.commands.errors import BadArgument
import datetime
import yaml

##############################################################
#               LOGGING (General + Error Handling)           #
##############################################################

class Log(commands.Cog):

    def __init__(self, bot):
        self.bot = bot
        self.root_dir = self.load_root_directory()
        self.error_file = f"{self.root_dir}error.log"
        self.general_file = f"{self.root_dir}general.log"
        self.command_error_file = f"{self.root_dir}command_error.log"

    @commands.Cog.listener()
    # General logging
    async def on_command(self, ctx):
        # Log format (Message contains user, server and command typed in)
        time = str(datetime.datetime.now().astimezone().replace(microsecond=0).isoformat())
        logging.basicConfig(filename="general.log", \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', \
            level=logging.INFO, \
            force=True)
        server = ctx.guild.name
        user_id = ctx.author.id
        message = ctx.message.content
        logging.info(f'{server} - {user_id} - {message}')

    @commands.Cog.listener()
    #  Bot error messages
    async def on_error(self, ctx):
        # Error Log format    
        logging.basicConfig(filename="error.log", \
        filemode = 'a', format='%(asctime)s - %(message)s', \
        datefmt='%Y-%m-%dT%H:%M:%S%z', \
        encoding='utf-8', \
        level=logging.ERROR, \
        force=True)
        server = ctx.guild.name
        user_id = ctx.author.id
        message = ctx.message.content
        # Log error
        logging.error(f'{server} - {user_id} - {traceback.format_exc()}')

    @commands.Cog.listener()
    # User Command error messages
    async def on_command_error(self, ctx, error):
        # Error Log Format
        logging.basicConfig(filename="on_command_error.log", \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', \
            datefmt='%Y-%m-%dT%H:%M:%S%z', \
            encoding='utf-8', level=logging.ERROR, \
            force=True)
        server = ctx.guild.name
        user_id = ctx.author.id
        message = ctx.message.content

        if ((isinstance(error, commands.MissingRequiredArgument)) or (isinstance(error, commands.BadArgument))):
            logging.error(f'{server} - {user_id} - {message} - Invalid Arguments')
        
        elif (isinstance(error, commands.CommandNotFound)):
            logging.error(f'{server} - {user_id} - {message} - Command not found.')

    def load_root_directory(self):
        with open('./config/settings.yml') as file:
            settings = yaml.full_load(file)
        
        if settings['enable_local_data']:
            return settings['local_directory']
        else:
            return settings['root_directory']



def setup(bot):
    bot.add_cog(Log(bot))
