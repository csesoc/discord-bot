const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');

class DBlog {
    constructor(){
        //Loads the db configuration
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        });
    }

    load_db_login() {
    // Get document, or throw exception on error
        try {
        const doc = yaml.load(fs.readFileSync('./config/database.yml'));
        return doc;
        } catch (e) {
        console.log(e);
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name) {
        const client = await this.pool.connect()
        try{
        //console.log("Running check_table command")
        await client.query("BEGIN");
        const values = [table_name]
        var result = await client.query("select * from information_schema.tables where table_name=$1",values)
        await client.query("COMMIT");
        
        if(result.rowCount == 0) {
            return false;
        }
        else {
            return true;
        }

        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //// console.log("Client released successfully.")    
        }
    }

    async create_tables() {
        try {
            await this.create_table_channels();
            } catch (ex) {
                console.log(ex);
        }
        try {
        await this.create_table_message_logs();
        } catch (ex) {
            console.log(ex);
        }
    }

    // Creates the channels table
    async create_table_channels() {
        const client = await this.pool.connect()
        try{
            console.log("Running create_table_channels")
            if (await this.check_table('CHANNELS') == false) {
           
            await client.query("BEGIN");
            var query = `CREATE TABLE CHANNELS (
                CHANNEL_ID BIGINT PRIMARY KEY,
                GUILD_ID BIGINT,
                CHANNEL_NAME varchar(64)
            );`;
            await client.query(query)
            await client.query("COMMIT");
        }}
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }
    
    // Creates a new table
    async create_table_message_logs() {
        const client = await this.pool.connect()
        try{
            console.log("Running create_table_message_logs")
            if (await this.check_table('MESSAGE_LOGS') == false) {
                await client.query("BEGIN");
                var query = `CREATE TABLE MESSAGE_LOGS(
                    MESSAGE_ID BIGINT PRIMARY KEY,
                    USER_ID BIGINT NOT NULL,
                    USERNAME CHAR(40) NOT NULL,
                    MESSAGE CHAR(2000) NOT NULL,
                    ORIGINAL_MESSAGE CHAR(2000) NOT NULL,
                    DELETED INTEGER NOT NULL,
                    MESSAGE_DATETIME TIMESTAMP NOT NULL,
                    CHANNEL_ID BIGINT NOT NULL,
                    FOREIGN KEY (CHANNEL_ID)
                    REFERENCES CHANNELS (CHANNEL_ID)
                )`;

                await client.query(query)
                await client.query("COMMIT");
            }
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    async channel_add(channel_id, channel_name, guild_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `select * from channels where channel_id = $1`;
            var values = [channel_id];
            var result = await client.query(query,values);
            
            if(result.rows.length == 0) {
                var query = `INSERT INTO channels VALUES ($1,$2,$3)`;
                var values = [channel_id, guild_id, channel_name];
                await client.query(query, values);
            }

            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    }

    async channel_delete(channel_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `select * from channels where channel_id = $1`;
            var values = [channel_id];
            var result = await client.query(query,values);
            
            if(result.rows.length != 0) {
                var query = `delete from message_logs where channel_id = $1`;
                var values = [channel_id];
                await client.query(query, values);

                var query = `delete from channels where channel_id = $1`;
                var values = [channel_id];
                await client.query(query, values);
            }

            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    }

    async channelname_get(channel_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `select channel_name, guild_id from channels where channel_id = $1`;
            var values = [channel_id];
            var result = await client.query(query,values);
            
            if(result.rows.length == 0) {
                await client.query("COMMIT");
                return null;
            } else {
                await client.query("COMMIT");
                return result.rows;
            }
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    }

    async channelname_update(channel_name, channel_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `UPDATE channels SET channel_name=$1 where channel_id=$2`;
            var values = [channel_name, channel_id];
            await client.query(query,values);
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    }

    async message_create(messageid, userid, user, message, channelid) {
        
        var time = new Date();
        time.setMilliseconds(0);
        time = time.toLocaleString('sv', {timeZoneName: 'short'});

        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `INSERT INTO message_logs VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
            var values = [messageid, userid, user, message, message, 0, time, channelid];
            await client.query(query, values);
        
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }

    }

    async message_delete(messageid) {

        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `select deleted from message_logs where message_id = $1`;
            var values = [messageid];
            var result = await client.query(query,values);

            if(result.rows.length == 1 && result.rows[0].deleted == 0){
                var query = `UPDATE message_logs SET deleted=$1 where message_id=$2`;
                values = [1, messageid];
                await client.query(query,values);
            } else {
                //we stuffed up somewhere
                console.log("Something went wrong with deleting message");
            }
        
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }

    }

    async message_update(oldMessage_id, newMessage_id, newMessage) {

        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");
            
            if(newMessage_id == oldMessage_id){
                var query = `UPDATE message_logs SET message=$1 where message_id=$2`;
                var values = [newMessage, newMessage_id];
                await client.query(query,values);
            } else {
                //we stuffed up somewhere
                console.log("Something went wrong with updating message");
            }
        
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }

    }

    async collect_messages(start, end){
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");
            
            //get all 
            var query = `SELECT * FROM message_logs JOIN
            channels ON message_logs.channel_id = channels.channel_id
            WHERE message_datetime >= $1 AND message_datetime <= $2 ORDER BY message_datetime`;
            var values = [start, end];
            var result = await client.query(query,values);
            
            await client.query("COMMIT");
            
            return result.rows;
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    }
}

module.exports = {
    DBlog,
};