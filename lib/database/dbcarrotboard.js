//@ts-check

const { Pool } = require('pg')
const yaml = require('js-yaml');
const fs = require('fs');

class DBcarrotboard {
    constructor() {
        var details = this.load_db_login();

        this.pool = new Pool({
            user: details['user'],
            password: details['password'],
            host: details['host'],
            port: details['port'],
            database: details['dbname']
        })
        const table_name = 'carrot_board';

        (async () => {
            const is_check = await this.check_table(table_name);
            if (is_check == false) {
                await this.create_table();
            }

        })();
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = {
                "user": "user",
                "password": "pass",
                "host": "192.168.0.16",
                "port": 44444,
                "database": "user"
            }
            return doc;
        } catch (e) {
            console.log(e);
        }
    }

    async check_table(table_name) {
        const client = await this.pool.connect()
        try {
            console.log("Running check_table command")
            //await client.query("insert into employees values (1, 'John')")
            await client.query("BEGIN");
            const values = [table_name]
            var result = await client.query("select * from information_schema.tables where table_name=$1", values)
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return false;
            } else {
                return true;
            }

        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    async create_table() {
        const client = await this.pool.connect()
        try {
            console.log("Running create_table")
            await client.query("BEGIN");
            var query = `CREATE TABLE CARROT_BOARD(
                CARROT_ID SERIAL PRIMARY KEY,
                EMOJI CHAR(20) NOT NULL,
                MESSAGE_ID INT NOT NULL,
                USER_ID INT NOT NULL,
                CHANNEL_ID INT NOT NULL,
                COUNT BIGINT,
                MESSAGE_CONTENTS CHAR(50)
                )`;

            var result = await client.query(query)
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    async count_values(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            //await client.query("insert into employees values (1, 'John')")
            await client.query("BEGIN");

            var query = `SELECT count(*) from carrot_board where emoji = $1 and message_id = $2 and user_id = $3 and channel_id = $4`;

            var values = [emoji, message_id, user_id, channel_id]
            const result = await client.query(query, values)
            await client.query("COMMIT");

            // will always have one because count(*)
            return result['rows'][0]['count'];
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    /** @returns {Promise<?Number>} */
    async get_count(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            //await client.query("insert into employees values (1, 'John')")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where emoji = $1 and message_id = $2 and user_id = $3 and channel_id = $4`;

            var values = [emoji, message_id, user_id, channel_id]
            var result = await client.query(query, values)
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return null;
            }

            return result.rows[0].count;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    async add_value(emoji, message_id, user_id, channel_id, message_contents) {
        const client = await this.pool.connect()
        try {
            await client.query("BEGIN");
            var count_val = await this.count_values(emoji, message_id, user_id, channel_id)

            if (count_val == 0) {
                var query = `INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT, MESSAGE_CONTENTS) VALUES ($1,$2,$3,$4,$5,$6)`;
                var values = [emoji, message_id, user_id, channel_id, 1, message_contents];

                var result = await client.query(query, values);
                await client.query("COMMIT");
            } else {
                var count = await this.get_count(emoji, message_id, user_id, channel_id);
                count = Number(count) + 1;
                var query = `UPDATE carrot_board SET count = $1  where emoji = $2 and message_id = $3 and user_id = $4 and channel_id = $5`;
                var values = [count, emoji, message_id, user_id, channel_id]

                var result = await client.query(query, values)
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    /** @returns {Promise<?CarrotboardEntryType>} */
    async get_by_cb_id(cb_id) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            //await client.query("insert into employees values (1, 'John')")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where carrot_id = $1`;

            var values = [cb_id]
            var result = await client.query(query, values)
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return null;
            }

            return {
                'carrot_id': result.rows[0]['carrot_id'],
                'emoji': result.rows[0]['emoji'].trim(),
                'message_id': result.rows[0]['message_id'],
                'user_id': result.rows[0]['user_id'],
                'channel_id': result.rows[0]['channel_id'],
                'count': result.rows[0]['count'],
                'message_contents': result.rows[0]['message_contents'].trim()
            };
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`)
        } finally {
            await client.query("ROLLBACK");
            client.release()
            console.log("Client released successfully.")
        }
    }

    /** @returns {Promise<?CarrotboardEntryType>} */
    async get_by_msg_emoji(message_id, emoji) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where message_id = $1 and emoji = $2`;

            var values = [message_id, emoji];
            var result = await client.query(query, values);
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return null;
            }

            return {
                'carrot_id': result.rows[0]['carrot_id'],
                'emoji': result.rows[0]['emoji'].trim(),
                'message_id': result.rows[0]['message_id'],
                'user_id': result.rows[0]['user_id'],
                'channel_id': result.rows[0]['channel_id'],
                'count': result.rows[0]['count'],
                'message_contents': result.rows[0]['message_contents'].trim()
            };
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    /* Return has changed from a simple list to a list of dictionary
    
    [{
        carrot_id: 12,
        emoji: ,
        message_id: ,
        user_id: ,
        channel_id: ,
        count:,
        message_contents:
    }]
    */
    /** @returns {Promise<CarrotboardEntryType[]>} */
    async get_all(emoji, count_min) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where emoji = $1 and count >= $2`;

            var values = [emoji, count_min];
            var result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        }
        catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        }
        finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    async del_entry(message_id, channel_id) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `DELETE FROM carrot_board where message_id = $1 and channel_id = $2`;

            var values = [message_id, channel_id];
            var result = await client.query(query, values);
            await client.query("COMMIT");

        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    async del_entry_emoji(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `DELETE FROM carrot_board where message_id = $1 and channel_id = $2  and user_id = $3 and emoji = $4`;

            var values = [message_id, channel_id, user_id, emoji];
            var result = await client.query(query, values);
            await client.query("COMMIT");

        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    async sub_value(emoji, message_id, user_id, channel_id) {
        const client = await this.pool.connect()
        try {
            var count = await this.get_count(emoji, message_id, user_id, channel_id)
            if (count == null) {
                return;
            }

            if ((count - 1) <= 0) {
                this.del_entry_emoji(emoji, message_id, user_id, channel_id)
            } else {
                console.log("Connected successfully.")
                await client.query("BEGIN");

                count = count - 1;
                var query = `UPDATE carrot_board SET count = $1  where emoji = $2 and message_id = $3 and user_id = $4 and channel_id = $5`;

                var values = [count, emoji, message_id, user_id, channel_id];
                var result = await client.query(query, values);
                await client.query("COMMIT");

            }
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    /*
        A key has been changed in the return list of dictionaries - 
        contents keyword has been changed to message_contents
        Older -  {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'contents': record[6],
                }
        
                New - {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'message_contents': record[6],
                }
    */
    /** @returns {Promise<CarrotboardEntryType[]>} */
    async get_all_by_emoji(emoji, count_min) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where emoji = $1 and count >= $2 ORDER BY count DESC`;

            var values = [emoji, count_min];
            var result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }

    /*
        A key has been changed in the return list of dictionaries - 
        contents keyword has been changed to message_contents
        Older -  {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'contents': record[6],
                }
        
                New - {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'message_contents': record[6],
                }
    */
    /** @returns {Promise<CarrotboardEntryType[]>} */
    async get_all_by_user(emoji, count_min, user) {
        const client = await this.pool.connect()
        try {
            console.log("Connected successfully.")
            await client.query("BEGIN");

            var query = `SELECT * from carrot_board where emoji = $1 and count >= $2 and user_id = $3 ORDER BY count DESC`;

            var values = [emoji, count_min, user];
            var result = await client.query(query, values);
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
            console.log("Client released successfully.");
        }
    }
}

class CarrotboardEntryType {
    /** @readonly @type {Number} */
    carrot_id;
    /** @readonly @type {String} */
    emoji;
    /** @readonly @type {String} */
    count;
    /** @readonly @type {String} */
    user_id;
    /** @readonly @type {String} */
    message_id;
    /** @readonly @type {String} */
    channel_id;
    /** @readonly @type {String} */
    message_contents;

    static keys = ["carrot_id", "emoji", "count", "user_id", "message_id", "channel_id", "message_contents"];
}


//Anonymous function for testing purposes
(async () => {
    // var db = new DBcarrotboard();    
    //console.log(user)
})();

module.exports = {
    DBcarrotboard,
}