import asyncio
import discord
from discord.ext import commands
import logging
import traceback
from discord.ext.commands.errors import BadArgument
import datetime
from ruamel.yaml import YAML
import tempfile

yaml = YAML()

##############################################################
#               LOGGING (General + Error Handling)           #
##############################################################

class Log(commands.Cog):

    def __init__(self, bot):
        self.bot = bot
        self.root_dir = self.load_directory()
        self.error_file = f"{self.root_dir}error.log"
        self.general_file = f"{self.root_dir}general.log"
        self.command_error_file = f"{self.root_dir}command_error.log"

    @commands.Cog.listener()
    # General logging
    async def on_command(self, ctx):
        # Log format (Message contains user, server and command typed in)
        time = str(datetime.datetime.now().astimezone().replace(microsecond=0).isoformat())
        logging.basicConfig(filename=self.general_file, \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%Y-%m-%dT%H:%M:%S%z', \
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
        logging.basicConfig(filename=self.error_file, \
        filemode = 'a', format='%(asctime)s - %(message)s', \
        datefmt='%Y-%m-%dT%H:%M:%S%z', \
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
        logging.basicConfig(filename=self.command_error_file, \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', \
            datefmt='%Y-%m-%dT%H:%M:%S%z', \
            level=logging.ERROR, \
            force=True)
        server = ctx.guild.name
        user_id = ctx.author.id
        message = ctx.message.content

        if ((isinstance(error, commands.MissingRequiredArgument)) or (isinstance(error, commands.BadArgument))):
            logging.error(f'{server} - {user_id} - {message} - Invalid Arguments')
        
        elif (isinstance(error, commands.CommandNotFound)):
            logging.error(f'{server} - {user_id} - {message} - Command not found.')

    def load_directory(self):
        with open('./data/config/settings.yml') as file:
            settings = yaml.load(file)
        
        if settings['enable_local_data']:
            return settings['local_directory']
        else:
            return settings['root_directory']

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def logs(self, ctx, type='Invalid', amount='100'):
        if type != 'general' and type != 'error' and type != 'command_error' or (amount != 'all' and not amount.isdigit()):
            await ctx.send('Usage: `$logs (general | error | command_error) [amount=100 | all]`')
            return
        with open(f'{self.root_dir}{type}.log', 'r') as file:
            if amount == 'all':
                await asyncio.sleep(0.1) # This is required, as this command executes something is
                                            # written to the log file, which is temporarily cleared or
                                            # something of the like. For a split second, the file appears
                                            # empty and discord throws a 400 for an empty message / file.
                await ctx.reply(file=discord.File(file.name, filename=f'{type}.log'))
            amount = int(amount)
            log_lines = file.readlines()[-amount:] # Only get the latest {amount} logs
            file = tempfile.NamedTemporaryFile(mode='w+', delete=True)
            file.writelines(log_lines)
            file.flush()
            await ctx.reply(file=discord.File(file.name, filename=f'{type}.log'))



def setup(bot):
    bot.add_cog(Log(bot))
