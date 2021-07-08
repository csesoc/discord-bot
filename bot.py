import discord
from discord.ext import commands

import os
from ruamel.yaml import YAML
from dotenv import load_dotenv

yaml = YAML()

SETTINGS_FILE = './data/config/settings.yml'
# Load settings file and set variables
with open(SETTINGS_FILE) as file:
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

    with open(SETTINGS_FILE) as file:
        data = yaml.load(file)

    data['prefix'] = new_prefix

    with open(SETTINGS_FILE, 'w') as file:
        yaml.dump(data, file)

    await ctx.send(f"Set `{new_prefix}` as the new command prefix.")


@bot.command()
@commands.has_permissions(administrator=True)
async def load(ctx, extension):
    try:
        bot.load_extension(f"extensions.{extension}")

        with open(SETTINGS_FILE) as file:
            data = yaml.load(file)

        data['enabled_extensions'].append(extension)

        with open(SETTINGS_FILE, 'w') as file:
            yaml.dump(data, file)

        await ctx.send(f"Loaded `{extension}`.")
    except:
        await ctx.send(f"Failed to load `{extension}`.")


@bot.command()
@commands.has_permissions(administrator=True)
async def unload(ctx, extension):
    try:
        bot.unload_extension(f"extensions.{extension}")

        with open(SETTINGS_FILE) as file:
            data = yaml.load(file)

        data['enabled_extensions'].remove(extension)

        with open(SETTINGS_FILE, 'w') as file:
            yaml.dump(data, file)

        await ctx.send(f"Unloaded `{extension}`.")
    except:
        await ctx.send(f"Failed to unload `{extension}`.")


@bot.command()
@commands.has_permissions(administrator=True)
async def reload(ctx, extension):
    bot.reload_extension(f"extensions.{extension}")

    await ctx.send(f"Reloaded `{extension}`.")


@bot.command()
@commands.has_permissions(administrator=True)
async def reloadall(ctx):
    for extension in list(bot.extensions):
        bot.reload_extension(extension)

    await ctx.send("Reloaded all extensions.")


bot.run(BOT_TOKEN)
