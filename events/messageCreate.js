var { data } = require("../config/standup.json");
const fs = require('fs');
/*
    * From the message take the 
        - channel category name
        - Nickname or Username
    * Store the data in the format already decided


*/
function removeFirstWord(str) {
    const indexOfSpace = str.indexOf(' ');
  
    if (indexOfSpace === -1) {
      return '';
    }
  
    return str.substring(indexOfSpace + 1);
  }

  
module.exports = {
    name: "messageCreate",
    async execute(message) {
        // console.log(message);
        if (message.content.startsWith("$standup")) {
            var messageContent = removeFirstWord(message.content)
            console.log(messageContent)
            console.log(message.channel.parent.name)
            teamName = message.channel.parent.name

            var voteauthorid = message.author.id;
            var voteauthorname = message.member.nickname;
            if(voteauthorname == null) {
                voteauthorname = message.author.username;
            }

            if(teamName in data) {
                data[teamName].push({
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup": messageContent
                });
            }
            else {
                data[teamName] = [{
                    "voteauthorid": voteauthorid,
                    "voteauthorname": voteauthorname,
                    "standup":messageContent
                }];
            }
            //console.log(data);

            // data.unshift({ 'string': votestring, 'authorid': voteauthorid, 'channelid': channelid, 'messageid': messageid })
            fs.writeFileSync("./config/standup.json", JSON.stringify({ data: data }, null, 4));
        }
    },
};
