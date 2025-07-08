#!/usr/bin/env python3
"""
Quick database check for PlotWeaver
See what projects exist in the database
"""

import sqlite3
import json
from datetime import datetime

# Connect to SQLite database
db_path = "/home/tmcfar/dev/pw2/plotweaver.db"

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("🗄️  PlotWeaver Database Status")
    print("=" * 50)
    
    # Check for projects table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
    if cursor.fetchone():
        # Get all projects
        cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
        projects = cursor.fetchall()
        
        print(f"\n📚 Projects: {len(projects)} found")
        print("-" * 50)
        
        for project in projects:
            print(f"\nID: {project['id']}")
            print(f"Name: {project['name']}")
            print(f"Description: {project['description'] or 'None'}")
            print(f"Path: {project['path']}")
            print(f"Mode Set: {project['mode_set']}")
            print(f"Git Initialized: {project['git_initialized']}")
            
            # Parse statistics if it's JSON
            if project['statistics']:
                try:
                    stats = json.loads(project['statistics'])
                    print(f"Statistics:")
                    print(f"  - Words: {stats.get('total_words', 0)}")
                    print(f"  - Scenes: {stats.get('total_scenes', 0)}")
                    print(f"  - Chapters: {stats.get('total_chapters', 0)}")
                except:
                    print(f"Statistics: {project['statistics']}")
                    
            print(f"Created: {project['created_at']}")
            print("-" * 30)
    else:
        print("❌ No projects table found!")
        
        # Show what tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\nExisting tables: {[t['name'] for t in tables]}")
        
    conn.close()
    
except sqlite3.Error as e:
    print(f"❌ Database error: {e}")
except FileNotFoundError:
    print(f"❌ Database not found at: {db_path}")
    print("Run the backend first to create the database")
