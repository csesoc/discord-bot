const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs   = require('fs');
//const { count, table } = require('console');


// Class for the base DB for the bot
class DBuser {
    // Constructor to initialize the values
    constructor(){
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        });
        // An anonymous function to create tables
        (async () => {
            await this.create_tables();
        })();

    }

    // Load the db details from the file
    load_db_login() {
    // Get document, or throw exception on error
        try {
        const doc = yaml.load(fs.readFileSync('./data/database.yml'));
        return doc;
        } catch (e) {
        console.log(e);
        }
    }
    
    //Checks if the table already exists in the database
    async check_table(table_name) {
        const client = await this.pool.connect()
        try{
        console.log("Running check_table command")
        //await client.query("insert into employees values (1, 'John')")
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
            console.log("Client released successfully.")    
        }
    }
    
    // Creates the required table. To add a new table in future, create a separate function
    // to create the table and then add it in function below
    async create_tables() {
        try {
        await this.create_table_users();
        } catch (ex) {
            console.log(ex);
        }
        try {
            await this.create_table_user_roles();
            } catch (ex) {
                console.log(ex);
        }
        try {
            await this.create_table_user_channels();
            } catch (ex) {
                console.log(ex);
        }
        try {
            await this.create_table_user_permissions();
            } catch (ex) {
                console.log(ex);
        }
    }

    // Creating different types of tables depending on the use case
    async create_table_users() {
        const client = await this.pool.connect()
        try{
            if (await this.check_table('users') == false) {
                console.log("Running create_table")
                await client.query("BEGIN");
                var query = `CREATE TABLE users (
                    userid INTEGER PRIMARY KEY,
                    joindate DATE NOT NULL,
                    leavedate DATE,
                    userleft BOOLEAN
                );`;
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
            console.log("Client released successfully.")    
        }
    }

    async create_table_user_roles() {
        const client = await this.pool.connect()
        try{
            if (await this.check_table('user_roles') == false) {
                console.log("Running create_table")
                await client.query("BEGIN");
                var query = `CREATE TABLE user_roles (
                    rid INTEGER PRIMARY KEY,
                    userid INTEGER NOT NULL,
                    role varchar(64),
                    FOREIGN KEY (userid)
                    REFERENCES users (userid)
                );`;
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
            console.log("Client released successfully.")    
        }
    }

    async create_table_user_channels() {
        const client = await this.pool.connect()
        try{
            if (await this.check_table('user_channels') == false) {
        console.log("Running create_table")
        await client.query("BEGIN");
        var query = `CREATE TABLE user_channels (
            cid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            channel varchar(64),
            FOREIGN KEY (userid)
            REFERENCES users (userid)
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
            console.log("Client released successfully.")    
        }
    }

    async create_table_user_permissions() {
        const client = await this.pool.connect()
        try{
            if (await this.check_table('user_permissions') == false) {
                

        console.log("Running create_table")
        await client.query("BEGIN");
        var query = `CREATE TABLE user_permissions (
            pid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            permission varchar(64),
            FOREIGN KEY (userid)
            REFERENCES users (userid)
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
            console.log("Client released successfully.")    
        }
    }

    // Counts the number of users who are present in the server
    async count_users() {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        
        var query = `select count(userid) from users where userleft=False`;
        var result = await client.query(query)
        console.log(result)
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
            console.log("Client released successfully.")    
        }
    }
    
    // Counts the number of roles a user has
    async count_user_roles(userid) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid]
        var query = `SELECT COUNT(DISTINCT role) from user_roles where userid = $1`;
        var result = await client.query(query,values);
        console.log(result)

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
            console.log("Client released successfully.")    
        }
    }

    // The number of channels a user is part of
    async count_user_channels(userid) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid]
        var query = `SELECT COUNT(DISTINCT channel) from user_channels where userid = $1`;
        var result = await client.query(query,values);
        console.log(result)

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
            console.log("Client released successfully.")    
        }
    }

    // The number of permissions the user has
    async count_user_premissions(userid) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid]
        var query = `SELECT COUNT(DISTINCT permission) from user_permissions where userid = $1`;
        var result = await client.query(query,values);
        console.log(result)

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
            console.log("Client released successfully.")    
        }
    }

    /*
        TODO
    */
    async user_leave(userid) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid]
        var query = `SELECT COUNT(DISTINCT permission) from user_permissions where userid = $1`;
        var result = await client.query(query,values);
        console.log(result)

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
            console.log("Client released successfully.")    
        }
    }


    /*
        TODO
    */
    async user_join(userid) {

    }
    
    // Add a role to the user
    async add_user_role(userid, role) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
       
        var query = `SELECT count(rid) from user_roles`;
        var count = await client.query(query);
        // Add 1 to this count
        console.log(count);

        query = `INSERT INTO user_roles (RID, USERID, ROLE) VALUES ($1,$2,$3)`;
        var values = [count, userid, role];
        var result = await client.query(query, values);

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
            console.log("Client released successfully.")    
        }
    }

    // Remove a role from user
    async remove_user_role(userid, role) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid, role]
        var query = `DELETE FROM user_roles
        where userid = %s and role = %s`;
        var result = await client.query(query,values);
        // Add 1 to this count
        console.log(result);        
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
            console.log("Client released successfully.")    
        }
    }
    
    // Add a user permission
    async add_user_permission(userid, permission) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        
        var query = `SELECT count(pid) from user_permissions`;
        var count = await client.query(query);
        // Add 1 to this count
        console.log(count.rows);

        query = `INSERT INTO user_permissions (PID, USERID, PERMISSION) VALUES ($1,$2,$3)`;
        values = [count, userid, permission];
        var result = await client.query(query, values);
        console.log(result.rows)
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
            console.log("Client released successfully.")    
        }
    }

    // Remove a user permission
    async remove_user_permission(userid, permission) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid, permission]
        var query = `DELETE FROM user_permissions
        where userid = $1 and permission = $2 `;
        var result = await client.query(query,values);
        
        console.log(result.rows);        
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
            console.log("Client released successfully.")    
        }
    }

    // Add a user channel
    async user_join_channel(userid, channel) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
       
        var query = `SELECT count(cid) from user_channels`;
        var count = await client.query(query);
        // Add 1 to this count
        console.log(count);

        query = `INSERT INTO user_channels (CID, USERID, CHANNEL) VALUES ($1,$2,$3)`;
        var values = [count, userid, channel];
        var result = await client.query(query, values);

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
            console.log("Client released successfully.")    
        }
    }

    // Leave a user channel
    async user_leave_channel(userid, channel) {
        const client = await this.pool.connect()
        try{
        await client.query("BEGIN");
        var values = [userid, channel]
        var query = `DELETE FROM user_channels
        where userid = $1 and channel = $2 `;
        var result = await client.query(query,values);
        
        console.log(result.rows);        
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
            console.log("Client released successfully.")    
        }
    }
}

(async () => {
    var as = new DBuser();    
    //console.log(user)
})();
