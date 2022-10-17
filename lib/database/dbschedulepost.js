const { Pool } = require('pg');
const yaml = require('js-yaml');
const fs = require('fs');

class DBSchedulePost {
    constructor() {
        // Loads the db configuration
        const details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password:  details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname'],
        });

        // Creates the table if it doesn't exists
        (async () => {
            const has_table = await this.check_table('schedule_post');
            if (has_table == false) {
                await this.create_schedule_post_table();
            }
        })();
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = yaml.load(fs.readFileSync('./config/database.yml'));
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
            const result = await client.query("select * from information_schema.tables where table_name=$1", values);
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return false;
            } else {
                return true;
            }
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Creates a new table for scheduled posts
    async create_schedule_post_table() {
        const client = await this.pool.connect();
        try {
            console.log("Running create_schedule_post_table");
            await client.query("BEGIN");
            const query = `CREATE TABLE SCHEDULE_POST (
                SCHEDULED_POST_ID SERIAL PRIMARY KEY,
                GUILD_ID BIGINT NOT NULL,
                MSG_ID BIGINT NOT NULL,
                INIT_CHANNEL_ID BIGINT NOT NULL,
                SEND_CHANNEL_ID BIGINT NOT NULL,
                DATETIME CHAR(16) NOT NULL,
                REMINDER CHAR(16),
                SENT_MSG_ID BIGINT
                )`;
            await client.query(query);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }


    // Add new scheduled post
    async add_react_role_msg(guild_id, msg_id, init_channel_id, send_channel_id, datetime, reminder) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = `INSERT INTO schedule_post VALUES (DEFAULT,$1,$2,$3,$4,$5,$6)`;
            const values = [guild_id, msg_id, init_channel_id, send_channel_id, datetime, reminder];
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Add reminder
    async add_reminder(sent_msg_id, scheduled_post_id) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const query = `UPDATE schedule_post SET sent_msg_id=$1 WHERE scheduled_post_id=$2;`;
            const values = [sent_msg_id, scheduled_post_id];
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Get all posts scheduled at given time
    async get_scheduled(datetime) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [datetime];
            const result = await client.query("select * from schedule_post where datetime=$1", values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Get all reminders at given time
    async get_reminders(reminder) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [reminder];
            const result = await client.query("select * from schedule_post where reminder=$1", values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async remove_scheduled(scheduled_post_id) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [scheduled_post_id];
            await client.query("delete from schedule_post where scheduled_post_id=$1", values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async get_scheduled_post_id(msg_id, send_channel_id, datetime) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [msg_id, send_channel_id, datetime];
            const result = await client.query("select * from schedule_post where msg_id=$1 and send_channel_id=$2 and datetime=$3", values);
            await client.query("COMMIT");

            if (result.rows.length === 0) {
                return null;
            } else {
                return result.rows[0].scheduled_post_id;
            }
        } catch (ex) {
            console.log(`Something wrong happend in schedule post ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }
}

module.exports = {
    DBSchedulePost,
};