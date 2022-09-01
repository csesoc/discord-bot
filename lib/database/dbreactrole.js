const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');

class DBReactRole {
    constructor() {
        //Loads the db configuration
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        });
        
        // Creates the table if it doesn't exists
        (async () => {
            var has_msgs_table = await this.check_table('react_role_msgs');
            if (has_msgs_table == false) {
                await this.create_react_role_messages_table();
            } 

            var has_roles_table = await this.check_table('react_role_roles');
            if (has_roles_table == false) {
                await this.create_react_role_roles_table();
            } 
        })();
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = yaml.load(fs.readFileSync('./config/database.yml'));
            return doc;
        } 
        catch (e) 
        {
            console.log(e);
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name) {
        const client = await this.pool.connect()
        try {
            //console.log("Running check_table command")
            await client.query("BEGIN");
            const values = [table_name]
            var result = await client.query("select * from information_schema.tables where table_name=$1",values)
            await client.query("COMMIT");
        
            if (result.rowCount == 0) {
                return false;
            } else {
                return true;
            }
        } 
        catch (ex) 
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    // Creates a new table for react role messages
    async create_react_role_messages_table() {
        const client = await this.pool.connect()
        try {
            console.log("Running create_react_role_msgs_table")
            await client.query("BEGIN");
            var query = `CREATE TABLE REACT_ROLE_MSGS (
                MSG_ID BIGINT PRIMARY KEY,
                SENDER_ID BIGINT NOT NULL
                )`;
            await client.query(query)
            await client.query("COMMIT");
        } 
        catch (ex) 
        {
            console.log(`Something wrong happend in react role ${ex}`)
        } 
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    // Creates new table for react roles
    async create_react_role_roles_table() {
        const client = await this.pool.connect()
        try {
            console.log("Running create_react_role_roles_table")
            await client.query("BEGIN");
            var query = `CREATE TABLE REACT_ROLE_ROLES (
                REACT_ROLE_ID SERIAL PRIMARY KEY,
                ROLE_ID BIGINT,
                EMOJI VARCHAR NOT NULL,
                MSG_ID BIGINT NOT NULL,
                FOREIGN KEY (MSG_ID)
                REFERENCES REACT_ROLE_MSGS (MSG_ID)
                )`;
            await client.query(query)
            await client.query("COMMIT");
        }
        catch (ex) 
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    // Add new react role message
    async add_react_role_msg(msg_id, sender_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `INSERT INTO react_role_msgs VALUES ($1,$2)`;
            var values = [msg_id, sender_id];
            await client.query(query, values);
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    } 

    // Add new react role role
    async add_react_role_role(role_id, emoji, msg_id) {
        const client = await this.pool.connect()
        try{
            await client.query("BEGIN");

            var query = `INSERT INTO react_role_roles VALUES (DEFAULT,$1,$2,$3)`;
            var values = [role_id, emoji, msg_id];
            await client.query(query, values);
            await client.query("COMMIT");
        }
        catch (ex)
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            //console.log("Client released successfully.")    
        }
    } 

    // Get role 
    async get_roles(msg_id, emoji) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");
            const values = [msg_id, emoji]
            var result = await client.query("select * from react_role_roles where msg_id=$1 and emoji=$2",values)
            await client.query("COMMIT");
        
            return result.rows
        } 
        catch (ex) 
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }

    // Get sender
    async get_sender(msg_id) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");
            const values = [msg_id]
            var result = await client.query("select * from react_role_msgs where msg_id=$1",values)
            await client.query("COMMIT");
        
            return result.rows[0].sender_id
        } 
        catch (ex) 
        {
            console.log(`Something wrong happend in react role ${ex}`)
        }
        finally 
        {
            await client.query("ROLLBACK");
            client.release()
            // console.log("Client released successfully.")    
        }
    }
}

module.exports = {
    DBReactRole,
};