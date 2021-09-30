import discord
import tweepy
import re
from discord.ext import tasks
from discord.ext import commands
from dotenv import load_dotenv
from os import getenv

class Covid_Tweet(commands.Cog):
    def __init__(self, bot):

        # Initialize all the query and tweet download variables
        
        # To test this bot more easily, change the
        # handle to an account which you have control of 
        # and make posts which can match/not match the queries
        # to see if the behaviour is as expected.

        self.bot = bot
        self.handle = "NSWHealth"
        self.url = "https://twitter.com/twitter/statuses/"
        self.queries = ["NSW recorded [\d,]+ new",
                        "PUBLIC HEALTH ALERT"]

        load_dotenv()

        # Which channel are we going to send the tweet to.

        # TODO: This could be changed such that a list of channels
        # is stored and an admin can add channels that the 
        # bot should send messages to. 
        self.channel = int(getenv("COVID_CHANNEL_ID"))


        # TODO: Will need to add the following fields 
        # to the .env file after registering for the 
        # twitter API. 

        # TODO: Can also do something similar to bot.py to source 
        # them from settings.YML based on flag. 
        auth = (tweepy.OAuthHandler(getenv("CONSUMER_KEY"), 
                                    getenv("CONSUMER_SECRET")))
        
        auth.set_access_token(getenv("ACCESS_TOKEN"), 
                              getenv("ACCESS_TOKEN_SECRET"))

        self.api = tweepy.API(auth)

        # Gets the last tweet from the user and sets this 
        # to be the starting point. That is, we will only
        # check tweets after this tweet. 
        tweets = self.api.user_timeline(self.handle, count=1)
        self.last_checked = 0;
        if (len(tweets) > 0):
            self.last_checked = tweets[0].id
        
        # Start the repeating task
        self.covid_tweet.start()
    
    # By default runs every 60 seconds. Can be changed to
    # whatever is most approprtiate 
    @tasks.loop(seconds=60)
    async def covid_tweet(self):
        # Fetches tweets since most recent
        tweets = self.api.user_timeline(self.handle, since_id=self.last_checked)
        
        # Tweets are arranged in reverse chronological order so 
        # we loop from the end.     
        for tweet in reversed(tweets):
            # Check if the contents of the tweet matches any of the queries
            if any (re.match(query, tweet.text) for query in self.queries):
                # Send message in channel
                await self.bot.get_channel(self.channel).send(self.url + str(tweet.id))

        # If we didn't fetch any new tweets,  we do not need 
        # to update the most recent tweet.
        if len(tweets) > 0:
            self.last_checked = tweets[0].id

def setup(bot):
    bot.add_cog(Covid_Tweet(bot))