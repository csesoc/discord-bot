const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("project-descriptions")
        .setDescription("Returns a description for each project under CSESoc Development!")
        .addStringOption((option) =>
            option
                .setName("project")
                .setDescription("Which project do you want to be introduced to?")
                .setRequired(true)
                .addChoices([
                    ["Chaos", "chaos"],
                    ["Circles", "circles"],
                    ["Uni-lectives", "unilectives"],
                    ["Discord Bot", "discordbot"],
                    ["Freerooms", "freerooms"],
                    ["Jobsboard", "jobsboard"],
                    ["Notangles", "notangles"],
                    ["Structs.sh", "structs.sh"],
                    ["Trainee Program", "training-program"],
                    ["UI/UX", "ui/ux"],
                    ["CMS", "cms"],
                    ["Website", "website"],
                    ["???", "projects-fair-easter-egg-ctf"],
                ]),
        ),

    async execute(interaction) {
        const parsedOption = interaction.options.get("project").value.toLowerCase();
        // console.log(`.${parsedOption}.`);
        switch (parsedOption) {
            case "chaos":
                await interaction.reply({
                    content: "Chaos is an internal recruitment tool written in Rust. Are you allergic to google sheets and excel? Do you have nightmares from browsing through millions of lines of csv just to pick one applicant to take in? \nIntroducing Chaos, the ultimate lifesaver for clubs and societies! \nSay goodbye to the chaos and hello to simplicity. Chaos streamlines everything, making applications a breeze. \nWith a Rust 🦀 backend, type-safe and secure, no more segfaults and losing data! \nOur minimalistic while aesthetic frontend interface frees your eyes and brains from the repetitive and dull rows and columns of data sheets 📃\n\n<https://chaos.csesoc.app/>",
                    ephemeral: true,
                });
                break;
            case "circles":
                await interaction.reply({
                    content: "Tired of using a poorly laid out spreadsheet to cobble together a course progression plan to follow for the next 3-8 years of your life? Have no fear, Circles is here! \nCircles is a UNSW degree planner where you can explore and validate your degree structure. \nYou can find and use a live build of Circles at <https://circles.csesoc.app/>",
                    ephemeral: true,
                });
                break;
            case "unilectives":
                await interaction.reply({
                    content: "Tired of searching through websites and forum posts to find the perfect course? Only to discover that it's offered once a year? Or perhaps the workload turned out to be completely different from your expectations? \nLook no further, Uni-lectives has got your back. With 1000 unique reviews and counting across a variety of faculties, Uni-lectives is your one stop shop for UNSW courses and electives, where you can access valuable reviews and also contribute your own, empowering others to make informed choices about the courses they enrol in!\n\n<https://unilectives.csesoc.app/>",
                    ephemeral: true,
                });
                break;
            case "discordbot":
                await interaction.reply({
                    content: "Discord Bot is your friendly CSE discord companion on the CSESoc discord server, offering various features such as checking what week it is, explaining what all CSESoc/DevSoc Projects do, the 24 minigame and more to come! \nHere's a sneak peek at coming features: \n\nWeekly Lunch buddy - a speed friending feature for organising and meeting up on-campus each week with like-minded friendly people! \nSydney Trains Delay API - conveniently check if the light rail is down from the comfort of your study room before you get hit with a nasty surprise at Anzac Parade or High Street!",
                    ephemeral: true,
                });
                break;
            case "freerooms":
                await interaction.reply({
                    content: "Freerooms is a tool designed to help UNSW students find empty or unbooked rooms on campus.\n\n🥾Have you ever wandered around campus, searching for an empty study room?🚪 Have you ever wanted to study somewhere other than the weird smelling ASB🏢, the loud corridors of Ainsworth 🏦 or the poorly decorated main library? 📚 \nIf you are a director or exec, have you ever wanted to find a room for your in-person meetings or society event? \nWhether you're in need of a quiet study nook or a large space for your society's next big event, Freerooms has got you covered!\n\n<https://freerooms.staging.csesoc.unsw.edu.au/browse>",
                    ephemeral: true,
                });
                break;
            case "jobsboard":
                await interaction.reply({
                    content: "Are you tired of hearing your friends talk about their exciting summer internship experiences while feeling left out? Fear not, because Jobsboard has got your back so you can wave goodbye to spending your summer working on projects to put on your resume! \nSupported by CSESoc’s strong partnerships with top tech giants in Australia like Atlassian, IMC, Canva and more, you will have immediate access to opportunities from these companies as soon they become available on Jobsboard!\n\n<https://jobsboard.csesoc.unsw.edu.au/>",
                    ephemeral: true,
                });
                break;
            case "notangles":
                await interaction.reply({
                    content: "Class registrations out and you have no clue how your next term is going to pan out? No idea how to come up with a timetable that balances all your classes and social events that you cannot miss? Do not worry! Notangles got your back. \nNotangles is your interactive timetable application, that can help you and your friends plan out a weekly schedule by showing you available classes for your courses and allow you to also slot in recurring events that can not be missed. It can also generate a timetable for you by taking in your preferences. Let there be no more timetable-tangles with Notangles!\n\n<https://notangles.csesoc.app/>",
                    ephemeral: true,
                });
                break;
            case "structs.sh":
                await interaction.reply({
                    content: "Structs.sh is an educational tool for computer science students that visualizes the most fundamental data structures (arrays, linked lists and binary search trees) and algorithms (sorting, searching and traversal). \nThe 2023 team is committed to transforming your educational experience by developing an application never seen before: a visual debugger that lets users type in arbitrary C code for our website to visualize the data structure(s) present in memory.\n\n<https://structs.sh/>",
                    ephemeral: true,
                });
                break;
            case "training-program":
                await interaction.reply({
                    content: "The Training Program is a 1 term crash-course built to train up students new to or interested in web-dev! Every term, we teach the basics of React and JS, then put trainees into groups led by our talented training leads to build a personal project of their own! These personal projects can be anything that you think of, ranging from productivity web apps 📆  to dating apps built just for computer science students 😳. The training program is a place for learning new skills and getting you started on building that new tech idea you've always been thinking about!\n\nCome join today!",
                    ephemeral: true,
                });
                break;
            case "ui/ux":
                await interaction.reply({
                    content: "The CSESoc Development UI/UX team works with all things related to user interface and experience design!",
                    ephemeral: true,
                });
                break;
            case "projects-fair-easter-egg-ctf":
                await interaction.reply({
                    content: "Good job! Ollie's easter egg is levelup{discordbot_and_Ollie}",
                    ephemeral: true,
                });
                break;
            case "cms":
                await interaction.reply({
                    content: "Each year CSESoc creates and publishes a number of blogs, articles, and guides dedicated to exploring interesting topics and helping students with their studies. The CMS aims to make creating these documents easier and more efficient by unifying the system used across portfolios. \nThis year the team has focused on developing the fundamental building blocks blog writers may need such as having sections of code within documents. The CMS team continues to evolve the application with the objective of having concurrent editing capabilities.",
                    ephemeral: true,
                });
                break;
            case "website":
                await interaction.reply({
                    content: "Representing the CSE Society, the website showcases the main features of the community and collates all relevant resources in an easily located manner. Decorated with links to portfolios, guides, sponsors, and relevant social media platforms, the website allows all students to quickly navigate to the service they require.\n\n<https://www.csesoc.unsw.edu.au/>",
                    ephemeral: true,
                });
                break;
            default:
                await interaction.reply({
                    content: "Error: the switch case has fallen through to the default case.",
                    ephemeral: true,
                });
                break;
        }
    },
};
