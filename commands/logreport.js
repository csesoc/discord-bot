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

        // if(user == "" || pass == ""){
        //     await interaction.reply({ content: "Email config data invalid.", ephemeral: true });
        //     return;
        // }
        

        const email_reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const email = interaction.options.getString("email");

        if(!email_reg.test(email)){
            await interaction.reply({ content: "Please enter a valid email.", ephemeral: true });
            return;
        }

        var start = null;
        var end = null;

        if (interaction.options.getSubcommand() === 'today') {
            var today = new Date();

            var t_year = today.getFullYear().toString();
            var mon = parseInt(today.getMonth()) + 1;
            var t_month = mon.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});
            var t_date = today.getDate().toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});

            var tomorrow_date = (parseInt(t_date) + 1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping: false});

            start = t_year+"-"+t_month+"-"+t_date+" 00:01"
            end = t_year+"-"+t_month+"-"+tomorrow_date+" 00:01"
        } else if (interaction.options.getSubcommand() === 'timeperiod') {

            let re = /^\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
            start = interaction.options.getString('start-datetime');
            end = interaction.options.getString('end-datetime');
            
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
            
            for(let i = 0; i < logs.length; i++){
                logs[i]['username'] = logs[i]['username'].trim();
                logs[i]['message'] = logs[i]['message'].trim();
                logs[i]['original_message'] = logs[i]['original_message'].trim();
            }

            const createCsvWriter = require('csv-writer').createObjectCsvWriter;
            const csvWriter = createCsvWriter({
            path: './data/log_report.csv',
            header: [
                {id: 'message_id', title: 'Message_ID'},
                {id: 'user_id', title: 'User_ID'},
                {id: 'username', title: 'Username'},
                {id: 'message', title: 'Message'},
                {id: 'original_message', title: 'Original_Message'},
                {id: 'deleted', title: 'Deleted'},
                {id: 'message_datetime', title: 'Message_Sent'},
                {id: 'channel_id', title: 'Channel_ID'},
                {id: 'channel_name', title: "Channel_Name"}
            ]
            });

            csvWriter
                .writeRecords(logs)
                .then(()=> console.log('The Log CSV file was written successfully'));
            

            const logP = path.join(__dirname, '../data/log_report.csv');


            var transport = nodemailer.createTransport({
                host: "smtp.zoho.com.au",
                secure: true,
                port: 465,
                auth: {
                    user: process.env.ZOHO_EMAIL,
                    pass: process.env.ZOHO_PASS,
                }
            });
            
            //change mail for csesoc specific
            let mailOptions = {
                from: "csesocbot@gmail.com",
                to: email,
                subject: "messages logs",
                text: "This is the requested report log for "+start+" to "+end,
                attachments: [
                    {
                        filename: 'log.csv',
                        path: logP
                    }
                ]
            }
            
            transport.sendMail(mailOptions, function(err, info){
                    if(err){
                        console.log(err);
                    } else {
                        console.log(info);
                    }
            });
            
            interaction.reply({content: `Sent log report to ${email}`, ephemeral: true });
        });
    }
};