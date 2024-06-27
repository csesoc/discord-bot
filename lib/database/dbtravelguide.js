const { Pool } = require("pg");
const yaml = require("js-yaml");
const fs = require("fs");

class DBTravelguide {
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

        const table_name = "travelguide";

        // Creates the table if it doesn't exists
        (async () => {
            const is_check = await this.check_table(table_name);
            if (is_check == false) {
                await this.create_travelguide_table();
            }
        })();
    }

    // Get document, or throw exception on error
    load_db_login() {
        try {
            const doc = yaml.load(fs.readFileSync("./config/database.yml"));
            return doc;
        } catch (ex) {
            console.log(`Something wrong happened in travelguide load_db_login ${ex}`);
        }
    }

    // Checks if the table exists in the db
    async check_table(table_name) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [table_name];
            const result = await client.query(
                "SELECT * FROM information_schema.tables WHERE table_name=$1",
                values,
            );
            await client.query("COMMIT");

            if (result.rowCount == 0) {
                return false;
            } else {
                return true;
            }
        } catch (ex) {
            console.log(`Something wrong happened in travelguide check_table ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    // Creates a new table for travelguide messages
    async create_travelguide_table() {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const query = `CREATE TABLE TRAVELGUIDE (
                REC_ID TEXT PRIMARY KEY,
                LOCATION TEXT NOT NULL,
                DESCRIPTION TEXT NOT NULL,
                SEASON TEXT,
                CATEGORY TEXT NOT NULL,
                LIKES NUMERIC[],
                AUTHOR_ID NUMERIC NOT NULL,
                DATE_ADDED TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`;
            await client.query(query);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happened in travelguide create_travelguide_table${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Adds new recommendation to the db
     * @param {String} recommendationId
     * @param {String} location
     * @param {String} description
     * @param {String} season
     * @param {String} category
     * @param {Number} authorId
     */
    async addRecommendation(recommendationId, location, description, season, category, authorId) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const query = `INSERT INTO TRAVELGUIDE (REC_ID, LOCATION, DESCRIPTION, SEASON, 
                                CATEGORY, LIKES, AUTHOR_ID) VALUES ($1,$2,$3,$4,$5,$6,$7)`;
            const likes = [];
            const values = [
                recommendationId,
                location,
                description,
                season,
                category,
                likes,
                authorId,
            ];
            await client.query(query, values);
            await client.query("COMMIT");
        } catch (ex) {
            console.log(`Something wrong happend in travelguide addRecommendation ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Adds/removes a userid to/from a recommendation's 'likes'
     * @param {Number} userId
     * @param {String} recommendationId
     */
    async likeRecommendation(userId, recommendationId) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const checkQuery = `SELECT LIKES FROM TRAVELGUIDE WHERE REC_ID = $1`;
            const checkValues = [recommendationId];
            const result = await client.query(checkQuery, checkValues);

            if (result.rows.length > 0) {
                const likesArray = result.rows[0].likes;
                let updateQuery;
                const updateValues = [userId, recommendationId];

                if (likesArray.includes(parseInt(userId))) {
                    // Remove the userId from the likes array
                    updateQuery = `UPDATE TRAVELGUIDE SET LIKES = array_remove(LIKES, $1) WHERE REC_ID = $2`;
                } else {
                    // Add the userId to the likes array
                    updateQuery = `UPDATE TRAVELGUIDE SET LIKES = array_append(LIKES, $1) WHERE REC_ID = $2`;
                }
                await client.query(updateQuery, updateValues);
                await client.query("COMMIT");
            }
        } catch (ex) {
            console.log(`Something wrong happend in travelguide likeRecommendation${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Deletes a recommendation from the db
     * @param {Number} authorId
     * @param {String} recommendationId
     */
    async deleteRecommendation(authorId, recommendationId) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [authorId, recommendationId];
            const query = `DELETE FROM TRAVELGUIDE WHERE AUTHOR_ID=$1 AND REC_ID=$2`;

            await client.query(query, values);
            await client.query("COMMIT");
            console.log("in delete");
        } catch (ex) {
            console.log(`Something wrong happened in travelguide deleteRecommendation ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Gets all the recommendations from an author
     * @param {Number} authorid
     * @returns Recommendations from given author
     */
    async getAuthorRecommendations(authorId) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [authorId];
            const result = await client.query(
                "SELECT * FROM TRAVELGUIDE WHERE AUTHOR_ID=$1 ORDER BY DATE_ADDED",
                values,
            );
            await client.query("COMMIT");
            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend in travelguide getAuthorRecommendations${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Gets recommendations from category/season
     * @param {String} category
     * @param {String} season
     * @returns
     */
    async getRecommendations(category, season) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            let query = "SELECT * FROM TRAVELGUIDE";

            const values = [];
            let valueIndex = 1;

            if (category || season) {
                query += " WHERE";
                if (category) {
                    query += ` CATEGORY=$${valueIndex}`;
                    values.push(category);
                    valueIndex++;
                }
                if (season) {
                    if (category) {
                        query += " AND";
                    }
                    query += ` SEASON=$${valueIndex}`;
                    values.push(season);
                }
            }
            query += " ORDER BY DATE_ADDED";

            const result = await client.query(query, values);
            await client.query("COMMIT");
            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happened in travelguide - getRecommendations ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }

    /**
     * Gets a recommendation from location, description and category
     * @param {String} location
     * @param {String} description
     * @param {String} category
     * @returns row containing the recommendation
     */
    async getRecommendation(location, description, category) {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const values = [location, description, category];
            const result = await client.query(
                "SELECT * FROM TRAVELGUIDE WHERE LOCATION=$1 AND DESCRIPTION=$2 AND CATEGORY=$3",
                values,
            );
            await client.query("COMMIT");

            return result.rows;
        } catch (ex) {
            console.log(`Something wrong happend in travelguide getRecommendation ${ex}`);
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    }
}

module.exports = {
    DBTravelguide,
};
