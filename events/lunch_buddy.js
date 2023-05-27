const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const cron = require("node-cron");
const lunchBuddyLocations = require("../data/lunch_buddy_locations");

const maxRowButtons = 4;
const areaButtonCustomId = "AreaButton";
const locationButtonCustomId = "LocationButton";
const interactionTimeout = 10000;
const voteOriginId = "959995388289495050";
const threadDestinationId = "959995388289495050";

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
    return new MessageEmbed()
        .setTitle("Meetup Area Selection")
        .setColor(0x0099ff)
        .setDescription("Please select an option below to vote for that area!")
        .setFields({
            name: "Options",
            value: areas.join("\n"),
        });
};

const generateLocationsEmbed = (area, votes = undefined) => {
    const locationData = getLocations(area);
    const locations = locationData.sub.map(
        (element) => `${element.name}: ${votes ? votes[element.name].length : 0}`,
    );
    return new MessageEmbed()
        .setTitle(`Meetup Location Selection - ${area}`)
        .setColor(0x0099ff)
        .setDescription("Please select an option below to vote for that location!")
        .setFields({
            name: "Options",
            value: locations.join("\n"),
        });
};

const areasList = lunchBuddyLocations.locations.map((element) => element.value);
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
        style: "DANGER",
        label: "Remove Vote",
        customId: `Remove${areaButtonCustomId}`,
    }),
);
const areasButtonsIds = lunchBuddyLocations.locations.map(
    (element) => `${element.value}${areaButtonCustomId}`,
);
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
        cron.schedule("* * * * *", async function () {
            let locationData;
            let selectedArea;
            let selectedLocation;
            const areaVotes = {};

            const conductAreaVote = () => {
                return new Promise(async (resolve, reject) => {
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

                        if (areaVotes[selectedArea].length) {
                            await areaMessage.reply(areaInfo);
                        } else {
                            await areaMessage.reply("No votes were cast for the area.");
                            return;
                        }

                        locationData = getLocations(selectedArea);

                        resolve();
                    });
                });
            };

            const conductLocationVote = () => {
                return new Promise(async (resolve) => {
                    const locationsList = locationData.sub.map((element) => element.name);

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
                            style: "DANGER",
                            label: "Remove Vote",
                            customId: `Remove${locationButtonCustomId}`,
                        }),
                    );
                    const locationsButtonsIds = locationData.sub.map(
                        (element) => `${element.name}${locationButtonCustomId}`,
                    );
                    locationsButtonsIds.push(`Remove${locationButtonCustomId}`);
                    const locationsActionRows = [];
                    for (let i = 0; i < locationsButtons.length; i += maxRowButtons) {
                        locationsActionRows.push(
                            new MessageActionRow({
                                components: locationsButtons.slice(i, i + maxRowButtons),
                            }),
                        );
                    }

                    const locationVotes = {};
                    locationsList.forEach((location) => (locationVotes[location] = []));

                    const locationMessage = await voteChannel.send({
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
                                mostVotedLocation[
                                    Math.floor(Math.random() * mostVotedLocation.length)
                                ];
                            locationInfo = `Several options had the highest votes, and the location ${selectedLocation} was randomly selected from the tied options.`;
                        } else {
                            selectedLocation = mostVotedLocation[0];
                            locationInfo = `The location ${selectedLocation} had the highest votes.`;
                        }

                        if (locationVotes[selectedLocation].length) {
                            await locationMessage.reply(locationInfo);
                        } else {
                            await locationMessage.reply("No votes were cast for the location.");
                            return;
                        }

                        resolve();
                    });
                });
            };

            const createMeetupThread = () => {
                const dateString = new Date().toLocaleDateString('en-AU')

                client.channels.fetch(threadDestinationId).then( async (channel) => {
                    // Creates thread which expires after 1 day
                    const thread = await channel.threads.create({
                        name: `${dateString}-${selectedLocation}`,
                        autoArchiveDuration: 1440
                    });

                    Object.values(areaVotes).forEach(async (area) => {
                        area.forEach(async (id) => {
                            await thread.members.add(id);
                        })
                    });

                    client.channels.fetch(voteOriginId).then(async (channel) => {
                        await channel.send(`Created a thread for today's lunch buddy meet: ${thread}`)
                    });
                });
            };

            await conductAreaVote();
            await conductLocationVote();
            createMeetupThread();
        });
    },
};
