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
            var query = `
                    CREATE TABLE standup_teams (
                        id BIGINT PRIMARY KEY
                    );
                    
                    CREATE TABLE standups (
                        id SERIAL PRIMARY KEY,
                        team_id BIGINT NOT NULL,
                        user_id BIGINT NOT NULL,
                        message_id BIGINT NOT NULL,
                        standup_content TEXT,
                        time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (team_id) REFERENCES standup_teams (id)
                    );
                `;

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

    async get_standups(channelParentId, numDays) {
        var timeInterval = $`{numDays} DAYS`;

        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");

            var query = `
                SELECT * FROM standups AS s
                JOIN standup_teams ON s.id = s.team_id
                INNER JOIN (
                    SELECT s1.user_id, MAX(s1.time_stamp) AS date
                    FROM standups AS s1
                    GROUP BY s1.user_id
                ) AS s3 ON s3.user_id = s.user_id AND s.time_stamp = s3.date
                WHERE t.id = $1 AND s.time_stamp >= CURRENT_TIMESTAMP - $2;
            `;

            var values = [emoji, message_id, user_id, channel_id]
            var result = await client.query(query, values)
            await client.query("COMMIT");

            return result.rows;
        }
        catch (e) {
            console.log(`Something wrong happend ${e}`)
        }
        finally {
            await client.query("ROLLBACK");
            client.release()
        }
    }

    async addStandup(channelParentId, userId, messageId, messageContent) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");

            var query = `
                BEGIN
                    INSERT INTO standup_teams (id)
                    VALUES ($1)
                    WHERE NOT EXISTS (
                        SELECT * FROM standup_teams 
                        WHERE id = $1
                    );
                END

                INSERT INTO standups (team_id, user_id, message_id, standup_content)
                VALUES ($1, $2, $3, $4);
            `;

            var values_params = [channelParentId, userId, messageId, messageContent]
            var result = await client.query(query, values_params)
            await client.query("COMMIT");

            return result.rows;
        }
        catch (e) {
            console.log(`Something wrong happend ${e}`)
        }
        finally {
            await client.query("ROLLBACK");
            client.release()
        }
    }

    async updateStandup(messageId, messageContent) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");

            var query = `
                UPDATE standups AS s
                SET s.standup_content = $2
                WHERE s.message_id = $1
            `;

            var values_params = [messageId, messageContent]
            var result = await client.query(query, values_params)
            await client.query("COMMIT");

            return result.rows;
        }
        catch (e) {
            console.log(`Something wrong happend ${e}`)
        }
        finally {
            await client.query("ROLLBACK");
            client.release()
        }
    }
}