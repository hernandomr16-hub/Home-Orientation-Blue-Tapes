import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('blue_tape.db')
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(issues)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'resolution_notes' not in columns:
            print("Adding resolution_notes column...")
            cursor.execute("ALTER TABLE issues ADD COLUMN resolution_notes TEXT")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column resolution_notes already exists.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
