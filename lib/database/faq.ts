import { Pool } from "pg";;
const yaml = require("js-yaml");
import fs from "fs";

// Class for the carrotboard db
export class DBFaq {
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
        const table_name = "faq";

        // Creates the table if it doesn't exists
        (async () => {
            const table_exists = await this.check_table(table_name);
            if (!table_exists) {
                await this.create_table();
            }
        })();
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = yaml.load(fs.readFileSync("./config/database.yml"));
            return doc;
        } catch (e) {
            console.log(e);
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name: String) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [table_name];
            const result = await client.query(
                "select * from information_schema.tables where table_name=$1",
                values,
            );
            await client.query("COMMIT");

            // return whether there was a table or not
            return result.rowCount > 0;
        } catch (err) {
            console.log(`Something went wrong ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // Creates a new table
    async create_table() {
        const client = await this.pool.connect();
        try {
            console.log("Running create_table");
            await client.query("BEGIN");
            const query = `CREATE TABLE IF NOT EXISTS FAQ (
                KEYWORD TEXT PRIMARY KEY,
                ANSWER TEXT,
                TAGS TEXT
            )`;

            await client.query(query);
            await client.query("COMMIT");
        } catch (err) {
            console.log(`Something went wrong ${err}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // get a faq
    async get_faq(keyword: String) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = "SELECT * from faq where keyword = $1";
            const res = await client.query(query, [keyword]);
            await client.query("COMMIT");

            return res.rows;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // get all faqs that have a certain tag
    async get_tagged_faqs(tag: String) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = "SELECT * from faq where tags ~* $1";
            const tag_str = `(${tag}$)|(${tag},)`;
            // note: not using tag_str for testing purposes...
            const res = await client.query(query, [tag_str]);
            await client.query("COMMIT");

            return res.rows;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // get keywords
    async get_keywords() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = "SELECT keyword from faq";
            const res = await client.query(query);
            await client.query("COMMIT");

            let keyword_list = "";
            for (const row of res.rows) {
                keyword_list += `${row.keyword}\n`;
            }

            return keyword_list;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // get keywords
    async get_tags() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = "SELECT tags from faq";
            const res = await client.query(query);
            await client.query("COMMIT");

            const tag_list: string[] = [];
            for (const row of res.rows) {
                const tags: string[] = row.tags.split(",");
                tag_list.push(...tags);
            }

            const no_dups_tag_list = [...new Set(tag_list)];

            let tag_list_str = "";
            for (const tag of no_dups_tag_list) {
                tag_list_str += `${tag}\n`;
            }

            return tag_list_str;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // Insert a new faq
    async new_faq(keyword: String, answer: String, tags: String) {
        const client = await this.pool.connect();
        try {
            // check if its not already in
            const rows: any = await this.get_faq(keyword);
            if (rows.length != 0) {
                return false;
            }

            await client.query("BEGIN");

            const query = "INSERT INTO faq(keyword, answer, tags) VALUES ($1, $2, $3)";
            await client.query(query, [keyword, answer, tags]);
            await client.query("COMMIT");

            return true;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // delete a faq
    async del_faq(keyword: String) {
        const client = await this.pool.connect();
        try {
            // check if it exists first
            const rows: any = await this.get_faq(keyword);
            if (rows.length == 0) {
                return false;
            }

            await client.query("BEGIN");

            const query = "DELETE FROM faq WHERE keyword = $1";
            await client.query(query, [keyword]);
            await client.query("COMMIT");

            return true;
        } catch (err) {
            console.log(`FAQ DB ERR: ${err}`);
            return null;
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }
}

module.exports = {
    DBFaq,
};
