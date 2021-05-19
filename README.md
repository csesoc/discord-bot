### Pre-requisites
- Python 3.8 or higher
- Discord.py
- Discord authentication setup

## Installing Discord.py
You can get the library directly from PyPI:
```python3 -m pip install -U discord.py```

If you are using Windows, then the following should be used instead:
`py -3 -m pip install -U discord.py`

A full basic setup guide can be found [here](https://discordpy.readthedocs.io/en/stable/intro.html).

## Setting up bot application on Discord
Please head to your Discord developer portal [here](https://discord.com/developers/applications).
Simply choose "New Application", head to "Bot" tab (inside the app settings which you should be redirected to by default) and press "add bot". You can now see a bot application and a button to copy your unique token. This token is the way to access your bot at runtime, and should only be shared with trusted sources. Do not push any code that has your bots unique token to any repository.

To invite your bot to your server, head to the "OAuth2" tab, and in the "scopes" section under "OAuth2 URL Generator", select "bot". Give the bot the permissions you like, or possibly admnistrator. (Take care with this, if a person has access to your token they will also have access to admin privelleges) and copy the URL. Visit the URL and you should be prompted to invite the bot.

## Running a bot instance
Assuming you have valid code for your bot in a .py file, add `client.run('BOTTOKENHERE')` to your file. In the terminal, running the startup file, and you should see your bot come online in your server. Alternatively, an enviroment variable may also be used for the bot token and is the preferred way.
Test