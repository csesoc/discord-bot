import discord
from discord.ext import commands

import re
import requests
from datetime import datetime
from bs4 import BeautifulSoup

API_URL = "https://handbook.insou.dev/api/v1/course/"
HANDBOOK_URL = "https://www.handbook.unsw.edu.au/undergraduate/courses/2021/"


class Handbook(commands.Cog):
    """Provides commands to view information from the UNSW Handbook"""

    def __init__(self, bot):
        self.bot = bot

    @commands.command(brief="Displays information about a course")
    async def courseinfo(self, ctx, course_code):
        course_code = course_code.upper()

        response = requests.get(f"{API_URL}{course_code}")
        if not response.ok:
            return await ctx.send("Invalid course code.")

        data = response.json()

        course_info = discord.Embed(
            title=data["title"],
            url=f"{HANDBOOK_URL}{course_code}",
            colour=0x3A76F8,
            timestamp=datetime.utcnow(),
        )

        course_info.set_author(
            name=f"Course Info: {course_code} ({data['credit_points']} UOC)",
            icon_url="https://i.imgur.com/EE3Q40V.png",
        )

        overview_text = BeautifulSoup(
            data["description"].split("\n")[0], "html.parser"
        ).get_text()
        course_info.add_field(name="Overview", value=overview_text, inline=False)

        if data["enrolment_requirements"]:
            enrolment_requirements_text = re.sub(
                "[A-Z]{4}[0-9]{4}",
                f"[\g<0>]({HANDBOOK_URL}\g<0>)",
                data["enrolment_requirements"],
            )
        else:
            enrolment_requirements_text = "None"
        course_info.add_field(
            name="Enrolment Requirements", value=enrolment_requirements_text
        )

        offering_terms_text = data["offering_terms"]
        course_info.add_field(name="Offering Terms", value=offering_terms_text)

        delivery_mode_text = data["delivery_mode"]
        course_info.add_field(name="Delivery Mode", value=delivery_mode_text)

        if data["equivalent_courses"]:
            equivalent_courses_text = ", ".join(
                f"[{course}]({HANDBOOK_URL}{course})"
                for course in data["equivalent_courses"]
            )
        else:
            equivalent_courses_text = "None"
        course_info.add_field(name="Equivalent Courses", value=equivalent_courses_text)

        if data["exclusion_courses"]:
            exclusion_courses_text = ", ".join(
                f"[{course}]({HANDBOOK_URL}{course})"
                for course in data["exclusion_courses"]
            )
        else:
            exclusion_courses_text = "None"
        course_info.add_field(name="Exclusion Courses", value=exclusion_courses_text)

        course_outline_text = (
            f"[{course_code} Course Outline]({data['course_outline_url']})"
        )
        course_info.add_field(name="Course Outline", value=course_outline_text)

        course_info.set_footer(text="Data fetched from Zac's Handbook API")

        await ctx.send(embed=course_info)


def setup(bot):
    bot.add_cog(Handbook(bot))
