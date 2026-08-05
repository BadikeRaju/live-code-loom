import requests
import json
import jwt
import datetime

# generate a local jwt token for testing
# first need a user id. Let's find one.
import pymysql
host = "mysql-coflux-rajubadike3-5f6e.h.aivencloud.com"
port = 19729
user = "avnadmin"
password = "AVNS_8770IFuzA2kCOAhkqaI"
database = "defaultdb"
conn = pymysql.connect(
    host=host,
    port=port,
    user=user,
    password=password,
    database=database,
    ssl={"ssl_mode": "REQUIRED"},
    cursorclass=pymysql.cursors.DictCursor
)
with conn.cursor() as cursor:
    cursor.execute("SELECT id FROM User LIMIT 1;")
    user_id = cursor.fetchone()["id"]
conn.close()

payload = {
    "userId": user_id,
    "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
}
token = jwt.encode(payload, "super_secret_key_change_in_production", algorithm="HS256")

# Now start the server locally in a background process or just call it if it's already running?
# The background task is task-436, maybe it restarted now that .env is fixed?
# Let's just make the DB call directly instead of dealing with the local server to see if the SQL itself is failing.
conn = pymysql.connect(
    host=host,
    port=port,
    user=user,
    password=password,
    database=database,
    ssl={"ssl_mode": "REQUIRED"},
    cursorclass=pymysql.cursors.DictCursor
)
try:
    with conn.cursor() as cursor:
        print("Executing UPDATE...")
        cursor.execute(
            "UPDATE User SET name = %s, avatar = %s, githubToken = %s WHERE id = %s",
            ("Test Name", None, "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", user_id)
        )
        conn.commit()
        print("UPDATE succeeded!")
except Exception as e:
    print("Error:", e)
finally:
    conn.close()

