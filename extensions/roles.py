import discord
from discord.ext import commands

import asyncio
from ruamel.yaml import YAML
from lib.discordscroll.discordscroll import DiscordScrollHandler

yaml = YAML()


class Roles(commands.Cog):
    """Handles role assignment and removal and provides useful admin commands

    All configuration information is stored in roles.yml
    - Role and role log channel IDs
    - Allowed roles whitelist
    Can be modified manually or with commands
    """

    def __init__(self, bot):
        self.bot = bot

        # Load settings file and set variables
        with open('./config/roles.yml') as file:
            settings = yaml.load(file)

        self.role_channel_id = settings['role_channel_id']
        self.role_log_channel_id = settings['role_log_channel_id']
        self.allowedroles = settings['allowed_roles']

        scroll_ttl = 60  # The time in seconds that a scroll will work
        self.scroll_handler = DiscordScrollHandler(scroll_ttl)

    @commands.command()
    async def give(self, ctx, *role_names):
        if ctx.message.channel.id != self.role_channel_id:
            return

        user = ctx.message.author
        log_channel = self.bot.get_channel(self.role_log_channel_id)
        success = True

        for role_name in role_names:
            role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)

            if role is None:
                await ctx.send(f"❌ Failed to give {role_name} to {user}. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`.", delete_after=2)
                await log_channel.send(f"❌ Failed to give {role_name} to {user} (role missing or invalid).")
                success = False
            elif role in user.roles:
                await ctx.send(f"❌ Failed to give {role_name} to {user}. You already have this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to give {role_name} to {user} (user already has role).")
                success = False
            elif role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ Failed to give {role_name} to {user}. You do not have permission to give yourself this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to give {role_name} to {user} (role not on whitelist).")
                success = False
            else:
                await user.add_roles(role)
                await ctx.send(f"✅ Gave {role_name} to {user}.", delete_after=2)
                await log_channel.send(f"✅ Gave {role_name} to {user}.")

        if success:
            await ctx.message.add_reaction("👍")

        await asyncio.sleep(2.5)
        await ctx.message.delete()

    @commands.command()
    async def remove(self, ctx, *role_names):
        if ctx.message.channel.id != self.role_channel_id:
            return

        user = ctx.message.author
        log_channel = self.bot.get_channel(self.role_log_channel_id)
        success = True

        for role_name in role_names:
            role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)

            if role is None:
                await ctx.send(f"❌ Failed to remove {role_name} from {user}. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove {role_name} from {user} (role missing or invalid).")
                success = False
            elif role not in user.roles:
                await ctx.send(f"❌ Failed to remove {role_name} from {user}. You do not have this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove {role_name} from {user} (user does not have role).")
                success = False
            elif role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ Failed to remove {role_name} from {user}. You do not have permission to remove this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove {role_name} from {user} (role not on whitelist).")
                success = False
            else:
                await user.remove_roles(role)
                await ctx.send(f"✅ Removed {role_name} from {user}.", delete_after=2)
                await log_channel.send(f"✅ Removed {role_name} from {user}.")

        if success:
            await ctx.message.add_reaction("👍")

        await asyncio.sleep(2.5)
        await ctx.message.delete()

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrole(self, ctx):
        self.role_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.role_channel_id}> as role channel.")
        
        with open('./config/roles.yml') as file:
            data = yaml.load(file)

        data['role_channel_id'] = ctx.channel.id

        with open('./config/roles.yml', 'w') as file:
            yaml.dump(data, file)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrolelog(self, ctx):
        self.role_log_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.role_log_channel_id}> as default role log channel.")

        with open('./config/roles.yml') as file:
            data = yaml.load(file)

        data['role_log_channel_id'] = ctx.channel.id

        with open('./config/roles.yml', 'w') as file:
            yaml.dump(data, file)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def whitelist(self, ctx, *role_names):
        for role_name in role_names:
            if role_name.lower() in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ {role_name} is already on the whitelist.")
            else:
                self.allowedroles.append(role_name)

                with open('./config/roles.yml') as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].append(role_name)

                with open('./config/roles.yml', 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f"✅ Added {role_name} to the whitelist.")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def blacklist(self, ctx, *role_names):
        for role_name in role_names:
            if role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ {role_name} is not currently on the whitelist.")
            else:
                self.allowedroles.remove(role_name)

                with open('./config/roles.yml') as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].remove(role_name)

                with open('./config/roles.yml', 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f"✅ Removed {role_name} from the whitelist.")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def allowedroles(self, ctx):
        title = "Allowed Roles"
        pages = ['\n'.join(self.allowedroles[i:i+10]) for i in range(0,len(self.allowedroles),10)]

        await self.scroll_handler.new(ctx, pages, title)

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def countmembers(self, ctx, *, role_name):
        role = discord.utils.find(lambda r: role_name.lower() == r.name.lower(), ctx.guild.roles)

        if role is None:
            await ctx.send(f"`{role_name}` was not found. Please make sure the spelling is correct.")
        else:
            await ctx.send(f"`{role_name}` has {len(role.members)} members.")


def setup(bot):
    bot.add_cog(Roles(bot))
