import discord
import tweepy
import re
from discord.ext import tasks
from discord.ext import commands
from dotenv import load_dotenv
from os import getenv

class Covid_Tweet(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.handle = "NSWHealth"
        self.url = "https://twitter.com/twitter/statuses/"
        self.queries = ["NSW recorded [\d,]+ new",
                        "PUBLIC HEALTH ALERT"]

        load_dotenv()

        self.channel = int(getenv("COVID_CHANNEL_ID"))

        auth = (tweepy.OAuthHandler(getenv("CONSUMER_KEY"), 
                getenv("CONSUMER_SECRET")))
        auth.set_access_token(getenv("ACCESS_TOKEN"), 
                              getenv("ACCESS_TOKEN_SECRET"))

        self.api = tweepy.API(auth)

        tweets = self.api.user_timeline(self.handle)
        self.last_checked = 0;
        if (len(tweets) > 0):
            self.last_checked = tweets[0].id
        
        self.covid_tweet.start()
    
    @tasks.loop(seconds=60)
    async def covid_tweet(self):
        tweets = self.api.user_timeline(self.handle, since_id=self.last_checked)
        for tweet in reversed(tweets):
            if any (re.match(query, tweet.text) for query in self.queries):
                await self.bot.get_channel(self.channel).send(self.url + str(tweet.id))

        if len(tweets) > 0:
            self.last_checked = tweets[0].id

def setup(bot):
    bot.add_cog(Covid_Tweet(bot))