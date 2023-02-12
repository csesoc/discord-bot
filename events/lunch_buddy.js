const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const cron = require('node-cron');
const lunchBuddyLocations = require('../data/lunch_buddy_locations');

const maxRowButtons = 5;
const areaButtonCustomId = 'AreaButton';
const interactionTimeout = 30000; //30mins = 1800000

const generateAreasEmbed = (areaVotes = undefined) => {
    const areas = lunchBuddyLocations.locations.map(element => (`${element.value}: ${areaVotes ? areaVotes[element.value].length : 0}`));
    return new MessageEmbed()
        .setTitle('Meetup Area Selection')
        .setColor(0x0099FF)
        .setDescription('Please select an option below to vote for that area!')
        .setFields({
            name: 'Options',
            value: areas.join('\n')
        });
};
const generateLocationsEmbed = (area, votes = undefined) => {
    const locations = lunchBuddyLocations.locations[area].sub.map(element => (`${element.value}: ${votes ? votes[element.value].length : 0}`));
    return new MessageEmbed()
        .setTitle(`Meetup Location Selection - ${area}`)
        .setColor(0x0099FF)
        .setDescription('Please select an option below to vote for that location!')
        .setFields({
            name: 'Options',
            value: locations.join('\n')
        });
}
const areasList = lunchBuddyLocations.locations.map(element => element.value);
const areasButtons = lunchBuddyLocations.locations.map(element => new MessageButton({
    style: "PRIMARY",
    label: element.value,
    customId: `${element.value}${areaButtonCustomId}`
}));
areasButtons.push(new MessageButton({
    style: 'DANGER',
    label: 'Remove Vote',
    customId: `Remove${areaButtonCustomId}`
}));
const areasButtonsIds = lunchBuddyLocations.locations.map(element => `${element.value}${areaButtonCustomId}`);
areasButtonsIds.push(`Remove${areaButtonCustomId}`)
const areasActionRows = [];
for (let i = 0; i < areasButtons.length; i += maxRowButtons) {
    areasActionRows.push(new MessageActionRow({ components: areasButtons.slice(i, i + maxRowButtons) }));
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
}

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        cron.schedule('* * * * *', function() {
            const areaVotes = [];
            areasList.forEach((area) => areaVotes[area] = []);

            client.channels.fetch('946636861256904774')
            .then(async (channel) => {
                const message = await channel.send({embeds: [generateAreasEmbed()], components: areasActionRows});

                const collector = message.createMessageComponentCollector({
                    filter: areasButtonsFilter,
                    time: interactionTimeout,
                    idle: interactionTimeout,
                });

                collector.on('collect', async(interaction) => {
                    const interactorId = String(interaction.user.id)
                    const priorVoteOption = getVoteOption(interactorId, areaVotes);
                    const newOption = interaction.customId.replace(areaButtonCustomId, '');

                    let newVoteString = ` voted for ${newOption}!`;
                    let oldVoteString = '';

                    if (priorVoteOption) {
                        if (newOption === 'Remove') {
                            newVoteString = ' removed your vote.';
                            const location = areaVotes[priorVoteOption].indexOf(interactorId);
                            areaVotes[priorVoteOption].splice(location, 1);
                        } else {
                            const location = areaVotes[priorVoteOption].indexOf(interactorId);
                            areaVotes[priorVoteOption].splice(location, 1);
    
                            oldVoteString = ` removed your vote for ${priorVoteOption} and`;
                        }
                    } else if (newOption === 'Remove') {
                        newVoteString = ' no vote to remove.';
                    }

                    const voteString = `You have${oldVoteString}${newVoteString}`;

                    if (newOption !== 'Remove') {
                        areaVotes[newOption].push(interactorId);
                    }

                    interaction.reply({ content: voteString, ephemeral: true });
                    interaction.message.edit({ embeds: [generateAreasEmbed(areaVotes)] })
                });

                collector.on('end', () => {
                    message.delete();
                });
            })
        });
    },
};