# import the PostgreSQL adapter for Python
import psycopg2

# Connect to the PostgreSQL database server
postgresConnection = psycopg2.connect(dbname = "bot", user="user", password="pass", host="localhost", port="40041")

# Creates a table to store the data for the carrotBoard
def create_table():
    # Get cursor object from the database connection
    cursor = postgresConnection.cursor()

    # Create table statement
    sqlCreateTable = '''CREATE TABLE CARROT_BOARD(
           CARROT_ID SERIAL PRIMARY KEY,
           EMOJI CHAR(20) NOT NULL,
           MESSAGE_ID INT NOT NULL,
           USER_ID INT NOT NULL,
           CHANNEL_ID INT NOT NULL,
           COUNT INT
        )'''

    try:
        # Create a table in PostgreSQL database
        cursor.execute(sqlCreateTable)
        cursor.close()
        postgresConnection.commit()
    
    except(Exception, psycopg2.DatabaseError) as error:
        print(error)
    
    finally:
        cursor.close()
        postgresConnection.commit()

# Checks if the table exists
def check_table(table_name):
    cur = postgresConnection.cursor()
    cur.execute("select * from information_schema.tables where table_name=%s", (table_name,))
    return bool(cur.rowcount)


def count_values(emoji,message_id, user_id, channel_id):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT count(*) from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
    
    record_to_insert = (emoji, message_id, user_id, channel_id)
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchall()
    cursor.close()
    return record[0][0]

def get_count(emoji,message_id, user_id, channel_id):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
    record_to_insert = (emoji, message_id, user_id, channel_id)

    cursor.execute(postgres_insert_query, record_to_insert)

    record = cursor.fetchone()
    cursor.close()
    return record[5]
    
def add_value(emoji,message_id, user_id, channel_id):
    # Increase the count if the value exists else create a new value
    
    if(count_values(emoji,message_id, user_id, channel_id)) == 0:
        cursor = postgresConnection.cursor()
        postgres_insert_query = ''' INSERT INTO carrot_board (EMOJI, MESSAGE_ID, USER_ID, CHANNEL_ID, COUNT) VALUES (%s,%s,%s,%s,%s)'''
        record_to_insert = (emoji, message_id, user_id, channel_id,1)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()

    else:
        count = get_count(emoji,message_id, user_id, channel_id)
        count = count + 1
        cursor = postgresConnection.cursor()
        postgres_insert_query = ''' UPDATE carrot_board SET count = %s  where emoji = %s and message_id = %s and user_id = %s and channel_id = %s'''
        record_to_insert = (count,emoji, message_id, user_id, channel_id)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()

def get_by_cb_id(cb_id):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT * from carrot_board where carrot_id = %s'''
    record_to_insert = (str(cb_id))
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchone()
    print(record)
    cursor.close()
    return {
        'carrot_id':record[0],
        'emoji':record[1],
        'message_id':record[2],
        'user_id':record[3],
        'channel_id':record[4],
        'count':record[5]
    }

def get_by_msg_emoji(message_id, emoji):
    cursor = postgresConnection.cursor()
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
        'count':record[5]
    }

def get_all(emoji, count_min):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT * from carrot_board where emoji = %s and count >= %s'''
    record_to_insert = (emoji, count_min)
    cursor.execute(postgres_insert_query, record_to_insert)
    records = cursor.fetchall()
    cursor.close()
    return records

