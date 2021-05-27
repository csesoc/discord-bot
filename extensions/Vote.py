from discord.ext import commands
import bleach

data_vote = []

class Vote(commands.Cog):
    def __init__(self,bot):
        self.bot = bot

    @commands.command(brief = 'This command is used to start a vote', description = 'Call this command with a vote string. Ex: [vote_command] Does pineapple belong on a pizza? ')
    async def vote(self,ctx, *message_data):

        # Checking the length of the vote string
        if len(message_data) == 0:
        
            await ctx.send("Please enter a valid vote string")
            return
        
        else:

            # Creating the vote string
            vote_string = ' '.join(message_data)
            vote_string = bleach.clean(vote_string)
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
                'deleted':False
            }
        
            data_vote.append(temp)
        
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
        else:
            # Get all the votes done by the user using the author id
            author_id = ctx.message.author.id
            for i in data_vote:
                if i['user_id'] == author_id and i['deleted'] == False:
                    msg = await ctx.fetch_message(i['message_id'])
                    await self.utility_voteresult(ctx, msg)

    
    @commands.command(brief = 'This command is used to remove a vote that was started by the user.', description = 'Calling this command without any parameter, it will return the message ids of all the votes done by the user. Then the user can delete a specific vote.')
    async def removevote(self,ctx, message_id = None):
        
        # Getting the message ids of all the votes done by the user calling this command
        if message_id is None:

            await ctx.send("These are the votes started by you. Use the message_id to remove a vote. Ex: .remove message_id ")
            author_id = ctx.message.author.id

            # Finding the votes done by the user
            for i in data_vote:

                # Need to check that the author id is same and the vote has not been deleted
                if i['user_id'] == int(author_id) and i['deleted'] == False:
                
                    msg = await ctx.fetch_message(i['message_id'])
                    message_text = msg.content
                    temp_string = f"{message_text}\n message_id - {i['message_id']}"
                    await ctx.send(temp_string)
        else:
            try:
                #Retrieving the message with message_id
                message_id = int(message_id)
                msg = await ctx.fetch_message(message_id)

                #Finding the vote that needs to be deleted
                for i in data_vote:
                    if i['message_id'] == message_id and i['user_id'] == ctx.message.author.id and i['deleted'] == False:
                        
                        await ctx.send(f"Deleting vote - {msg.content}")
                        await msg.delete()
                        i['deleted'] = True
                        return

                    elif i['message_id'] == message_id and i['user_id'] == ctx.message.author.id and i['deleted'] == True:
                        
                        await ctx.send("The vote has already been removed")

                await ctx.send("You can only delete your votes :)")

            except:

                await ctx.send("Enter a valid message id")

    @commands.command(brief = 'This command is like voteresult but it also returns the name of the users who reacted.', description = 'If this command is called with any parameter, \
        it will show the results of all the votes done by the user. Alternatively, you can pass a message id to see a specific result')
    async def voteresultfull(self, ctx, message_id = None):
        if message_id is not None:
            try:
                message_id = int(message_id)
                msg = await ctx.fetch_message(message_id)
                await self.utility_voteresultfull(ctx, msg)
            except:
                await ctx.send("Enter a valid message id")
        else:
            author_id = ctx.message.author.id
            for i in data_vote:
                if i['user_id'] == author_id and i['deleted'] == False:
                    msg = await ctx.fetch_message(i['message_id'])
                    await self.utility_voteresultfull(ctx,msg)
    
    async def utility_voteresultfull(self,ctx,msg):

        #Getting the message content and reactions
        message_text = msg.content
        message_reactions = msg.reactions

        #Counting the number of thumbs up and thumbs down
        count_positive = 0
        count_negative = 0

        #Storing the users to reacted to the message
        positive_users = []
        negative_users = []
        
        #Sending the message text to the server
        await ctx.send(message_text)

        #Counting both the reactions
        for i in message_reactions:
            
            if(i.emoji == '👍'):
                count_positive = i.count
                positive_users = await i.users().flatten()
                positive_users_temp = [x.name for x in positive_users]
                temp_string = '\n'.join(positive_users_temp)
                await ctx.send(f"People who reacted 👍: {count_positive}, are: \n {temp_string}")
            elif(i.emoji == '👎'):
                count_negative = i.count
                negative_users = await i.users().flatten()
                negative_users_temp = [x.name for x in negative_users]
                temp_string = '\n'.join(negative_users_temp)
                await ctx.send(f"People who reacted 👎: {count_negative}, are: \n {temp_string}")

    async def utility_voteresult(self,ctx,msg):
        message_text = msg.content
        message_reactions = msg.reactions

        count_positive = 0
        count_negative = 0

        for i in message_reactions:
            if(i.emoji == '👍'):
                count_positive = i.count
            elif(i.emoji == '👎'):
                count_negative = i.count
        temp_string = f'{message_text} \n 👍 : {count_positive} \n\n 👎 : {count_negative}'
        await ctx.send(temp_string)


            
        


def setup(bot):
    bot.add_cog(Vote(bot))