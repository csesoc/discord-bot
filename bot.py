import discord
from discord.ext import commands

import os
from ruamel.yaml import YAML
from dotenv import load_dotenv

yaml = YAML()

# Load settings file and set variables
with open('./config/settings.yml') as file:
    settings = yaml.load(file)

BOT_PREFIX = settings['prefix']

# Set token
if settings['token_env_enabled']:
    load_dotenv()
    BOT_TOKEN = os.getenv(settings['token_env_key'])
else:
    BOT_TOKEN = settings['token']

# TODO: Move this to config file
intents = discord.Intents.all()

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


@bot.command()
@commands.has_permissions(administrator=True)
async def prefix(ctx, *, new_prefix):
    bot.command_prefix = new_prefix

    with open('./config/settings.yml') as file:
        data = yaml.load(file)

    data['prefix'] = new_prefix

    with open('./config/settings.yml', 'w') as file:
        yaml.dump(data, file)

    await ctx.send(f"Set `{new_prefix}` as the new command prefix.")


bot.run(BOT_TOKEN)
