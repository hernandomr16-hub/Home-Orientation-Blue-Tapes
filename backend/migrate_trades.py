"""
Migration script for adding trades table and trade_id column to contractors.
Run this script to update the database schema.
"""
import sqlite3
import json

# Default trades to seed
DEFAULT_TRADES = [
    {"name": "General", "icon": "🏗️", "order": 1},
    {"name": "Framing", "icon": "🪵", "order": 2},
    {"name": "Concrete", "icon": "🧱", "order": 3},
    {"name": "Electrical", "icon": "⚡", "order": 4},
    {"name": "Plumbing", "icon": "🔧", "order": 5},
    {"name": "HVAC", "icon": "❄️", "order": 6},
    {"name": "Flooring", "icon": "🪨", "order": 7},
    {"name": "Painting", "icon": "🎨", "order": 8},
    {"name": "Drywall", "icon": "📐", "order": 9},
    {"name": "Roofing", "icon": "🏠", "order": 10},
    {"name": "Windows/Doors", "icon": "🚪", "order": 11},
    {"name": "Cabinets", "icon": "🗄️", "order": 12},
    {"name": "Countertops", "icon": "🪨", "order": 13},
    {"name": "Appliances", "icon": "🔌", "order": 14},
    {"name": "Landscaping", "icon": "🌳", "order": 15},
    {"name": "Insulation", "icon": "🧊", "order": 16},
    {"name": "Siding", "icon": "🏢", "order": 17},
    {"name": "Gutters", "icon": "💧", "order": 18},
    {"name": "Cleaning", "icon": "🧹", "order": 19},
]


def migrate():
    try:
        conn = sqlite3.connect('blue_tape.db')
        cursor = conn.cursor()
        
        # ==================== Create trades table ====================
        print("Creating trades table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(50),
                "order" INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """)
        conn.commit()
        print("✓ Trades table created/verified.")
        
        # ==================== Seed default trades ====================
        cursor.execute("SELECT COUNT(*) FROM trades")
        trade_count = cursor.fetchone()[0]
        
        if trade_count == 0:
            print("Seeding default trades...")
            for trade in DEFAULT_TRADES:
                cursor.execute(
                    'INSERT INTO trades (name, icon, "order", is_active) VALUES (?, ?, ?, 1)',
                    (trade["name"], trade["icon"], trade["order"])
                )
            conn.commit()
            print(f"✓ Inserted {len(DEFAULT_TRADES)} default trades.")
        else:
            print(f"✓ Trades table already has {trade_count} records.")
        
        # ==================== Add trade_id column to contractors ====================
        cursor.execute("PRAGMA table_info(contractors)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'trade_id' not in columns:
            print("Adding trade_id column to contractors...")
            cursor.execute("ALTER TABLE contractors ADD COLUMN trade_id INTEGER REFERENCES trades(id)")
            conn.commit()
            print("✓ trade_id column added to contractors.")
            
            # ==================== Migrate existing contractors ====================
            print("Migrating existing contractors to trades...")
            cursor.execute("SELECT id, trades FROM contractors WHERE trades IS NOT NULL")
            contractors = cursor.fetchall()
            
            migrated = 0
            for contractor_id, trades_json in contractors:
                if trades_json:
                    try:
                        trades_list = json.loads(trades_json)
                        if trades_list and len(trades_list) > 0:
                            first_trade_name = trades_list[0]
                            # Find matching trade
                            cursor.execute("SELECT id FROM trades WHERE name = ?", (first_trade_name,))
                            trade_row = cursor.fetchone()
                            if trade_row:
                                cursor.execute(
                                    "UPDATE contractors SET trade_id = ? WHERE id = ?",
                                    (trade_row[0], contractor_id)
                                )
                                migrated += 1
                    except json.JSONDecodeError:
                        pass
            
            conn.commit()
            print(f"✓ Migrated {migrated} contractors to their trade categories.")
        else:
            print("✓ trade_id column already exists in contractors.")
        
        conn.close()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        raise


if __name__ == "__main__":
    migrate()
