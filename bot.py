import discord
from discord.ext import commands

import os
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


# Bot startup messages
@bot.event
async def on_ready():
    print("---------------------------------------------")
    print(f"Logged in as {bot.user.name} (ID: {bot.user.id})")
    print("Loaded extensions:")
    for extension in bot.extensions:
        print(f"- {extension}")
    print("Connected to the following guilds:")
    for guild in bot.guilds:
        print(f"- {guild.name} (ID: {guild.id})")
    print("---------------------------------------------")


bot.run(BOT_TOKEN)
