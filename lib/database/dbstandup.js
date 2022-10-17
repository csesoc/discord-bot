const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');

// Class for standup db
class DBstandup {

    constructor(){
        //Loads the db configuration
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        })
        // The name of the table
        var table_name = 'standups';
        
        // Creates the table if it doesn't exists`
        (async () => {
            var is_check = await this.check_table(table_name);
            //console.log(is_check);
            if(is_check == false) {
                await this.create_table();
            }   
            
          })();       
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
        }
    }

    async create_table() {
        const client = await this.pool.connect()
        try {
            console.log("Creating tables for feature standups")
            await client.query("BEGIN");
            var query = `CREATE TABLE standup_channels (
                    id BIGINT PRIMARY KEY, 
                    server_id BIGINT NOT NULL,
                );
                
                CREATE TABLE standups (
                    id SERIAL PRIMARY KEY,
                    channel_id BIGINT NOT NULL,
                    standup_content TEXT,
                    FOREIGN KEY (channel_id) REFERENCES standup_channels (channel_id)
                );`;

            var result = await client.query(query)
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend ${ex}`);
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }
}