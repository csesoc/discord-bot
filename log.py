from gc import is_finalized
import discord
from discord.ext import commands
import logging
import traceback
from discord.ext.commands.errors import BadArgument


##############################################################
#               LOGGING (General + Error Handling)           #
##############################################################

class CommandLogging(commands.Cog):

    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    # General logging
    async def on_command(self, ctx):
        # Log format (Message contains user, server and command typed in)
        logging.basicConfig(filename='general.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', datefmt='%d-%b-%y %H:%M:%S', \
            encoding='utf-8', \
            level=logging.INFO)
        server = ctx.guild.name
        user = ctx.author
        message = ctx.message.content
        logging.info(f'{server} - {user} - {message}')

    @commands.Cog.listener()
    #  Bot error messages
    async def on_error(self, ctx):
        # Error Log format    
        logging.basicConfig(filename='error.log', \
        filemode = 'a', format='%(asctime)s - %(message)s', \
        datefmt='%d-%b-%y %H:%M:%S', \
        encoding='utf-8', \
        level=logging.ERROR)
        server = ctx.guild.name
        user = ctx.author
        message = ctx.message.content
        # Log error
        logging.error(f'{server} - {user} - {traceback.format_exc()}')

    @commands.Cog.listener()
    # User Command error messages
    async def on_command_error(self, ctx, error):
        # Error Log Format
        logging.basicConfig(filename='command_error.log', \
            filemode = 'a', \
            format='%(asctime)s - %(message)s', \
            datefmt='%d-%b-%y %H:%M:%S', \
            encoding='utf-8', level=logging.ERROR)
        server = ctx.guild.name
        user = ctx.author
        message = ctx.message.content

        if ((isinstance(error, commands.MissingRequiredArgument)) or (isinstance(error, commands.BadArgument))):
            logging.error(f'{server} - {user} - {message} - Invalid Arguments')
        
        elif (isinstance(error, commands.CommandNotFound)):
            logging.error(f'{server} - {user} - {message} - Command not found.')



def setup(bot):
    bot.add_cog(CommandLogging(bot))
