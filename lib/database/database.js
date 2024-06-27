const { Pool } = require("pg");
const yaml = require("js-yaml");
const fs = require("fs");
// const { count, table } = require('console');

// Class for the user database
class DBuser {
    constructor() {
        // Loads the db configuration file
        const details = this.load_db_login();

        this.pool = new Pool({
            user: details["user"],
            password: details["password"],
            host: details["host"],
            port: details["port"],
            database: details["dbname"],
        });

        // Creates all the tables required if they are not present
        (async () => {
            await this.create_tables();
        })();
    }

    // Loading the configuration file
    load_db_login() {
        // Get document, or throw exception on error
        try {
            const doc = yaml.load(fs.readFileSync("./config/database.yml"));
            return doc;
        } catch (e) {
            console.log(e);
        }
    }

    // Checks if the table exists in the database
    async check_table(table_name) {
        const client = await this.pool.connect();
        try {
            // console.log("Running check_table command")
            await client.query("BEGIN");
            const values = [table_name];
            const result = await client.query(
                "select * from information_schema.tables where table_name=$1",
                values,
            );
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return false;
            } else {
                return true;
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Helper function to create all the required tables
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

    // Creates the users table
    async create_table_users() {
        const client = await this.pool.connect();
        try {
            if ((await this.check_table("users")) == false) {
                console.log("Running creating user table");
                await client.query("BEGIN");
                const query = `CREATE TABLE users (
                    userid INTEGER PRIMARY KEY,
                    joindate DATE NOT NULL,
                    leavedate DATE,
                    userleft BOOLEAN
                )`;
                await client.query(query);
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Creates the user roles table
    async create_table_user_roles() {
        const client = await this.pool.connect();
        try {
            // if ((await this.check_table("user_roles")) == false) {

            await client.query("BEGIN");
            const query = `CREATE TABLE user_roles (
                rid INTEGER PRIMARY KEY,
                userid BIGINT NOT NULL,
                role varchar(64),
                time_assigned TIMESTAMP
            )`;
            await client.query(query);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happende:${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Creates the user channels table
    async create_table_user_channels() {
        const client = await this.pool.connect();
        try {
            if ((await this.check_table("user_channels")) == false) {
                // console.log("Running create_table")
                await client.query("BEGIN");
                const query = `CREATE TABLE user_channels (
                cid INTEGER PRIMARY KEY,
                userid INTEGER NOT NULL,
                channel varchar(64),
                FOREIGN KEY (userid)
                REFERENCES users (userid)
            );`;
                await client.query(query);
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Creates the user permissions table
    async create_table_user_permissions() {
        const client = await this.pool.connect();
        try {
            if ((await this.check_table("user_permissions")) == false) {
                // console.log("Running create_table")
                await client.query("BEGIN");
                const query = `CREATE TABLE user_permissions (
                    pid INTEGER PRIMARY KEY,
                    userid INTEGER NOT NULL,
                    permission varchar(64),
                    FOREIGN KEY (userid)
                    REFERENCES users (userid)
                );`;
                await client.query(query);
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // When a user leaves the server
    async user_leave(userid) {
        let time = new Date();
        time.setMilliseconds(0);
        time = time.toISOString();

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [time, true, userid];
            const query = "UPDATE users  SET leavedate = $1 , userleft = $2 where userid = $3";
            await client.query(query, values);

            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // When a user joins the server
    async user_join(userid) {
        let time = new Date();
        time.setMilliseconds(0);
        time = time.toISOString();

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            let query = "select * from users where userid = $1";
            let values = [userid];
            const result = await client.query(query, values);

            if (result.rows.length != 0) {
                query = "UPDATE users SET joindate=$1, userleft=$2 where userid=$3";
                values = [time, false, userid];
                await client.query(query, values);
            } else {
                query =
                    "INSERT INTO users (USERID, JOINDATE, LEAVEDATE, USERLEFT) VALUES ($1,$2,$3,$4)";
                values = [userid, time, null, false];
                await client.query(query, values);
            }
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Adding a user role
    async add_user_role(userid, role) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            let query = "SELECT max(rid) from user_roles";
            let result = await client.query(query);

            const count = result.rows[0]["max"] + 1;
            query =
                "INSERT INTO user_roles (RID, USERID, ROLE, TIME_ASSIGNED) VALUES ($1,$2,$3,NOW())";
            const values = [count, userid, role];
            result = await client.query(query, values);

            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend when trying to add user role to table ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Removing a user role
    async remove_user_role(userid, role) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid, role];
            const query = `DELETE FROM user_roles where userid = $1 and role = $2`;
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Counting the number of unique roles of user with userid
    async count_user_roles(userid) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid];
            const query = "SELECT COUNT(DISTINCT role) from user_roles where userid = $1";
            const result = await client.query(query, values);

            await client.query("COMMIT");
            return result.rows[0]["count"];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    // Counting the number of unique permissions of the user with userid
    async count_user_permissions(userid) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid];
            const query =
                "SELECT COUNT(DISTINCT permission) from user_permissions where userid = $1";
            const result = await client.query(query, values);

            await client.query("COMMIT");

            return result.rows[0]["count"];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Adding a permission
    async add_user_permission(userid, permission) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            let query = "SELECT max(pid) from user_permissions";
            let result = await client.query(query);
            const count = result.rows[0]["max"] + 1;
            // console.log(result.rows);
            query = "INSERT INTO user_permissions (PID, USERID, PERMISSION) VALUES ($1,$2,$3)";
            const values = [count, userid, permission];
            result = await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Removing a permission
    async remove_user_permission(userid, permission) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid, permission];
            const query = `DELETE FROM user_permissions
        where userid = $1 and permission = $2 `;
            await client.query(query, values);

            // console.log(result.rows);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // When a user joins a channel
    async user_join_channel(userid, channel) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            let query = "SELECT max(cid) from user_channels";
            let result = await client.query(query);
            const count = result.rows[0]["max"] + 1;

            query = "INSERT INTO user_channels (CID, USERID, CHANNEL) VALUES ($1,$2,$3)";
            const values = [count, userid, channel];
            result = await client.query(query, values);

            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // When a user leaves the channel
    async user_leave_channel(userid, channel) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid, channel];
            const query = `DELETE FROM user_channels
        where userid = $1 and channel = $2 `;
            await client.query(query, values);

            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Total number of unique users
    async count_users() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = "select count(userid) from users where userleft=False";
            const result = await client.query(query);
            await client.query("COMMIT");
            return result.rows[0]["count"];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Number of channels the user with userid is in
    async count_user_channels(userid) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [userid];
            const query = "SELECT COUNT(DISTINCT channel) from user_channels where userid = $1";
            const result = await client.query(query, values);

            await client.query("COMMIT");
            return result.rows[0]["count"];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async checkTimeAssigned() {
        const client = await this.pool.connect();
        try {
            // Query to select rows where time_assigned is older than 1 hour
            const query = `
                SELECT * FROM user_roles WHERE time_assigned < NOW() - interval '1 year'
            `;

            const result = await client.query(query);

            const old_roles = result.rows.map((row) => ({
                role_name: row.role,
                userid: row.userid,
            }));

            return old_roles;
        } catch (error) {
            console.error(error);
            return [];
        } finally {
            client.release();
        }
    }
}

module.exports = {
    DBuser,
};
