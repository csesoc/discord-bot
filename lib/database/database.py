import psycopg2
import datetime

# Connect to the PostgreSQL database server
postgresConnection = psycopg2.connect(dbname = "bot", user="user", password="pass", host="localhost", port="40041")

# this function creates tables in the PostgreSQL database -- WORKING
def create_user_tables():
    
    # Creating 4 different tables
    command1 = """
        CREATE TABLE users (
            userid INTEGER PRIMARY KEY,
            joindate DATE NOT NULL,
            leavedate DATE,
            userleft BOOLEAN
        );
    """
    command2 = """
        CREATE TABLE user_roles (
            rid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            role varchar(64),
            FOREIGN KEY (userid)
            REFERENCES users (userid)
        );
    """
    command3 = """
        CREATE TABLE user_channels (
            cid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            channel varchar(64),
            FOREIGN KEY (userid)
            REFERENCES users (userid)
        );
    """
    command4 = """
        CREATE TABLE user_permissions (
            pid INTEGER PRIMARY KEY,
            userid INTEGER NOT NULL,
            permission varchar(64),
            FOREIGN KEY (userid)
            REFERENCES users (userid)
        );
    """
    commands = [command1, command2, command3, command4]

    try:
        # connect to the PostgreSQL server
        cur = postgresConnection.cursor()
        # create table one by one
        for command in commands:
            cur.execute(command)
        # close communication with the PostgreSQL database server
        cur.close()
        # commit the changes
        postgresConnection.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
    finally:
        cur.close()
        postgresConnection.commit()


# This functions counts total number of users in the server. -- WORKING
def count_users():
    cur = postgresConnection.cursor()
    cur.execute('''select count(userid) from users where userleft=False''')
    record = cur.fetchone()
    return record[0]

# This functions counts total number of roles a user has. -- WORKING
def count_user_roles(userid):
    cursor = postgresConnection.cursor()
    postgres_query = ''' SELECT COUNT(DISTINCT role) from user_roles where userid = %s '''
    record_query = (userid,)
    cursor.execute(postgres_query, record_query)
    records = cursor.fetchone()
    cursor.close()
    count = records[0]
    return count

# This functions counts total number of channels a user is in. -- WORKING
def count_user_channels(userid):
    cursor = postgresConnection.cursor()
    postgres_query = ''' SELECT COUNT(DISTINCT channel) from user_channels where userid = %s '''
    
    record_query = (userid,)
    cursor.execute(postgres_query, record_query)
    records = cursor.fetchone()
    cursor.close()
    count = records[0]
    return count

# This functions counts total number of permissions a user has. -- WORKING
def count_user_permissions(userid):
    cursor = postgresConnection.cursor()
    postgres_query = ''' SELECT COUNT(DISTINCT permission) from user_permissions where userid = %s '''
    
    record_query = (userid,)
    cursor.execute(postgres_query, record_query)
    records = cursor.fetchone()
    cursor.close()
    count = records[0]
    return count

# Query if user has left server - if the user has left the server, we update userleft to True
def user_leave(userid):
    time = datetime.datetime.now().replace(microsecond=0).isoformat()
    cursor = postgresConnection.cursor()
    postgres_insert_query = ''' UPDATE users 
                                SET leavedate = %s where userid = %s
                                SET userleft = %s where userid = %s '''
                                
    record_to_insert = (time, userid, True, userid)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Query if user has joined server
def user_leave(userid):

    time = datetime.datetime.now().replace(microsecond=0).isoformat()
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
                                SET userleft = %s where userid = %s '''          
        record_to_insert = (time, userid, False, userid)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()
    else:
        # new user
        postgres_insert_query = ''' INSERT INTO users (USERID, JOINDATE, LEAVEDATE, USERLEFT) VALUES (%s, %s, %s, %s) '''          
        record_to_insert = (userid, time, None, False)
        cursor.execute(postgres_insert_query, record_to_insert)
        postgresConnection.commit()
        cursor.close()

# Add user role -- WORKING
def add_user_role(userid, role):

    cursor = postgresConnection.cursor()
    # get count
    cursor.execute( ''' SELECT count(rid) from user_roles ''')
    records = cursor.fetchone()
    count = records[0]
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_roles (RID, USERID, ROLE) VALUES (%s,%s,%s)'''
    record_to_insert = (count, userid, role)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Delete User role -- WORKING
def remove_user_role(userid, role):

    cursor = postgresConnection.cursor()
    postgres_delete_query = ''' DELETE FROM user_roles
                                where userid = %s and role = %s '''
    record_to_delete = (userid, role)
    cursor.execute(postgres_delete_query, record_to_delete)
    cursor.close()
    postgresConnection.commit()
    
# Add User Permission --WORKING
def add_user_permission(userid, permission):

    cursor = postgresConnection.cursor()
    # get count
    cursor.execute( ''' SELECT count(pid) from user_permissions ''')
    records = cursor.fetchone()
    count = records[0]
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_permissions (PID, USERID, PERMISSION) VALUES (%s,%s,%s)'''
    record_to_insert = (count, userid, permission)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Delete User Permission -- WORKING
def remove_user_permission(userid, permission):

    cursor = postgresConnection.cursor()
    postgres_delete_query = ''' DELETE FROM user_permissions
                                where userid = %s and permission = %s '''
    record_to_delete = (userid, permission)
    cursor.execute(postgres_delete_query, record_to_delete)
    postgresConnection.commit()
    cursor.close()

# Add User Channel -- WORKING
def user_join_channel(userid, channel):
    cursor = postgresConnection.cursor()
    # get count
    cursor.execute( ''' SELECT count(cid) from user_channels ''')
    records = cursor.fetchone()
    count = records[0]
    count = count + 1
    
    postgres_insert_query = ''' INSERT INTO user_channels (CID, USERID, CHANNEL) VALUES (%s,%s,%s)'''
    record_to_insert = (count, userid, channel)
    cursor.execute(postgres_insert_query, record_to_insert)
    postgresConnection.commit()
    cursor.close()

# Leave user channel -- WORKING
def user_leave_channel(userid, channel):

    cursor = postgresConnection.cursor()
    postgres_delete_query = ''' DELETE FROM user_channels
                                where userid = %s and channel = %s '''
    record_to_delete = (userid, channel)
    cursor.execute(postgres_delete_query, record_to_delete)
    postgresConnection.commit()
    cursor.close()
################################################ TESTING ##############################################

def main():
    pass
    

if __name__ == "__main__":
    main()
