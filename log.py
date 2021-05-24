from gc import is_finalized
import discord
from discord.ext import commands
import logging
import traceback

import os
from discord.ext.commands.errors import BadArgument
import yaml
from dotenv import load_dotenv

# Load settings file and set variables
with open('./config/settings.yml') as file:
    settings = yaml.full_load(file)

BOT_PREFIX = settings['prefix']

# Set token
if settings['token_env_enabled']:
    load_dotenv()
    BOT_TOKEN = os.getenv(settings['token_env_key'])
else:
    BOT_TOKEN = settings['token']

# TODO: Move this to config file
intents = discord.Intents.default()

# Initialise bot
bot = commands.Bot(command_prefix=BOT_PREFIX, intents=intents)

# Load extensions
if __name__ == "__main__":
    for extension in settings['enabled_extensions']:
        bot.load_extension(f"extensions.{extension}")

##############################################################
#               LOGGING (General + Error Handling)           #
##############################################################

# General logging
@bot.event
async def on_command(ctx):
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

#  Bot error messages
@bot.event
async def on_error(ctx):
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

# User Command error messages
@bot.event
async def on_command_error(ctx, error):
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
