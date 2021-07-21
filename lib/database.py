import psycopg2

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
        CREATE TABLE user_permission (
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


if __name__ == '__main__':
    create_user_tables()