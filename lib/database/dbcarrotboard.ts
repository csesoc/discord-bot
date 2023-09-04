import { Pool } from "pg";
const yaml = require("js-yaml");
import fs from "fs";

// This is for CarrotBoard
interface CarrotBoard {
    carrot_id: number;
    emoji: string;
    message_id: string;
    user_id: string;
    channel_id: string;
    count: number;
    message_contents: string;
}
// Class for the carrotboard db
export class DBcarrotboard {
    private pool: Pool;
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
        const table_name = "CARROT_BOARD";

        // Creates the table if it doesn't exists
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
    async check_table(table_name: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            // console.log("Running check_table command")
            await client.query("BEGIN");
            const values = [table_name];
            const result = await client.query(
                "SELECT * FROM information_schema.tables WHERE table_name=$1",
                values,
            );
            await client.query("COMMIT");

            return result.rowCount === 0 ? false : true;
        } catch (ex) {
            console.log(`Something wrong happened ${ex}`);
            return false; // You might want to handle this differently
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    // Creates a new table
    async create_table() {
        const client = await this.pool.connect();
        try {
            console.log("Running create_table_carrot_board");
            await client.query("BEGIN");
            const query = `CREATE TABLE CARROT_BOARD(
            CARROT_ID SERIAL PRIMARY KEY,
            EMOJI CHAR(40) NOT NULL,
            MESSAGE_ID BIGINT NOT NULL,
            USER_ID BIGINT NOT NULL,
            CHANNEL_ID BIGINT NOT NULL,
            COUNT BIGINT,
            MESSAGE_CONTENTS CHAR(50)
            )`;

            await client.query(query);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async count_values(emoji: any, message_id: Number, user_id: Number, channel_id: Number) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            //
            await client.query("BEGIN");

            const query =
                "SELECT count(*) from carrot_board where emoji = $1 and message_id = $2 and user_id = $3 and channel_id = $4";

            const values = [emoji, message_id, user_id, channel_id];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result["rows"][0]["count"];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async get_count(emoji: any, message_id: Number, user_id: Number, channel_id: Number) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            //
            await client.query("BEGIN");

            const query =
                "SELECT * from carrot_board where emoji = $1 and message_id = $2 and user_id = $3 and channel_id = $4";

            const values = [emoji, message_id, user_id, channel_id];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows[0].count;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async add_value(
        emoji: any,
        message_id: Number,
        user_id: Number,
        channel_id: Number,
        message_contents: String,
    ) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const count_val = await this.count_values(emoji, message_id, user_id, channel_id);
            // console.log(count_val)

            if (count_val == 0) {
                const query =
                    "INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT, MESSAGE_CONTENTS) VALUES ($1,$2,$3,$4,$5,$6)";
                const values = [emoji, message_id, user_id, channel_id, 1, message_contents];

                await client.query(query, values);
                await client.query("COMMIT");
            } else {
                let count = await this.get_count(emoji, message_id, user_id, channel_id);
                count = Number(count) + 1;
                const query =
                    "UPDATE carrot_board SET count = $1  where emoji = $2 and message_id = $3 and user_id = $4 and channel_id = $5";
                const values = [count, emoji, message_id, user_id, channel_id];

                await client.query(query, values);
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

    async get_by_cb_id(cb_id: number): Promise<CarrotBoard | null> {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            //
            await client.query("BEGIN");

            const query = "SELECT * from carrot_board where carrot_id = $1";

            const values = [cb_id];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return null;
            }
            return {
                carrot_id: result.rows[0]["carrot_id"],
                emoji: result.rows[0]["emoji"].trim(),
                message_id: result.rows[0]["message_id"],
                user_id: result.rows[0]["user_id"],
                channel_id: result.rows[0]["channel_id"],
                count: result.rows[0]["count"],
                message_contents: result.rows[0]["message_contents"].trim(),
            };
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.")
        }
    }

    async get_by_msg_emoji(message_id: Number, emoji: any): Promise<CarrotBoard | null> {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query = "SELECT * from carrot_board where message_id = $1 and emoji = $2";

            const values = [message_id, emoji];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return null;
            }
            return {
                carrot_id: result.rows[0]["carrot_id"],
                emoji: result.rows[0]["emoji"].trim(),
                message_id: result.rows[0]["message_id"],
                user_id: result.rows[0]["user_id"],
                channel_id: result.rows[0]["channel_id"],
                count: result.rows[0]["count"],
                message_contents: result.rows[0]["message_contents"].trim(),
            };
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async get_all(count_min: any) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query = "SELECT * from carrot_board where count >= $2";

            const values = [count_min];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async del_entry(message_id: Number, channel_id: Number) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query = "DELETE FROM carrot_board where message_id = $1 and channel_id = $2";

            const values = [message_id, channel_id];
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async del_entry_emoji(emoji: any, message_id: Number, user_id: Number, channel_id: Number) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query =
                "DELETE FROM carrot_board where message_id = $1 and channel_id = $2  and user_id = $3 and emoji = $4";

            const values = [message_id, channel_id, user_id, emoji];
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async sub_value(emoji: any, message_id: Number, user_id: Number, channel_id: Number) {
        const client = await this.pool.connect();
        try {
            let count = await this.get_count(emoji, message_id, user_id, channel_id);

            if (count - 1 <= 0) {
                this.del_entry_emoji(emoji, message_id, user_id, channel_id);
            } else {
                // console.log("Connected successfully.")
                await client.query("BEGIN");

                count = count - 1;
                const query =
                    "UPDATE carrot_board SET count = $1  where emoji = $2 and message_id = $3 and user_id = $4 and channel_id = $5";

                const values = [count, emoji, message_id, user_id, channel_id];
                await client.query(query, values);
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async get_all_by_emoji(emoji: any, count_min: any) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query =
                "SELECT * from carrot_board where emoji = $1 and count >= $2 ORDER BY count DESC";

            const values = [emoji, count_min];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }

    async get_all_by_user(emoji: any, count_min: any, user: String) {
        const client = await this.pool.connect();
        try {
            // console.log("Connected successfully.")
            await client.query("BEGIN");

            const query =
                "SELECT * from carrot_board where emoji = $1 and count >= $2 and user_id = $3 ORDER BY count DESC";

            const values = [emoji, count_min, user];
            const result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
            // console.log("Client released successfully.");
        }
    }
}

module.exports = {
    DBcarrotboard,
};

// Anonymous function for testing purposes
/*
(async () => {
    let db = new DBcarrotboard();
    //console.log(user)
})();

*/
