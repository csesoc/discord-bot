const { Pool } = require("pg");
const yaml = require("js-yaml");
const fs = require("fs");

// Class for standup db
class DBstandup {
    constructor() {
        // Loads the db configuration
        const details = this.load_db_login();

        this.pool = new Pool({
            user: details["user"],
            password: details["password"],
            host: details["host"],
            port: details["port"],
            database: details["dbname"],
        });
        // The name of the table
        const table_name = "standups";

        // Creates the table if it doesn't exists`
        (async () => {
            const is_check = await this.check_table(table_name);
            // console.log(is_check);
            if (is_check == false) {
                await this.create_table();
            }
        })();
    }

    load_db_login() {
        // Get document, or throw exception on error
        try {
            const doc = yaml.load(fs.readFileSync("./config/database.yml"));
            return doc;
        } catch (e) {
            console.log(e);
        }
    }

    // Checks if the table exists in the db
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
            console.log(`dbstandup:load_db_login:${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    async create_table() {
        const client = await this.pool.connect();
        try {
            console.log("Creating tables for feature standups");
            await client.query("BEGIN");
            const query = `
                    CREATE TABLE standup_teams (
                        id NUMERIC PRIMARY KEY
                    );
                    
                    CREATE TABLE standups (
                        id SERIAL PRIMARY KEY,
                        team_id NUMERIC NOT NULL,
                        user_id NUMERIC NOT NULL,
                        message_id NUMERIC NOT NULL,
                        standup_content TEXT,
                        time_stamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (team_id) REFERENCES standup_teams (id)
                    );
                `;

            await client.query(query);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`dbstandup:create_table:${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async getStandups(channelParentId, numDays) {
        const timeInterval = `${numDays} DAYS`;

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            /*eslint-disable */
            const query = `
                SELECT * FROM standups AS s
                JOIN standup_teams AS t ON t.id = s.team_id
                INNER JOIN (
                    SELECT s1.user_id, MAX(s1.time_stamp) AS date
                    FROM standups AS s1
                    GROUP BY s1.user_id
                ) AS s3 ON s3.user_id = s.user_id AND s.time_stamp = s3.date
                WHERE t.id = $1 AND s.time_stamp >= CURRENT_TIMESTAMP - INTERVAL \'${timeInterval}\';
            `;
            /* eslint-enable */

            const values = [channelParentId];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (e) {
            console.log(`dbstandup:getStandups:${e}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    async addStandup(channelParentId, userId, messageId, messageContent) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const queryMakeTeamExist = `
                INSERT INTO standup_teams (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;
            `;
            await client.query(queryMakeTeamExist, [channelParentId]);

            const queryInsertStandup = `
                INSERT INTO standups (team_id, user_id, message_id, standup_content)
                VALUES ($1, $2, $3, $4);
            `;
            const values_params = [channelParentId, userId, messageId, messageContent];
            const result = await client.query(queryInsertStandup, values_params);
            await client.query("COMMIT");

            return result.rows;
        } catch (e) {
            console.log(`dbstandup:addStandup:${e}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    async thisStandupExists(messageId) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = `
                SELECT * FROM standups AS s
                WHERE s.message_id = $1;
            `;
            const result = await client.query(query, [messageId]);

            await client.query("COMMIT");

            return result.rows.length != 0;
        } catch (e) {
            console.log(`dbstandup:thisStandupExists:${e}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    async updateStandup(messageId, messageContent) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = `
                UPDATE standups
                SET standup_content = $2
                WHERE message_id = $1
                AND standup_content IS DISTINCT FROM $2;
            `;

            const values_params = [messageId, messageContent];
            await client.query(query, values_params);
            await client.query("COMMIT");
        } catch (e) {
            console.log(`dbstandup:updateStandup:${e}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    async deleteAllStandups() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = `
                DELETE FROM standups;
            `;

            const result = await client.query(query);
            await client.query("COMMIT");

            return result.rows;
        } catch (e) {
            console.log(`dbstandup:deleteAllStandups:${e}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }
}

module.exports = {
    DBstandup,
};
