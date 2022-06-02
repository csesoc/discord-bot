var { data } = require("../config/standup.json");
const fs = require('fs');
  
module.exports = {
    name: "messageUpdate",
    async execute(_oldMessage, message) {
        // console.log(message);
        if (message.content.startsWith("$standup")) {
            var messages = String(message.content)
            var messageContent = messages.slice(8)
            // console.log(message.channel.parent.name)
            teamName = message.channel.parent.name

            var mentions = message.mentions.users
            var mentionsArr = [...mentions.values()];

            // Contains the list of all users mentioned in the message
            let result = mentionsArr.map(a => a.id);
            
            var voteauthorid = message.author.id;
            var voteauthorname = message.member.nickname;
            if(voteauthorname == null) {
                voteauthorname = message.author.username;
            }

            if(teamName in data) {
                var flag = 0;
                data[teamName].forEach(function (item, _index) {
                   if (item['voteauthorid'] == voteauthorid) {
                       item['standup'] = messageContent;
                       item['mentions'] = result
                       flag = 1
                   }
                  });
                if (flag == 0){  
                data[teamName].push({
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup": messageContent,
                    "mentions":result

                });
            }
            }
            else {
                data[teamName] = [{
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup":messageContent,
                    "mentions":result
                }];
            }
            //console.log(data);

            // data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));
        }
    },
};
