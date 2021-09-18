# import the PostgreSQL adapter for Python
import psycopg2
from ruamel.yaml import YAML

yaml = YAML()

class DBcarrotboard:

    def __init__(self):
        
        # Loads the credential for the db
        data = self.load_db_login()
        dbname = data['dbname']
        user = data['user']
        password = data['password']
        host = data['host']
        port = data['port']
        
        self.table_name = 'CARROT_BOARD'

        # Connect to the PostgreSQL database server
        self.postgresConnection = psycopg2.connect(dbname = dbname, user=user, password=password, host=host, port=port)

        # Try to create a table if it doesn't exist

        try:
            if self.check_table(self.table_name) is False:
                self.create_table()
        except(Exception, psycopg2.DatabaseError) as error:
            print(error)
        finally:
            self.postgresConnection.commit()

    # Creates a table to store the data for the carrotBoard
    def create_table(self):
        # Get cursor object from the database connection
        cursor = self.postgresConnection.cursor()

        # Create table statement
        sqlCreateTable = '''CREATE TABLE CARROT_BOARD(
            CARROT_ID SERIAL PRIMARY KEY,
            EMOJI CHAR(20) NOT NULL,
            MESSAGE_ID INT NOT NULL,
            USER_ID INT NOT NULL,
            CHANNEL_ID INT NOT NULL,
            COUNT BIGINT,
            MESSAGE_CONTENTS CHAR(50)
            )'''

        try:
            # Create a table in PostgreSQL database
            cursor.execute(sqlCreateTable)
            cursor.close()
            self.postgresConnection.commit()
        
        except(Exception, psycopg2.DatabaseError) as error:
            print(error)
        
        finally:
            cursor.close()
            self.postgresConnection.commit()

    # Checks if the given table exists
    def check_table(self,table_name):
        cur = self.postgresConnection.cursor()
        cur.execute("select * from information_schema.tables where table_name=%s", (table_name,))
        return bool(cur.rowcount)

    # Count the number of entries in the db for a specific message
    def count_values(self,emoji,message_id, user_id, channel_id):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT count(*) from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
        
        record_to_insert = (emoji, message_id,user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchall()
        cursor.close()
        return record[0][0]
    
    # Get the react count on a given message
    def get_count(self,emoji,message_id, user_id, channel_id):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
        record_to_insert = (emoji, message_id, user_id, channel_id)

        cursor.execute(postgres_insert_query, record_to_insert)

        record = cursor.fetchone()
        cursor.close()

        # None check
        if record is None:
            return None
        
        return record[5]
 
    # Loads the db credentials from the file
    def load_db_login(self):
        with open('./data/config/database.yml') as file:
            settings = yaml.load(file)
        return settings

    # Inserts a given message to the database
    def add_value(self,emoji,message_id, user_id, channel_id,message_contents):

        count_val = self.count_values(emoji,message_id, user_id, channel_id)
        # Increase the count if the value exists else create a new value
        if count_val == 0 or count_val == None:
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT, MESSAGE_CONTENTS) VALUES (%s,%s,%s,%s,%s,%s)'''
            record_to_insert = (emoji, message_id, user_id, channel_id,1, message_contents)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

        else:
            count = self.get_count(emoji,message_id, user_id, channel_id)
            count = count + 1
            cursor = self.postgresConnection.cursor()
            postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
            record_to_insert = (count,emoji, message_id, user_id, channel_id)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

    # Retrieve an entry by carrotboard_id
    def get_by_cb_id(self,cb_id):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where carrot_id = %s'''
        record_to_insert = (str(cb_id))
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()
        return {
            'carrot_id':record[0],
            'emoji':record[1],
            'message_id':record[2],
            'user_id':record[3],
            'channel_id':record[4],
            'count':record[5],
            'contents': record[6].rstrip(" "),
        }

    # Retrieve an entry by message id
    def get_by_msg_emoji(self,message_id, emoji):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where message_id = %s and emoji = %s'''
        record_to_insert = (message_id, emoji)
        cursor.execute(postgres_insert_query, record_to_insert)
        record = cursor.fetchone()
        cursor.close()
        return {
            'carrot_id':record[0],
            'emoji':record[1],
            'message_id':record[2],
            'user_id':record[3],
            'channel_id':record[4],
            'count':record[5],
            'contents': record[6].rstrip(" "),
        }

    # Get all the messages of a given react above a minimum threshold
    def get_all(self,emoji, count_min):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s'''
        record_to_insert = (emoji, count_min)
        cursor.execute(postgres_insert_query, record_to_insert)
        records = cursor.fetchall()
        cursor.close()
        return records

    # Deletes an entry from the db - An entry is all the rows with the same message_id
    def del_entry(self, message_id, channel_id):
        cursor = self.postgresConnection.cursor()
        postgres_delete_query = '''DELETE FROM carrot_board where message_id = %s and channel_id = %s'''
        record_to_delete = (message_id, channel_id)
        cursor.execute(postgres_delete_query, record_to_delete)
        self.postgresConnection.commit()
        cursor.close()

    # Deletes the specific emoji entry for a given message
    def del_entry_emoji(self, emoji, message_id, user_id, channel_id):
        cursor = self.postgresConnection.cursor()
        postgres_delete_query = '''DELETE FROM carrot_board where message_id = %s and channel_id = %s  and user_id = %s and emoji = %s'''
        record_to_delete = (message_id, channel_id, user_id, emoji)
        cursor.execute(postgres_delete_query, record_to_delete)
        self.postgresConnection.commit()
        cursor.close()

    # Subtracts the count of an emoji for a given message id by 1
    def sub_value(self, emoji, message_id, user_id, channel_id):

            count = self.get_count(emoji, message_id, user_id, channel_id)
            
            if count is None:
                return
            
            elif (count - 1) <= 0:
                # remove from database
                self.del_entry_emoji(emoji,message_id,user_id, channel_id)
            else:
                count = count - 1
                cursor = self.postgresConnection.cursor()
                postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
                record_to_insert = (count, emoji, message_id, user_id, channel_id)
                cursor.execute(postgres_insert_query, record_to_insert)
                self.postgresConnection.commit()
                cursor.close()

    # Get all the messages by emoji
    def get_all_by_emoji(self, emoji, count_min):
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s ORDER BY count DESC'''
        record_to_insert = (emoji, count_min)
        cursor.execute(postgres_insert_query, record_to_insert)
        records = cursor.fetchall()
        cursor.close()

        results = []
        for record in records:
            results.append(
                {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'contents': record[6].rstrip(" "),
                }
            )

        # results.sort(key=lambda x: x["count"], reverse=True)
        return results
    
    # Get all the messages by user_id
    def get_all_by_user(self, emoji, count_min, user):

        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s and user_id = %s ORDER BY count DESC'''
        record_to_insert = (emoji, count_min, user)
        cursor.execute(postgres_insert_query, record_to_insert)
        records = cursor.fetchall()
        cursor.close()

        results = []
        for record in records:
            results.append(
                {
                    'carrot_id': record[0],
                    'emoji': record[1],
                    'message_id': record[2],
                    'user_id': record[3],
                    'channel_id': record[4],
                    'count': record[5],
                    'contents': record[6].rstrip(" "),
                }
            )

        #results.sort(key=lambda x: x["count"], reverse=True)
        return results


