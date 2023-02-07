const { MessageEmbed } = require('discord.js');
const cron = require('node-cron');
const lunchBuddyLocations = require('../data/lunch_buddy_locations');

const exampleEmbed = new MessageEmbed()
	.setColor(0x0099FF)
    .setDescription('Some description here')

lunchBuddyLocations.locations[0].sub.forEach(e => {
    exampleEmbed.addFields({ name: e.name, value: 'Some value here' },)
});



module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        
        cron.schedule('* * * * *', function() {
            client.channels.fetch('946636861256904774')
            .then(channel => {
                channel.send({embeds: [exampleEmbed], ephemeral: true});
            })

        });
    },
};