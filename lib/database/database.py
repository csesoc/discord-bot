import psycopg2
import datetime
from ruamel.yaml import YAML

yaml = YAML()

class DBuser:
    
    def __init__(self):
        # Loads the credential for the db
        data = self.load_db_login()
        dbname = data['dbname']
        user = data['user']
        password = data['password']
        host = data['host']
        port = data['port']

        # Connect to the PostgreSQL database server
        self.postgresConnection = psycopg2.connect(dbname = dbname, user=user, password=password, host=host, port=port)

        self.create_user_tables()
    
    
    # Loads the db credentials from the file
    def load_db_login(self):
        with open('./data/config/database.yml') as file:
            settings = yaml.load(file)
        return settings

    # this function creates tables in the PostgreSQL database -- WORKING
    def create_user_tables(self):
        
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
        # create table one by one
        for command in commands:
            try:
                # connect to the PostgreSQL server
                cur = self.postgresConnection.cursor()
        
                cur.execute(command)
                # close communication with the PostgreSQL database server
                cur.close()
                # commit the changes
                self.postgresConnection.commit()
            except (Exception, psycopg2.DatabaseError) as error:
                print(error)
            finally:
                cur.close()
                self.postgresConnection.commit()


    # This functions counts total number of users in the server. -- WORKING
    def count_users(self):
        cur = self.postgresConnection.cursor()
        cur.execute('''select count(userid) from users where userleft=False''')
        record = cur.fetchone()
        return record[0]

    # This functions counts total number of roles a user has. -- WORKING
    def count_user_roles(self, userid):
        cursor = self.postgresConnection.cursor()
        postgres_query = ''' SELECT COUNT(DISTINCT role) from user_roles where userid = %s '''
        record_query = (userid,)
        cursor.execute(postgres_query, record_query)
        records = cursor.fetchone()
        cursor.close()
        count = records[0]
        return count

    # This functions counts total number of channels a user is in. -- WORKING
    def count_user_channels(self, userid):
        cursor = self.postgresConnection.cursor()
        postgres_query = ''' SELECT COUNT(DISTINCT channel) from user_channels where userid = %s '''
        
        record_query = (userid,)
        cursor.execute(postgres_query, record_query)
        records = cursor.fetchone()
        cursor.close()
        count = records[0]
        return count

    # This functions counts total number of permissions a user has. -- WORKING
    def count_user_permissions(self, userid):
        cursor = self.postgresConnection.cursor()
        postgres_query = ''' SELECT COUNT(DISTINCT permission) from user_permissions where userid = %s '''
        
        record_query = (userid,)
        cursor.execute(postgres_query, record_query)
        records = cursor.fetchone()
        cursor.close()
        count = records[0]
        return count

    # Query if user has left server - if the user has left the server, we update userleft to True
    def user_leave(self, userid):
        time = datetime.datetime.now().replace(microsecond=0).isoformat()
        cursor = self.postgresConnection.cursor()
        postgres_insert_query = ''' UPDATE users 
                                    SET leavedate = %s where userid = %s
                                    SET userleft = %s where userid = %s '''
                                    
        record_to_insert = (time, userid, True, userid)
        cursor.execute(postgres_insert_query, record_to_insert)
        self.postgresConnection.commit()
        cursor.close()

    # Query if user has joined server
    def user_join(self, userid):

        time = datetime.datetime.now().replace(microsecond=0).isoformat()
        cursor = self.postgresConnection.cursor()

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
            self.postgresConnection.commit()
            cursor.close()
        else:
            # new user
            postgres_insert_query = ''' INSERT INTO users (USERID, JOINDATE, LEAVEDATE, USERLEFT) VALUES (%s, %s, %s, %s) '''          
            record_to_insert = (userid, time, None, False)
            cursor.execute(postgres_insert_query, record_to_insert)
            self.postgresConnection.commit()
            cursor.close()

    # Add user role -- WORKING
    def add_user_role(self, userid, role):

        cursor = self.postgresConnection.cursor()
        # get count
        cursor.execute( ''' SELECT count(rid) from user_roles ''')
        records = cursor.fetchone()
        count = records[0]
        count = count + 1
        
        postgres_insert_query = ''' INSERT INTO user_roles (RID, USERID, ROLE) VALUES (%s,%s,%s)'''
        record_to_insert = (count, userid, role)
        cursor.execute(postgres_insert_query, record_to_insert)
        self.postgresConnection.commit()
        cursor.close()

    # Delete User role -- WORKING
    def remove_user_role(self, userid, role):

        cursor = self.postgresConnection.cursor()
        postgres_delete_query = ''' DELETE FROM user_roles
                                    where userid = %s and role = %s '''
        record_to_delete = (userid, role)
        cursor.execute(postgres_delete_query, record_to_delete)
        cursor.close()
        self.postgresConnection.commit()
        
    # Add User Permission --WORKING
    def add_user_permission(self, userid, permission):

        cursor = self.postgresConnection.cursor()
        # get count
        cursor.execute( ''' SELECT count(pid) from user_permissions ''')
        records = cursor.fetchone()
        count = records[0]
        count = count + 1
        
        postgres_insert_query = ''' INSERT INTO user_permissions (PID, USERID, PERMISSION) VALUES (%s,%s,%s)'''
        record_to_insert = (count, userid, permission)
        cursor.execute(postgres_insert_query, record_to_insert)
        self.postgresConnection.commit()
        cursor.close()

    # Delete User Permission -- WORKING
    def remove_user_permission(self, userid, permission):

        cursor = self.postgresConnection.cursor()
        postgres_delete_query = ''' DELETE FROM user_permissions
                                    where userid = %s and permission = %s '''
        record_to_delete = (userid, permission)
        cursor.execute(postgres_delete_query, record_to_delete)
        self.postgresConnection.commit()
        cursor.close()

    # Add User Channel -- WORKING
    def user_join_channel(self, userid, channel):
        cursor = self.postgresConnection.cursor()
        # get count
        cursor.execute( ''' SELECT count(cid) from user_channels ''')
        records = cursor.fetchone()
        count = records[0]
        count = count + 1
        
        postgres_insert_query = ''' INSERT INTO user_channels (CID, USERID, CHANNEL) VALUES (%s,%s,%s)'''
        record_to_insert = (count, userid, channel)
        cursor.execute(postgres_insert_query, record_to_insert)
        self.postgresConnection.commit()
        cursor.close()

    # Leave user channel -- WORKING
    def user_leave_channel(self, userid, channel):

        cursor = self.postgresConnection.cursor()
        postgres_delete_query = ''' DELETE FROM user_channels
                                    where userid = %s and channel = %s '''
        record_to_delete = (userid, channel)
        cursor.execute(postgres_delete_query, record_to_delete)
        self.postgresConnection.commit()
        cursor.close()


################################################ TESTING ##############################################

def main():
    pass
    

if __name__ == "__main__":
    main()
