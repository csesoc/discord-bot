// @ts-check
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Client, TextChannel, ButtonInteraction, MessageComponentInteraction } from "discord.js";
// @ts-ignore  
import cron from "node-cron";
import lunchBuddyLocations from "../data/lunch_buddy_locations.json";
import config from "../config/lunch_buddy.json";

const maxRowButtons = 4;
const areaButtonCustomId = "AreaButton";
const locationButtonCustomId = "LocationButton";

const voteOriginId = config.voteOriginId;
const threadDestinationId = config.threadDestinationId;
const interactionTimeout = config.interactionTimeout;
const cronString = config.cronString;

const generalAreaInfo =
    "This lunch buddy vote commenced at 10am, you must vote for the area by 11am. A location vote will run afterwards until 12pm.";
const generalLocationInfo =
    "This lunch buddy vote commenced at 10am, you must vote for the location by 12pm, when one will be chosen.";

interface LunchBuddyArea {
    value: string,
    sub: LunchBuddyLocation[]
}

interface LunchBuddyLocation {
    name: string
}
interface Votes {
    [key: string]: string[]
}

const getLocations = (area: string) => {
    for (const object of lunchBuddyLocations) {
        if (object.value === area) {
            return object;
        }
    }
    return undefined;
};

const generateAreasEmbed = (areaVotes: Votes) => {
    const areas = lunchBuddyLocations.map(
        (element: LunchBuddyArea) => `${element.value}: ${areaVotes?.[element.value]?.length ?? 0}`,
    );
    areas.push(`Any: ${areaVotes?.["Any"]?.length ?? 0}`);
    return new EmbedBuilder()
        .setTitle("Meetup Area Selection")
        .setColor(0x0099ff)
        .setDescription("Please select an option below to vote for that area!")
        .setFields(
            {
                name: "Info",
                value: generalAreaInfo,
            },
            {
                name: "Options",
                value: areas.join("\n"),
            },
        );
};

const generateLocationsEmbed = (area: string, votes: Votes) => {
    const locationData = getLocations(area);
    if (!locationData) return;

    const locations = locationData.sub.map(
        (element: LunchBuddyLocation) => `${element.name}: ${votes[element.name]?.length ?? 0}`,
    );
    locations.push(`Any: ${votes["Any"]?.length ?? 0}`);
    return new EmbedBuilder()
        .setTitle(`Meetup Location Selection - ${area}`)
        .setColor(0x0099ff)
        .setDescription("Please select an option below to vote for that location!")
        .setFields(
            {
                name: "Info",
                value: generalLocationInfo,
            },
            {
                name: "Options",
                value: locations.join("\n"),
            },
        );
};

const areasList = lunchBuddyLocations.map((element: LunchBuddyArea) => element.value);
areasList.push("Any");
const areasButtons = lunchBuddyLocations.map(
    (element: LunchBuddyArea) =>
        new ButtonBuilder({
            style: ButtonStyle.Primary,
            label: element.value,
            customId: `${element.value}${areaButtonCustomId}`,
        }),
);
areasButtons.push(
    new ButtonBuilder({
        style: ButtonStyle.Primary,
        label: "Surprise Me!",
        customId: `Any${areaButtonCustomId}`,
    }),
);
areasButtons.push(
    new ButtonBuilder({
        style: ButtonStyle.Danger,
        label: "Remove Vote",
        customId: `Remove${areaButtonCustomId}`,
    }),
);
const areasButtonsIds = lunchBuddyLocations.map(
    (element: LunchBuddyArea) => `${element.value}${areaButtonCustomId}`,
);
areasButtonsIds.push(`Any${areaButtonCustomId}`);
areasButtonsIds.push(`Remove${areaButtonCustomId}`);
const areasActionRows: ActionRowBuilder<ButtonBuilder>[] = [];
for (let i = 0; i < areasButtons.length; i += maxRowButtons) {
    areasActionRows.push(
        new ActionRowBuilder<ButtonBuilder>({ components: areasButtons.slice(i, i + maxRowButtons) }),
    );
}

const areasButtonsFilter = (resInteraction: MessageComponentInteraction) => {
    return resInteraction.isButton() && areasButtonsIds.includes(resInteraction.customId);
};

const getVoteOption = (userId: string, votes: Votes) => {
    for (const option of Object.keys(votes)) {
        if (votes[option]?.includes(userId)) {
            return option;
        }
    }
    return undefined;
};

const getMostVoted = (votes: Votes) => {
    let maxValue = 0;
    let results: string[] = [];

    // Where only "Any" votes are present, all options will be returned as their
    // vote length equals the maxValue variable of 0
    for (const option of Object.keys(votes)) {
        if (option == "Any") continue;

        const optionVotes = votes[option]?.length ?? 0;
        if (optionVotes > maxValue) {
            maxValue = optionVotes;
            results = [option];
        } else if (optionVotes === maxValue) {
            results.push(option);
        }
    }

    return results;
};

module.exports = {
    name: "ready",
    once: true,
    execute(client: Client) {
        // Quick return if any config is not setup
        if (!voteOriginId || !threadDestinationId || !interactionTimeout || !cronString) {
            return;
        }

        cron.schedule(cronString, async () => {
            let locationData: LunchBuddyArea;
            let selectedArea: string;
            let selectedLocation: string;
            const areaVotes: Votes = {};
            const locationVotes: Votes = {};

            const conductAreaVote = async () => {
                // Setup for voting
                areasList.forEach((area: string) => (areaVotes[area] = []));

                // Fetch channel object and send voting message
                const voteChannel = await client.channels.fetch(voteOriginId);

                if (!voteChannel) return;

                const areaMessage = await (voteChannel as TextChannel).send({
                    embeds: [generateAreasEmbed(areaVotes)],
                    components: areasActionRows,
                });

                // Setup receiving message interactions
                const areaCollector = areaMessage.createMessageComponentCollector({
                    filter: areasButtonsFilter,
                    time: interactionTimeout,
                    idle: interactionTimeout,
                });

                areaCollector.on("collect", async (interaction: ButtonInteraction) => {
                    const interactorId = String(interaction.user.id);
                    const priorVoteOption = getVoteOption(interactorId, areaVotes);
                    const newOption = interaction.customId.replace(areaButtonCustomId, "");

                    let newVoteString = ` voted for ${newOption}!`;
                    let oldVoteString = "";

                    // Checks whether voter has previously cast vote and edits accordingly
                    if (priorVoteOption) {
                        if (priorVoteOption === newOption) {
                            interaction.reply({
                                content: "You have already voted for this option.",
                                ephemeral: true,
                            });
                            return;
                        }
                        // Removes previously cast vote
                        const location = areaVotes[priorVoteOption]?.indexOf(interactorId);
                        if (!location) return;

                        areaVotes[priorVoteOption]?.splice(location, 1);

                        if (newOption === "Remove") {
                            newVoteString = " removed your vote.";
                        } else {
                            oldVoteString = ` removed your vote for ${priorVoteOption} and`;
                        }
                    } else if (newOption === "Remove") {
                        newVoteString = " no vote to remove.";
                    }

                    const voteString = `You have${oldVoteString}${newVoteString}`;

                    // Appends new vote if cast
                    if (newOption !== "Remove") {
                        areaVotes[newOption]?.push(interactorId);
                    }

                    interaction.reply({ content: voteString, ephemeral: true });
                    areaMessage.edit({ embeds: [generateAreasEmbed(areaVotes)] });
                });

                areaCollector.on("end", async () => {
                    // Removes options to vote for area
                    await areaMessage.edit({ components: [] });

                    let areaInfo;

                    // Finds the highest voted option, and randomises for ties
                    const mostVoted = getMostVoted(areaVotes);

                    if (mostVoted.length > 1) {
                        selectedArea = (mostVoted[Math.floor(Math.random() * mostVoted.length)] as string);
                        areaInfo = `Several options had the highest votes, and the area ${selectedArea} was randomly selected from the tied options.`;
                    } else {
                        selectedArea = (mostVoted[0] as string);
                        areaInfo = `The area ${selectedArea} had the highest votes.`;
                    }

                    if (areaVotes[selectedArea]?.length || areaVotes["Any"]?.length) {
                        await areaMessage.reply(areaInfo);

                        const locationResults = getLocations(selectedArea)
                        if (!locationResults) return;

                        locationData = locationResults;
                        await conductLocationVote();
                    } else {
                        await areaMessage.reply("No votes were cast for the area.");
                    }
                });
            };

            const conductLocationVote = async () => {
                const locationsList = locationData.sub.map((element) => element.name);
                locationsList.push("Any");

                // Fetch channel and prepare voting message

                const voteChannel = await client.channels.fetch(voteOriginId);

                if (!voteChannel) return;

                // client.channels.fetch(voteOriginId).then(async (voteChannel) => {
                const locationsButtons = locationData.sub.map(
                    (element) =>
                        new ButtonBuilder({
                            style: ButtonStyle.Primary,
                            label: element.name,
                            customId: `${element.name}${locationButtonCustomId}`,
                        }),
                );
                locationsButtons.push(
                    new ButtonBuilder({
                        style: ButtonStyle.Primary,
                        label: "Surprise Me!",
                        customId: `Any${locationButtonCustomId}`,
                    }),
                );
                locationsButtons.push(
                    new ButtonBuilder({
                        style: ButtonStyle.Danger,
                        label: "Remove Vote",
                        customId: `Remove${locationButtonCustomId}`,
                    }),
                );
                const locationsButtonsIds = locationData.sub.map(
                    (element) => `${element.name}${locationButtonCustomId}`,
                );
                locationsButtonsIds.push(`Any${locationButtonCustomId}`);
                locationsButtonsIds.push(`Remove${locationButtonCustomId}`);
                const locationsActionRows: ActionRowBuilder<ButtonBuilder>[] = [];
                for (let i = 0; i < locationsButtons.length; i += maxRowButtons) {
                    locationsActionRows.push(
                        new ActionRowBuilder<ButtonBuilder>({
                            components: locationsButtons.slice(i, i + maxRowButtons),
                        }),
                    );
                }

                locationsList.forEach((location) => (locationVotes[location] = []));

                const toPing: string[] = [];
                Object.values(areaVotes).forEach((area) => {
                    area.forEach((id: string) => {
                        toPing.push(id);
                    });
                });

                const pingStr = toPing.reduce((str, id) => str + `<@${id}>`, "");

                const newLocationEmbed = generateLocationsEmbed(selectedArea, locationVotes);
                if (!newLocationEmbed) return;

                const locationMessage = await (voteChannel as TextChannel).send({
                    content: pingStr,
                    embeds: [newLocationEmbed],
                    components: locationsActionRows,
                });

                const locationsButtonsFilter = (resInteraction: MessageComponentInteraction) => {
                    return resInteraction.isButton() && locationsButtonsIds.includes(resInteraction.customId);
                };

                // Setup receiving message interactions
                const locationCollector = locationMessage.createMessageComponentCollector({
                    filter: locationsButtonsFilter,
                    time: interactionTimeout,
                    idle: interactionTimeout,
                });

                locationCollector.on("collect", async (interaction: ButtonInteraction) => {
                    const interactorId = String(interaction.user.id);
                    const priorVoteOption = getVoteOption(interactorId, locationVotes);
                    const newOption = interaction.customId.replace(locationButtonCustomId, "");

                    let newVoteString = ` voted for ${newOption}!`;
                    let oldVoteString = "";

                    // Checks whether voter has previously cast vote and edits accordingly
                    if (priorVoteOption) {
                        if (priorVoteOption === newOption) {
                            interaction.reply({
                                content: "You have already voted for this option.",
                                ephemeral: true,
                            });
                            return;
                        }
                        // Removes previously cast vote
                        const location = locationVotes[priorVoteOption]?.indexOf(interactorId);
                        if (!location) return;

                        locationVotes[priorVoteOption]?.splice(location, 1);

                        if (newOption === "Remove") {
                            newVoteString = " removed your vote.";
                        } else {
                            oldVoteString = ` removed your vote for ${priorVoteOption} and`;
                        }
                    } else if (newOption === "Remove") {
                        newVoteString = " no vote to remove.";
                    }

                    const voteString = `You have${oldVoteString}${newVoteString}`;

                    // Appends new vote if cast
                    if (newOption !== "Remove") {
                        locationVotes[newOption]?.push(interactorId);
                    }

                    const newLocationEmbed = generateLocationsEmbed(selectedArea, locationVotes)
                    if (!newLocationEmbed) return;

                    interaction.reply({ content: voteString, ephemeral: true });
                    locationMessage.edit({
                        embeds: [newLocationEmbed],
                    });
                });

                locationCollector.on("end", async () => {
                    // Removes options to vote for location
                    locationMessage.edit({ components: [] });

                    let locationInfo;

                    // Finds the highest voted option, and randomises for ties
                    const mostVotedLocation = getMostVoted(locationVotes);
                    if (mostVotedLocation.length > 1) {
                        selectedLocation =
                            (mostVotedLocation[Math.floor(Math.random() * mostVotedLocation.length)] as string);
                        locationInfo = `Several options had the highest votes, and the location ${selectedLocation} was randomly selected from the tied options.`;
                    } else {
                        selectedLocation = (mostVotedLocation[0] as string);
                        locationInfo = `The location ${selectedLocation} had the highest votes.`;
                    }

                    if (locationVotes[selectedLocation]?.length || locationVotes["Any"]?.length) {
                        await locationMessage.reply(locationInfo);
                        createMeetupThread();
                    } else {
                        await locationMessage.reply("No votes were cast for the location.");
                    }
                });
            };

            const createMeetupThread = () => {
                const dateString = new Date().toLocaleDateString("en-AU");

                client.channels.fetch(threadDestinationId).then(async (channel) => {
                    if (!channel) return;

                    // Creates thread which expires after 1 day
                    const thread = await (channel as TextChannel).threads.create({
                        name: `${dateString} - ${selectedLocation}`,
                        autoArchiveDuration: 1440,
                    });

                    const toAdd: string[] = [];
                    Object.values(areaVotes).forEach((area) => {
                        area.forEach((id: string) => {
                            if (!toAdd.includes(id)) toAdd.push(id);
                        });
                    });
                    Object.values(locationVotes).forEach((location) => {
                        location.forEach((id: string) => {
                            if (!toAdd.includes(id)) toAdd.push(id);
                        });
                    });

                    toAdd.forEach(async (id) => {
                        await thread.members.add(id);
                    });

                    client.channels.fetch(voteOriginId).then(async (originChannel) => {
                        if (!originChannel) return;

                        await (originChannel as TextChannel).send(
                            `Created a thread for today's lunch buddy meet: ${thread}`,
                        );
                    });
                });
            };

            await conductAreaVote();
        });
    },
};
