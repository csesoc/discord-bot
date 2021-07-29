import discord
from discord.errors import Forbidden, HTTPException, NotFound
from discord.ext import commands

import asyncio
from discord.ext.commands.core import command
from discord.ext.commands.errors import MemberNotFound
from ruamel.yaml import YAML
from lib.discordscroll.discordscroll import DiscordScrollHandler

import sys
import csv
from io import StringIO

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

        self.settings_file = './data/config/roles.yml'

        # Load settings file and set variables
        with open(self.settings_file) as file:
            settings = yaml.load(file)

        self.role_channel_id = settings['role_channel_id']
        self.role_log_channel_id = settings['role_log_channel_id']
        self.allowedroles = settings['allowed_roles']

        scroll_ttl = 60  # The time in seconds that a scroll will work
        self.scroll_handler = DiscordScrollHandler(scroll_ttl)

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.channel.id != self.role_channel_id:
            return

        # This is extremely scuffed but it sorta works
        await asyncio.sleep(5)
        try:
            await message.delete()
        except:
            pass

    @commands.command()
    async def give(self, ctx, *role_names):
        if ctx.message.channel.id != self.role_channel_id:
            return

        user = ctx.message.author
        log_channel = self.bot.get_channel(self.role_log_channel_id)
        success = True

        for role_name in role_names[:3]:
            role = discord.utils.find(lambda r: r.name.lower() == role_name.lower(), ctx.guild.roles)

            role_name = role_name.replace('`', '')

            if role is None:
                await ctx.send(f"❌ Failed to give `{role_name}` to `{user}`. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`.", delete_after=2)
                await log_channel.send(f"❌ Failed to give `{role_name}` to `{user}` (role missing or invalid).")
                success = False
            elif role in user.roles:
                await ctx.send(f"❌ Failed to give `{role_name}` to `{user}`. You already have this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to give `{role_name}` to `{user}` (user already has role).")
                success = False
            elif role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ Failed to give `{role_name}` to `{user}`. You do not have permission to give yourself this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to give `{role_name}` to `{user}` (role not on whitelist).")
                success = False
            else:
                await user.add_roles(role)
                await ctx.send(f"✅ Gave `{role_name}` to `{user}`.", delete_after=2)
                await log_channel.send(f"✅ Gave `{role_name}` to `{user}`.")

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

        for role_name in role_names[:3]:
            role = discord.utils.find(lambda r: r.name.lower() == role_name.lower(), ctx.guild.roles)

            role_name = role_name.replace('`', '')

            if role is None:
                await ctx.send(f"❌ Failed to remove `{role_name}` from `{user}`. Please make sure your course code matches exactly e.g. `COMP1511` not `COMP 1511`.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove `{role_name}` from `{user}` (role missing or invalid).")
                success = False
            elif role not in user.roles:
                await ctx.send(f"❌ Failed to remove `{role_name}` from `{user}`. You do not have this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove `{role_name}` from `{user}` (user does not have role).")
                success = False
            elif role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ Failed to remove `{role_name}` from `{user}`. You do not have permission to remove this role.", delete_after=2)
                await log_channel.send(f"❌ Failed to remove `{role_name}` from `{user}` (role not on whitelist).")
                success = False
            else:
                await user.remove_roles(role)
                await ctx.send(f"✅ Removed `{role_name}` from `{user}`.", delete_after=2)
                await log_channel.send(f"✅ Removed `{role_name}` from `{user}`.")

        if success:
            await ctx.message.add_reaction("👍")

        await asyncio.sleep(2.5)
        await ctx.message.delete()

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrole(self, ctx):
        self.role_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.role_channel_id}> as role channel.")
        
        with open(self.settings_file) as file:
            data = yaml.load(file)

        data['role_channel_id'] = ctx.channel.id

        with open(self.settings_file, 'w') as file:
            yaml.dump(data, file)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setrolelog(self, ctx):
        self.role_log_channel_id = ctx.channel.id
        await ctx.send(f"Set <#{self.role_log_channel_id}> as default role log channel.")

        with open(self.settings_file) as file:
            data = yaml.load(file)

        data['role_log_channel_id'] = ctx.channel.id

        with open(self.settings_file, 'w') as file:
            yaml.dump(data, file)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def whitelist(self, ctx, *role_names):
        if len(role_names) == 0:
            await ctx.send(f"Usage: `{self.bot.command_prefix}whitelist [role1] [role2] ...`")
            return

        for role_name in role_names:
            if role_name.lower() in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ `{role_name}` is already on the whitelist.")
            else:
                self.allowedroles.append(role_name)

                with open(self.settings_file) as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].append(role_name)

                with open(self.settings_file, 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f"✅ Added `{role_name}` to the whitelist.")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def blacklist(self, ctx, *role_names):
        if len(role_names) == 0:
            await ctx.send(f"Usage: `{self.bot.command_prefix}blacklist [role1] [role2] ...`")
            return

        for role_name in role_names:
            if role_name.lower() not in (role.lower() for role in self.allowedroles):
                await ctx.send(f"❌ `{role_name}` is not currently on the whitelist.")
            else:
                self.allowedroles.remove(role_name)

                with open(self.settings_file) as file:
                    role_data = yaml.load(file)

                role_data['allowed_roles'].remove(role_name)

                with open(self.settings_file, 'w') as file:
                    yaml.dump(role_data, file)

                await ctx.send(f"✅ Removed `{role_name}` from the whitelist.")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def allowedroles(self, ctx):
        if not self.allowedroles:
            await ctx.send(f"No roles are currently allowed")
            return

        title = "Allowed Roles"
        pages = ['\n'.join(self.allowedroles[i:i+10]) for i in range(0,len(self.allowedroles),10)]

        await self.scroll_handler.new(ctx, pages, title)

    @commands.Cog.listener()
    async def on_reaction_add(self, reaction, user):
        await self.scroll_handler.handle_reaction(reaction, user)

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def listallroles(self, ctx):
        await ctx.send("```" + ('\n'.join(role.name for role in ctx.guild.roles)) + "```")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def countmembers(self, ctx, *, role_name = None):
        if role_name is None:
            await ctx.send(f"Usage: `{self.bot.command_prefix}countmembers [role]`")
            return

        role = discord.utils.find(lambda r: r.name.lower() == role_name.lower(), ctx.guild.roles)

        if role is None:
            await ctx.send(f"`{role_name}` was not found. Please make sure the spelling is correct.")
        else:
            await ctx.send(f"`{role_name}` has {len(role.members)} members.")

    @commands.command()
    @commands.has_permissions(administrator=True)
    async def removeunverified(self, ctx):
        # This is Shrey's code don't @ me
        i = 0
        for member in ctx.guild.members:
            if discord.utils.get(member.roles, name = 'unverified' ):
                i += 1
                await member.send(content = "You have been removed from the CSESoc Server - as you have not verified via the instructions in #welcome")
                await member.kick(reason = "You have been removed from the CSESoc Server - as you have not verified via the instructions in #welcome")
        
        await ctx.send(f"Removed {i} unverified members")
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def bulkgive(self, ctx, *role_names):
        if len(role_names) == 0 or len(ctx.message.attachments) == 0:
            await ctx.send(f"Usage: `{self.bot.command_prefix}bulkgive [role1] [role2] ... `, attaching a file of discordname#number or IDs")
            return
        
        await ctx.channel.trigger_typing() # Operation may take a bit
        
        members = set()
        failed_member_lookups = []
        for attachment in ctx.message.attachments:
            uploaded = None
            try:
                uploaded = await attachment.read()
            except HTTPException or Forbidden or NotFound:
                await ctx.send(f"Could not read attachment {attachment.filename}, cancelling operation.")
                continue

            encoded_users = []

            decoded = uploaded.decode(sys.getdefaultencoding()) # Could be just utf-8 if this causes issues

            if attachment.filename.endswith('.csv'):
                reader = csv.reader(StringIO(decoded))
                for row in reader:
                    encoded_users.extend(row)
            else:
                encoded_users = decoded.split("\n")

            for encoded_user in encoded_users:
                encoded_user = encoded_user.strip() # Remove whitespace
                if not encoded_user: # String is empty
                    continue
                try:
                    member = await commands.MemberConverter().convert(ctx, encoded_user)
                    members.add(member)
                except MemberNotFound:
                    failed_member_lookups.append(encoded_user)
        
        failed_role_lookups = []
        roles = set()
        for role_name in role_names:
            role = discord.utils.find(lambda r: r.name.lower() == role_name.lower(), ctx.guild.roles)
            if role is None:
                failed_role_lookups.append(role_name)
                continue
            roles.add(role)
        
        for member in members:
            await member.add_roles(*roles, reason=f"Bulk give operation by {ctx.message.author.id} ({ctx.message.author.name}))")
        
        reply = "```Bulk give complete\n"
        reply += f"Added {len(roles)} roles to {len(members)} members.\n\n"
        reply += f"Failed member lookups: {len(failed_member_lookups)}\n"
        for failed in failed_member_lookups:
            reply += failed + "\n"
        reply += f"Failed role lookups: {len(failed_role_lookups)}\n"
        for failed in failed_role_lookups:
            reply += failed + "\n"
        reply += "```"

        await ctx.message.reply(reply)

def setup(bot):
    bot.add_cog(Roles(bot))
