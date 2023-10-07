const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const cron = require("node-cron");
const lunchBuddyLocations = require("../data/lunch_buddy_locations");

const maxRowButtons = 4;
const areaButtonCustomId = "AreaButton";
const locationButtonCustomId = "LocationButton";
const interactionTimeout = 10000;
const voteOriginId = "959995388289495050";
const threadDestinationId = "959995388289495050";

const generalAreaInfo =
    "This lunch buddy vote commenced at 10am, you must vote for the area by 11am. A location vote will run afterwards until 12pm.";
const generalLocationInfo =
    "This lunch buddy vote commenced at 10am, you must vote for the location by 12pm, when one will be chosen.";

const getLocations = (area) => {
    for (const object of lunchBuddyLocations.locations) {
        if (object.value === area) {
            return object;
        }
    }
    return undefined;
};

const generateAreasEmbed = (areaVotes = undefined) => {
    const areas = lunchBuddyLocations.locations.map(
        (element) => `${element.value}: ${areaVotes ? areaVotes[element.value].length : 0}`,
    );
    areas.push(`Any: ${areaVotes ? areaVotes["Any"].length : 0}`);
    return new MessageEmbed()
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

const generateLocationsEmbed = (area, votes = undefined) => {
    const locationData = getLocations(area);
    const locations = locationData.sub.map(
        (element) => `${element.name}: ${votes ? votes[element.name].length : 0}`,
    );
    locations.push(`Any: ${votes ? votes["Any"].length : 0}`);
    return new MessageEmbed()
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

const areasList = lunchBuddyLocations.locations.map((element) => element.value);
areasList.push("Any");
const areasButtons = lunchBuddyLocations.locations.map(
    (element) =>
        new MessageButton({
            style: "PRIMARY",
            label: element.value,
            customId: `${element.value}${areaButtonCustomId}`,
        }),
);
areasButtons.push(
    new MessageButton({
        style: "PRIMARY",
        label: "Surprise Me!",
        customId: `Any${areaButtonCustomId}`,
    }),
);
areasButtons.push(
    new MessageButton({
        style: "DANGER",
        label: "Remove Vote",
        customId: `Remove${areaButtonCustomId}`,
    }),
);
const areasButtonsIds = lunchBuddyLocations.locations.map(
    (element) => `${element.value}${areaButtonCustomId}`,
);
areasButtonsIds.push(`Any${areaButtonCustomId}`);
areasButtonsIds.push(`Remove${areaButtonCustomId}`);
const areasActionRows = [];
for (let i = 0; i < areasButtons.length; i += maxRowButtons) {
    areasActionRows.push(
        new MessageActionRow({ components: areasButtons.slice(i, i + maxRowButtons) }),
    );
}

const areasButtonsFilter = (resInteraction) => {
    return areasButtonsIds.includes(resInteraction.customId);
};

const getVoteOption = (userId, votes) => {
    for (const option of Object.keys(votes)) {
        if (votes[option].includes(userId)) {
            return option;
        }
    }
    return undefined;
};

const getMostVoted = (votes) => {
    let maxValue = 0;
    let results = [];

    for (const option of Object.keys(votes)) {
        if (option == "Any") continue;

        const optionVotes = votes[option].length;
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
    execute(client) {
        cron.schedule("* * * * *", async () => {
            let locationData;
            let selectedArea;
            let selectedLocation;
            const areaVotes = {};
            const locationVotes = {};

            const conductAreaVote = async () => {
                // Setup for voting
                areasList.forEach((area) => (areaVotes[area] = []));

                // Fetch channel object and send voting message
                const voteChannel = await client.channels.fetch(voteOriginId);

                const areaMessage = await voteChannel.send({
                    embeds: [generateAreasEmbed()],
                    components: areasActionRows,
                });

                // Setup receiving message interactions
                const areaCollector = areaMessage.createMessageComponentCollector({
                    filter: areasButtonsFilter,
                    time: interactionTimeout,
                    idle: interactionTimeout,
                });

                areaCollector.on("collect", async (interaction) => {
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
                        const location = areaVotes[priorVoteOption].indexOf(interactorId);
                        areaVotes[priorVoteOption].splice(location, 1);

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
                        areaVotes[newOption].push(interactorId);
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

                    if (mostVoted.length !== 1) {
                        selectedArea = mostVoted[Math.floor(Math.random() * mostVoted.length)];
                        areaInfo = `Several options had the highest votes, and the area ${selectedArea} was randomly selected from the tied options.`;
                    } else {
                        selectedArea = mostVoted[0];
                        areaInfo = `The area ${selectedArea} had the highest votes.`;
                    }

                    if (areaVotes[selectedArea].length || areaVotes["Any"].length) {
                        await areaMessage.reply(areaInfo);
                        locationData = getLocations(selectedArea);
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

                // client.channels.fetch(voteOriginId).then(async (voteChannel) => {
                const locationsButtons = locationData.sub.map(
                    (element) =>
                        new MessageButton({
                            style: "PRIMARY",
                            label: element.name,
                            customId: `${element.name}${locationButtonCustomId}`,
                        }),
                );
                locationsButtons.push(
                    new MessageButton({
                        style: "PRIMARY",
                        label: "Surprise Me!",
                        customId: `Any${locationButtonCustomId}`,
                    }),
                );
                locationsButtons.push(
                    new MessageButton({
                        style: "DANGER",
                        label: "Remove Vote",
                        customId: `Remove${locationButtonCustomId}`,
                    }),
                );
                const locationsButtonsIds = locationData.sub.map(
                    (element) => `${element.name}${locationButtonCustomId}`,
                );
                locationsButtonsIds.push(`Any${locationButtonCustomId}`);
                locationsButtonsIds.push(`Remove${locationButtonCustomId}`);
                const locationsActionRows = [];
                for (let i = 0; i < locationsButtons.length; i += maxRowButtons) {
                    locationsActionRows.push(
                        new MessageActionRow({
                            components: locationsButtons.slice(i, i + maxRowButtons),
                        }),
                    );
                }

                locationsList.forEach((location) => (locationVotes[location] = []));

                const toPing = [];
                Object.values(areaVotes).forEach((area) => {
                    area.forEach((id) => {
                        toPing.push(id);
                    });
                });

                const pingStr = toPing.reduce((str, id) => str + `<@${id}>`, "");

                const locationMessage = await voteChannel.send({
                    content: pingStr,
                    embeds: [generateLocationsEmbed(selectedArea)],
                    components: locationsActionRows,
                });

                const locationsButtonsFilter = (resInteraction) => {
                    return locationsButtonsIds.includes(resInteraction.customId);
                };

                // Setup receiving message interactions
                const locationCollector = locationMessage.createMessageComponentCollector({
                    filter: locationsButtonsFilter,
                    time: interactionTimeout,
                    idle: interactionTimeout,
                });

                locationCollector.on("collect", async (interaction) => {
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
                        const location = locationVotes[priorVoteOption].indexOf(interactorId);
                        locationVotes[priorVoteOption].splice(location, 1);

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
                        locationVotes[newOption].push(interactorId);
                    }

                    interaction.reply({ content: voteString, ephemeral: true });
                    locationMessage.edit({
                        embeds: [generateLocationsEmbed(selectedArea, locationVotes)],
                    });
                });

                locationCollector.on("end", async () => {
                    // Removes options to vote for location
                    locationMessage.edit({ components: [] });

                    let locationInfo;

                    // Finds the highest voted option, and randomises for ties
                    const mostVotedLocation = getMostVoted(locationVotes);
                    if (mostVotedLocation.length !== 1) {
                        selectedLocation =
                            mostVotedLocation[Math.floor(Math.random() * mostVotedLocation.length)];
                        locationInfo = `Several options had the highest votes, and the location ${selectedLocation} was randomly selected from the tied options.`;
                    } else {
                        selectedLocation = mostVotedLocation[0];
                        locationInfo = `The location ${selectedLocation} had the highest votes.`;
                    }

                    if (locationVotes[selectedLocation].length || locationVotes["Any"].length) {
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
                    // Creates thread which expires after 1 day
                    const thread = await channel.threads.create({
                        name: `${dateString} - ${selectedLocation}`,
                        autoArchiveDuration: 1440,
                    });

                    const toAdd = [];
                    Object.values(areaVotes).forEach((area) => {
                        area.forEach((id) => {
                            if (!toAdd.includes(id)) toAdd.push(id);
                        });
                    });
                    Object.values(locationVotes).forEach((location) => {
                        location.forEach((id) => {
                            if (!toAdd.includes(id)) toAdd.push(id);
                        });
                    });

                    toAdd.forEach(async (id) => {
                        await thread.members.add(id);
                    });

                    client.channels.fetch(voteOriginId).then(async (threadId) => {
                        await threadId.send(
                            `Created a thread for today's lunch buddy meet: ${thread}`,
                        );
                    });
                });
            };

            await conductAreaVote();
        });
    },
};
