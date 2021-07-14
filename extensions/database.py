import psycopg2

con = psycopg2.connect(user="user", password="pass", host="localhost", port="5432")

cur = con.cursor()
cur.execute('')
# Note create table

con.commit()
con.close()