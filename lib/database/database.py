import psycopg2
import datetime

# Connect to the PostgreSQL database server
postgresConnection = psycopg2.connect(dbname = "bot", user="user", password="pass", host="localhost", port="40041")

def create_user_tables():
    """ create tables in the PostgreSQL database"""
    commands = (
        """
        CREATE TABLE users (
            userid INTEGER PRIMARY KEY,
            joindate DATE NOT NULL,
            leavedate DATE,
            left boolean
        )
        """,
        """
        CREATE TABLE user_roles (
            rid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            role varchar(64),
            FOREIGN KEY (userid),
            REFERENCES users (userid)
        )
        """,

        """
        CREATE TABLE user_channels (
            cid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            channel varchar(64),
            FOREIGN KEY (userid),
            REFERENCES users (userid)
        )
        """,

        """
        CREATE TABLE user_permissions (
            pid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            permission varchar(64)
            FOREIGN KEY (userid)
            REFERENCES users (userid)
        )
        """
    )

    con = None
    try:
        # connect to the PostgreSQL server
        con = psycopg2.connect(user="user", password="pass", host="localhost", port="5432")
        cur = con.cursor()
        # create table one by one
        for command in commands:
            cur.execute(command)
        # close communication with the PostgreSQL database server
        cur.close()
        # commit the changes
        con.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        if con is not None:
            con.close()


def count_users():
    cur = postgresConnection.cursor()
    cur.execute("select * from information_schema.tables where table_name=users")
    return bool(cur.rowcount)

def count_user_roles(userid):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT count(*) FROM users u
                                JOIN user_roles ur ON u.userid = ur.userid
                                where u.userid = %s '''
    
    record_to_insert = (userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchall()
    cursor.close()
    return record[0][0]

def count_user_channels(userid):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT count(*) FROM users u
                                JOIN user_channels uc ON u.userid = uc.userid
                                where u.userid = %s '''
    
    record_to_insert = (userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchall()
    cursor.close()
    return record[0][0]

def count_user_permissions(userid):
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' SELECT count(*) FROM users u
                                JOIN user_permissions up ON u.userid = up.userid
                                where u.userid = %s '''
    
    record_to_insert = (userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchall()
    cursor.close()
    return record[0][0]

# Query if user has left server
def user_leave(userid):
    date = datetime.datetime.now().replace(microsecond=0).isoformat()
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' UPDATE users 
                                SET leavedate = %s where userid = %s
                                SET left = %s where userid = %s '''
                                
    record_to_insert = (date, userid, True, userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Query if user has joined server
def user_leave(userid):

    date = datetime.datetime.now().replace(microsecond=0).isoformat()
    cursor = postgresConnection.cursor()

    # first check if user has rejoined server after leaving
    postgres_insert_query = ''' SELECT * FROM users WHERE userid = %s '''
    record_to_insert = (userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    record = cursor.fetchall()

    if record != None:
        # user already exists
        postgres_insert_query = ''' UPDATE users 
                                SET joindate = %s where userid = %s
                                SET left = %s where userid = %s '''          
        record_to_insert = (date, userid, False, userid)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()
    else:
        # new user
        postgres_insert_query = ''' INSERT INTO users (USERID, JOINDATE, LEAVEDATE, LEFT) VALUES (%s, %s, %s, %s) '''          
        record_to_insert = (userid, date, None, False)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()

# Add user role
def add_user_role(userid, role):

    cursor = postgresConnection.cursor()
    # get count
    postgres_insert_query = ''' SELECT max(rid) from user_roles '''
    count = cursor.fetchall()
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_roles (RID, USERID, ROLE) VALUES (%s,%s,%s,%s)'''
    record_to_insert = (count, userid, role)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Delete User role
def remove_user_role(userid, role):

    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' DELETE FROM user_roles
                                where userid = %s and role = %s '''
    record_to_insert = (userid, role)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Add User Permission
def add_user_permission(userid, permission):

    cursor = postgresConnection.cursor()
    # get count
    postgres_insert_query = ''' SELECT max(pid) from user_permissions '''
    count = cursor.fetchall()
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_permissions (RID, USERID, PERMISSION) VALUES (%s,%s,%s)'''
    record_to_insert = (count, userid, permission)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Delete User Permission
def remove_user_permission(userid, permission):

    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' DELETE FROM user_permissions
                                where userid = %s and permission = %s '''
    record_to_insert = (userid, permission)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Add User Channel
def user_join_channel(userid, channel):
    cursor = postgresConnection.cursor()
    # get count
    postgres_insert_query = ''' SELECT max(cid) from user_channels '''
    count = cursor.fetchall()
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_channels (CID, USERID, CHANNEL) VALUES (%s,%s,%s)'''
    record_to_insert = (count, userid, channel)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()