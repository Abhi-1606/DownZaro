#!/usr/bin/env python3
"""
DownZaro Database Inspector & Manager CLI
View, inspect, and update the "Credentials-DownZaro" table in Docker PostgreSQL.
"""
import os
import sys

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_pg_connection, get_sqlite_connection
from app.services import auth_service


def print_table():
    print("\n" + "=" * 80)
    print(" 🚀 DOWNZARO DATABASE INSPECTOR: [Docker Container: DownZaro]")
    print(" Table: Credentials-DownZaro")
    print("=" * 80)

    query = '''
        SELECT id, name, username, email, phone, 
               SUBSTRING(password_hash, 1, 10) || '...' as hash_preview,
               created_at
        FROM "Credentials-DownZaro"
        ORDER BY id ASC;
    '''
    rows = auth_service.execute_query(query, fetch_all=True)

    if not rows:
        print("  No records found in Credentials-DownZaro table.")
    else:
        header = f"{'ID':<4} | {'NAME':<20} | {'USERNAME':<14} | {'EMAIL':<26} | {'PHONE':<15} | {'HASH':<14}"
        print(header)
        print("-" * len(header))
        for r in rows:
            print(f"{r['id']:<4} | {r['name']:<20} | {r['username']:<14} | {r['email']:<26} | {str(r.get('phone') or ''):<15} | {r['hash_preview']:<14}")

    print("=" * 80 + "\n")
    print("📌 TablePlus Connection Details:")
    print("   • Host: 127.0.0.1 (or localhost)")
    print("   • Port: 5432")
    print("   • User: postgres")
    print("   • Password: postgres")
    print("   • Database: DownZaro")
    print("   • Table Name: \"Credentials-DownZaro\"")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    print_table()  
