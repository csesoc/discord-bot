const { channel } = require('diagnostics_channel');
const fs = require('fs');

module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        let timer = setInterval(function() {
            temp_data = [];
            console.log("Running the timer");
            fs.readFile('./data/createvc.json','utf-8', (err, jsonString) => {
                if (err) {
                    console.log("Error reading file from disk:", err)
                    return
                }
                else {
                    var data = JSON.parse(jsonString);

                    b = data.channels.filter(e=>e.delete == true);
                    b.forEach(f => data.channels.splice(data.channels.findIndex(e => e.delete === f.delete),1));


                    fs.writeFileSync("./data/createvc.json", JSON.stringify({ users: data.users, channels:data.channels}, null, 4));

                    // console.log(data);

                    data.channels.forEach(function (item, index) {
                        // item here is the channel id
                        if (item.delete == false)
                        {
                            client.channels.fetch(item.channel_id)
                        .then(
                            channel => 
                            {
                                channel.fetch().then(
                                    channel =>
                                    {
                                        if( channel.members.size == 0) {
                                            
                                            // console.log(channel.name);
                                            // console.log(channel.members.size);

                                            item.delete = true;
                                            fs.writeFileSync("./data/createvc.json", JSON.stringify({ users: data.users, channels:data.channels}, null, 4));
                                            channel.delete().then(console.log)
                                            .catch(console.error);

                                            
                                        }
                                        

                                    }
                                ).catch(console.error);
                            }
                        )
                        .catch(console.error);
                    }
                    });
                    

                    // console.log(data.channels);
                    
                    
                }
            });
            // Write back to the file
            
        }, 30*1000)
    },
};
