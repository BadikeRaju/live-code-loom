import pymysql

host = "mysql-coflux-rajubadike3-5f6e.h.aivencloud.com"
port = 19729
user = "avnadmin"
password = "AVNS_8770IFuzA2kCOAhkqaI"
database = "defaultdb"

try:
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
        cursor.execute("DESCRIBE User;")
        columns = cursor.fetchall()
        print("User Columns:", [col["Field"] for col in columns])
        
        # also try to alter if missing
        fields = [col["Field"] for col in columns]
        if "githubToken" not in fields:
            print("githubToken is missing! Altering now...")
            cursor.execute("ALTER TABLE User ADD COLUMN githubToken VARCHAR(255);")
            print("Successfully added githubToken.")
            
except Exception as e:
    print("Error:", e)
finally:
    if 'conn' in locals() and conn:
        conn.close()
