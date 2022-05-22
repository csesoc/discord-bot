const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, Permissions } = require("discord.js");
const { DBlog } = require("../lib/database/dblog");
const fs = require('fs');
const path = require("path");
const nodemailer = require("nodemailer");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("logreport")
        .setDescription("[ADMIN] collect message logs")
        .addSubcommand(subcommand =>
            subcommand
                .setName("today")
                .setDescription("[ADMIN] get all message logs from today")        
                .addStringOption(option => option.setName("email").setDescription("Email you want log report to be sent to").setRequired(true)),        
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("timeperiod")
                .setDescription("[ADMIN] get all message logs in the set of days specified")
                .addStringOption(option => option.setName("email").setDescription("Email you want log report to be sent to").setRequired(true))
                .addStringOption(option => option.setName("start-datetime").setDescription("Enter the time as YYYY-MM-DD HH:MM").setRequired(true))
                .addStringOption(option => option.setName("end-datetime").setDescription("Enter the time as YYYY-MM-DD HH:MM").setRequired(true)),
        ),
    
    async execute(interaction) {

        if (!interaction.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            await interaction.reply({ content: "You do not have permission to execute this command.", ephemeral: true });
            return;
        }

        const email_reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const email = interaction.options.getString("email");

        if(!email_reg.test(email)){
            await interaction.reply({ content: "Please enter a valid email.", ephemeral: true });
            return;
        }

        var today = new Date();
        today.setHours(0,0,0,0);
        today.setDate(today.getDate() + 1);
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        var start = null;
        var end = null;

        if (interaction.options.getSubcommand() === 'today') {
            start = today.toISOString();
            end = tomorrow.toISOString();
        } else if (interaction.options.getSubcommand() === 'timeperiod') {
            console.log("timeperiod log here");

            let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
            start = interaction.options.getString('start-datetime');
            end = interaction.options.getString('end-datetime');
            console.log(re.test(start), start);
            if (!re.test(start)) {
                await interaction.reply( { content: "Please enter the start-datetime as YYYY-MM-DD HH:MM exactly", ephemeral: true});
                return;
            };

            if (!re.test(end)) {
                await interaction.reply( { content: "Please enter the end-datetime as YYYY-MM-DD HH:MM exactly", ephemeral: true});
                return;
            };
        }

        const logDB = global.logDB;
        var result = logDB.collect_messages(start, end);


        result.then(function(logs) {
            //console.log(logs);

            let writer = fs.createWriteStream("./data/log_report.txt");

            for(let i = 0; i < logs.length; i++){
                const message = logs[i].message.trim();
                const original_message = logs[i].original_message.trim();
                const username = logs[i].username.trim();
                var deleted = (logs[i].deleted === 1) ? "Yes":"No"
                var log_line = "message_id: " + logs[i].message_id + " user_id: " + logs[i].user_id + " username: " + username + " channel_id: " + logs[i].channel_id + " message: " + "'" + message + "'";

                if(logs[i].original_message != logs[i].message){
                    log_line = log_line + " original_message: " + "'" + original_message + "'";
                } 

                log_line = log_line + " message_datetime: " + logs[i].message_datetime + " deleted: " + deleted;
                
                writer.write(log_line+"\n");
            }
        });

        const logP = path.join(__dirname, '../data/log_report.txt');
        
        var transport = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
            user: "efb0baa80666b7",
            pass: "1cfc11663514d6"
            }
        });
        
        //change mail for csesoc specific
        let mailOptions = {
            from: "csesoc@gmail.com",
            to: email,
            subject: "messages logs",
            text: "This is the requested logs",
            attachments: [
                {
                    filename: 'log.txt',
                    path: logP
                }
            ]
        }
        
        transport.sendMail(mailOptions, function(err, success){
            if(err){
                console.log(err);
                return;
            } else {
                console.log("Email sent succesfully");
            }
        });

        interaction.reply({content: `Sent log report to ${email}`, ephemeral: true });
    }
};