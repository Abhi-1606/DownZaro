import os
import psycopg2
from psycopg2.extras import RealDictCursor
import sqlite3
import logging

logger = logging.getLogger("downzaro.db")

# PostgreSQL connection config for Docker container named "DownZaro"
PG_HOST = os.getenv("DB_HOST", "127.0.0.1")
PG_PORT = int(os.getenv("DB_PORT", "5432"))
PG_USER = os.getenv("DB_USER", "postgres")
PG_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
PG_DATABASE = os.getenv("DB_NAME", "DownZaro")

# SQLite fallback path
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    SQLITE_PATH = "/tmp/downzaro.db"
else:
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data")
    try:
        os.makedirs(data_dir, exist_ok=True)
        SQLITE_PATH = os.path.join(data_dir, "downzaro.db")
    except OSError:
        SQLITE_PATH = "/tmp/downzaro.db"


def get_pg_connection():
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DATABASE,
            connect_timeout=3
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        logger.warning(f"PostgreSQL connection to Docker container DownZaro failed: {e}. Falling back to SQLite.")
        return None


def get_sqlite_connection():
    db_dir = os.path.dirname(SQLITE_PATH)
    if db_dir:
        try:
            os.makedirs(db_dir, exist_ok=True)
        except OSError:
            pass
    conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initializes the database schema including the Credentials-DownZaro table."""
    pg_conn = get_pg_connection()
    if pg_conn:
        try:
            with pg_conn.cursor() as cur:
                # 1. Credentials-DownZaro Table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS "Credentials-DownZaro" (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        phone VARCHAR(50),
                        password_hash TEXT NOT NULL,
                        salt VARCHAR(64) NOT NULL,
                        passkey_credential_id TEXT,
                        passkey_public_key TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                ''')

                # 2. Sessions Table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS "sessions" (
                        token VARCHAR(128) PRIMARY KEY,
                        user_id INTEGER REFERENCES "Credentials-DownZaro"(id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
                    );
                ''')

                # 3. OTPs Table
                cur.execute('''
                    CREATE TABLE IF NOT EXISTS "otps" (
                        id SERIAL PRIMARY KEY,
                        destination VARCHAR(255) NOT NULL,
                        code VARCHAR(10) NOT NULL,
                        purpose VARCHAR(50) NOT NULL,
                        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        verified BOOLEAN DEFAULT FALSE
                    );
                ''')
            pg_conn.close()
            logger.info(" PostgreSQL Docker 'DownZaro' tables initialized: Credentials-DownZaro, sessions, otps")
            return
        except Exception as e:
            logger.error(f"Error initializing PostgreSQL tables: {e}")

    # Fallback to SQLite initialization
    sq_conn = get_sqlite_connection()
    try:
        cur = sq_conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS "Credentials-DownZaro" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                passkey_credential_id TEXT,
                passkey_public_key TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS "sessions" (
                token TEXT PRIMARY KEY,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            );
        ''')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS "otps" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                destination TEXT NOT NULL,
                code TEXT NOT NULL,
                purpose TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                verified INTEGER DEFAULT 0
            );
        ''')
        sq_conn.commit()
        sq_conn.close()
        logger.info(" SQLite fallback tables initialized.")
    except Exception as e:
        logger.error(f"Error initializing SQLite fallback: {e}")
