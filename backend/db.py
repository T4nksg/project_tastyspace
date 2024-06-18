from pathlib import Path
import psycopg2
from flask import g
from flask import Flask 

app = Flask(__name__) 

# Connect to the database
def get_db() -> psycopg2.extensions.connection:
    if "db" not in g:
        g.db = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        g.db.autocommit = True
    return g.db

# Close the connection to the database
def close_db():
    """Close the connection to the SQLite database"""
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db() -> None:
    SCHEMA_PATH = Path("schema.sql")
    
    db = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
    db.autocommit = True
    cursor = db.cursor()
    
    schema = SCHEMA_PATH.read_text()
    cursor.execute(schema)
    
    db.commit()
    cursor.close()
    db.close()

if __name__ == "__main__": 
    with app.app_context():
        init_db()