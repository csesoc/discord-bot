from discord.ext import commands
from discord import Embed, Color
import random
import json

class vote(commands.Cog):
    """Handles all the voting related commands in any channel that the Bot has access to.
    
    Notes
    -----
    There are three major commands - 
        1. vote - This command starts a vote on a specific text given by the user
        2. voteresult/voteresultfull - This command gives the result of the last poll done on that channel
        3. voteremove
    """
    def __init__(self,bot):
        self.bot = bot
        try:
            with open("extensions/data_votes.json", 'r') as f:
                self.data_vote = json.load(f)
        except:
            self.data_vote = []

    @commands.command(brief = 'This command is used to start a vote', description = 'Call this command with a vote string. Ex: [vote_command] Does pineapple belong on a pizza? ')
    async def vote(self,ctx, *message_data):

        # Checking the length of the vote string
        if len(message_data) == 0:
        
            await ctx.send("Please enter a valid vote string")
            return
        
        else:
            # Creating the vote string
            vote_string = ' '.join(message_data)
            vote_author = ctx.message.author
            vote_author_name = vote_author.name
            vote_author_id = vote_author.id
            message_text = f"{vote_string}, vote by {vote_author_name}"
            
            # Send this vote to a channel
            # We can use ctx.send but this is done if in the future we need to create a different channel for the votes
            message_sent = await ctx.send(message_text)

            # To store the vote in the system
            temp= {
                'user_id': int(vote_author_id),
                'message_id': int(message_sent.id),
                'channel_id': int(ctx.channel.id),
            }
        
            self.data_vote.append(temp)
            self.save_data()
            await message_sent.add_reaction('👍')
            await message_sent.add_reaction('👎')

    @commands.command(brief = 'This command is used to see the result of a vote done by the user', description = 'If this command is called with any parameter, \
        it will show the results of all the votes done by the user. Alternatively, you can pass a message id to see a specific result')
    async def voteresult(self, ctx, message_id = None):
        
        #Retrieving the vote using a message id
        if message_id is not None:
            
            try:
                message_id = int(message_id)
                msg = await ctx.fetch_message(message_id)
                await self.utility_voteresult(ctx, msg)
                
            except:
                await ctx.send("Enter a valid message id")
        
        # If the command was sent by sending a reply to a poll, then gives the result of that vote.
        elif message_id is None and ctx.message.reference is not None:
            message_id = int(ctx.message.reference.message_id)
            msg = await ctx.fetch_message(message_id)
            await self.utility_voteresultfull(ctx, msg)

        # Get the result of the last vote done on the channel
        else:

            # Retrieving the vote from the stored data
            for i in reversed(self.data_vote):

                if i['channel_id'] == int(ctx.channel.id):
                    msg = await ctx.fetch_message(i['message_id'])
                    await self.utility_voteresult(ctx, msg)
                    return

            await ctx.send("There has been no polls in this channel")

    
    @commands.command(brief = 'This command is used to remove a vote that was started by the user.', description = 'Calling this command without any parameter, it will return the message ids of all the votes done by the user. Then the user can delete a specific vote.')
    async def removevote(self,ctx, message_id = None):
        
        # If the command was invoked using a reply to a vote, delete that vote
        if message_id is None and ctx.message.reference is not None:
            try:
                #Retrieving the message with message_id
                message_id = int(ctx.message.reference.message_id)
                msg = await ctx.fetch_message(message_id)

                #Finding the vote that needs to be deleted
                for i in self.data_vote:
                    if i['message_id'] == message_id and i['user_id'] == ctx.message.author.id :
                        
                        await ctx.send(f"Deleting vote - {msg.content}")
                        await msg.delete()
                        self.data_vote.remove(i)
                        self.save_data()
                        return
                await ctx.send("You can only delete your votes")

            except:
                await ctx.send("This is not a vote")
        
        # Getting the message ids of all the votes done by the user calling this command
        elif message_id is None:

            #await ctx.send("These are the votes started by you. Use the message_id to remove a vote. Ex: .remove message_id ")
            author_id = ctx.message.author.id
            vote_strings = []
            message_ids = []
            # Finding the votes done by the user
            for i in self.data_vote:

                # Need to check that the author id is same and the vote has not been deleted
                if i['user_id'] == int(author_id) and i['channel_id'] == int(ctx.channel.id):
                
                    msg = await ctx.fetch_message(i['message_id'])
                    vote_strings.append(msg.content)
                    message_ids.append(str(i['message_id']))
            embed_send = self.send_vote_message_ids(ctx.author.name, vote_strings, message_ids)
            await ctx.send(embed = embed_send)
        
        else:
            try:
                #Retrieving the message with message_id
                message_id = int(message_id)
                msg = await ctx.fetch_message(message_id)

                #Finding the vote that needs to be deleted
                for i in self.data_vote:
                    if i['message_id'] == message_id and i['user_id'] == ctx.message.author.id :
                        
                        await ctx.send(f"Deleting vote - {msg.content}")
                        await msg.delete()
                        self.data_vote.remove(i)
                        self.save_data()
                        return
                await ctx.send("You can only delete your votes :)")

            except:

                await ctx.send("Enter a valid message id")

    @commands.command(brief = 'This command is like voteresult but it also returns the name of the users who reacted.', description = 'If this command is called with any parameter, \
        it will show the results of all the votes done by the user. Alternatively, you can pass a message id to see a specific result')
    async def voteresultfull(self, ctx, message_id = None):
        
        # Retreiving the vote using the message_id from that channel
        if message_id is not None:
            try:
                message_id = int(message_id)
                msg = await ctx.fetch_message(message_id)
                await self.utility_voteresultfull(ctx, msg)
            except:
                await ctx.send("Enter a valid message id")
        
        # If the message id is not given, return the list of all the users who reacted on the last poll done on the channel.
        else:
            for i in reversed(self.data_vote):
                if i['channel_id'] == int(ctx.channel.id):
                    msg = await ctx.fetch_message(i['message_id'])
                    await self.utility_voteresultfull(ctx,msg)
                    return
    
    async def utility_voteresultfull(self,ctx,msg):

        #Getting the message content and reactions
        message_text = msg.content
        message_reactions = msg.reactions


        #Storing the users to reacted to the message
        positive_string = ' '
        negative_string = ' '
        
        #Counting both the reactions
        for i in message_reactions:
        
            # For positive reaction
            if(i.emoji == '👍'):
                
                positive_users = await i.users().flatten()
                positive_users_temp = [x.name for x in positive_users if x.name != self.bot.user.name]
                positive_string = '\n'.join(positive_users_temp)

            # For negative reaction
            elif(i.emoji == '👎'):
                
                negative_users = await i.users().flatten()
                negative_users_temp = [x.name for x in negative_users if x.name != self.bot.user.name]
                negative_string = '\n'.join(negative_users_temp)
        
        embed_send = self.send_vote_message_users(message_text,positive_string, negative_string)
        await ctx.send(embed = embed_send)

    async def utility_voteresult(self,ctx,msg):
        
        #Getting the message content and reactions
        message_text = msg.content
        message_reactions = msg.reactions

        # Keeping the count of reactions
        count_positive = 0
        count_negative = 0

        for i in message_reactions:
            if(i.emoji == '👍'):
                count_positive = i.count -1
            elif(i.emoji == '👎'):
                count_negative = i.count -1
        embed_send = self.send_vote_message(message_text,count_positive,count_negative)
        await ctx.send(embed = embed_send)

    def send_vote_message(self, vote_string, thumbsup_count, thumbsdown_count):
        # Creating an embed to send the result in a pretty manner
        embed = Embed(
                title = vote_string,
                colour = Color(int(hex(random.randint(1, 16581374)), 16))
            )
        embed.add_field(name = '👍', value = f'{thumbsup_count}', inline=True)
        embed.add_field(name = '👎', value = f'{thumbsdown_count}', inline=True)
        return embed
    
    def send_vote_message_users(self, vote_string, users_up, users_down):
        # Creating an embed to send the result in a pretty manner with the users list
        embed = Embed(
                title = vote_string,
                colour = Color(int(hex(random.randint(1, 16581374)), 16))
            )
        if users_up == '':
            users_up = "None"
        if users_down == '':
            users_down = "None"
        embed.add_field(name = '👍:Users', value = users_up)
        embed.add_field(name = '👎:Users', value = users_down)
        return embed
    
    def send_vote_message_ids(self, user_name, vote_strings, message_ids):
        # Creating an embed to send the result in a pretty manner with the users list
        embed = Embed(
                title = user_name,
                colour = Color(int(hex(random.randint(1, 16581374)), 16))
            )
        if vote_strings == [] or message_ids == []:
            embed.description = 'No votes found'
            return embed
        vote_strings_temp= '\n'.join(vote_strings)
        message_ids_temp = '\n'.join(message_ids)

        embed.add_field(name = 'Votes', value = vote_strings_temp)
        embed.add_field(name = 'Message_ids', value = message_ids_temp)
        return embed
    
    def save_data(self):
        with open("extensions/data_votes.json", 'w') as f:
            json.dump(self.data_vote, f, indent=2)
    
    def load_data(self):
        with open("extensions/data_votes.json", 'r') as f:
            self.data_vote = json.load(f)

            
        


def setup(bot):
    bot.add_cog(vote(bot))
