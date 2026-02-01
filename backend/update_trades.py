"""
Script to update trades with comprehensive list for new construction
"""
import sqlite3

# New comprehensive trades for new construction
NEW_TRADES = [
    # SITIO & PREPARACIÓN
    {'name': 'Excavation', 'icon': '🚜', 'order': 1, 'description': 'Excavación y movimiento de tierra'},
    {'name': 'Survey', 'icon': '📐', 'order': 2, 'description': 'Topografía y levantamientos'},
    {'name': 'Grading', 'icon': '🏗️', 'order': 3, 'description': 'Nivelación de terreno'},
    # CIMENTACIÓN
    {'name': 'Concrete', 'icon': '🧱', 'order': 4, 'description': 'Cimentación, losas, aceras'},
    {'name': 'Masonry', 'icon': '🪨', 'order': 5, 'description': 'Mampostería y bloques'},
    # ESTRUCTURA
    {'name': 'Framing', 'icon': '🪵', 'order': 6, 'description': 'Estructura de madera o metal'},
    {'name': 'Steel', 'icon': '🔩', 'order': 7, 'description': 'Estructuras metálicas'},
    {'name': 'Trusses', 'icon': '🏠', 'order': 8, 'description': 'Cerchas y armaduras de techo'},
    # EXTERIOR
    {'name': 'Roofing', 'icon': '🏚️', 'order': 9, 'description': 'Techos y cubiertas'},
    {'name': 'Siding', 'icon': '🏢', 'order': 10, 'description': 'Revestimiento exterior'},
    {'name': 'Stucco', 'icon': '✨', 'order': 11, 'description': 'Estuco y acabados exteriores'},
    {'name': 'Windows/Doors', 'icon': '🚪', 'order': 12, 'description': 'Ventanas y puertas'},
    # MEP
    {'name': 'Plumbing', 'icon': '🔧', 'order': 13, 'description': 'Plomería e instalaciones sanitarias'},
    {'name': 'Electrical', 'icon': '⚡', 'order': 14, 'description': 'Instalaciones eléctricas'},
    {'name': 'HVAC', 'icon': '❄️', 'order': 15, 'description': 'Aire acondicionado y calefacción'},
    {'name': 'Fire Protection', 'icon': '🔥', 'order': 16, 'description': 'Sistemas contra incendios'},
    # INTERIOR
    {'name': 'Insulation', 'icon': '🧊', 'order': 17, 'description': 'Aislamiento térmico'},
    {'name': 'Drywall', 'icon': '📐', 'order': 18, 'description': 'Paneles de yeso/Sheetrock'},
    {'name': 'Painting', 'icon': '🎨', 'order': 19, 'description': 'Pintura interior y exterior'},
    {'name': 'Flooring', 'icon': '🪨', 'order': 20, 'description': 'Pisos (madera, laminado, vinilo)'},
    {'name': 'Tile', 'icon': '🔲', 'order': 21, 'description': 'Azulejos y cerámicas'},
    {'name': 'Cabinets', 'icon': '🗄️', 'order': 22, 'description': 'Gabinetes de cocina y baño'},
    {'name': 'Countertops', 'icon': '💎', 'order': 23, 'description': 'Encimeras (granito, cuarzo)'},
    {'name': 'Trim/Millwork', 'icon': '🪚', 'order': 24, 'description': 'Molduras y carpintería fina'},
    # ACABADOS FINALES
    {'name': 'Appliances', 'icon': '🔌', 'order': 25, 'description': 'Electrodomésticos'},
    {'name': 'Mirrors/Glass', 'icon': '🪞', 'order': 26, 'description': 'Espejos y vidriería'},
    {'name': 'Garage Doors', 'icon': '🚗', 'order': 27, 'description': 'Puertas de garaje'},
    {'name': 'Gutters', 'icon': '💧', 'order': 28, 'description': 'Canaletas y desagües'},
    # EXTERIOR FINAL
    {'name': 'Landscaping', 'icon': '🌳', 'order': 29, 'description': 'Jardinería y áreas verdes'},
    {'name': 'Irrigation', 'icon': '💦', 'order': 30, 'description': 'Sistemas de riego'},
    {'name': 'Fencing', 'icon': '🚧', 'order': 31, 'description': 'Cercas y portones'},
    {'name': 'Pool', 'icon': '🏊', 'order': 32, 'description': 'Piscinas y spas'},
    # LIMPIEZA
    {'name': 'Cleaning', 'icon': '🧹', 'order': 33, 'description': 'Limpieza final'},
]


def update_trades():
    conn = sqlite3.connect('blue_tape.db')
    cursor = conn.cursor()

    # Clear existing trades (keeping contractors linked)
    cursor.execute('DELETE FROM trades')

    # Insert new trades
    for trade in NEW_TRADES:
        cursor.execute(
            'INSERT INTO trades (name, icon, "order", description, is_active) VALUES (?, ?, ?, ?, 1)',
            (trade['name'], trade['icon'], trade['order'], trade['description'])
        )

    conn.commit()
    print(f'✅ Insertadas {len(NEW_TRADES)} categorías de construcción nueva')

    # Show the result
    cursor.execute('SELECT id, icon, name, description FROM trades ORDER BY "order"')
    for row in cursor.fetchall():
        print(f'  {row[1]} {row[2]}: {row[3]}')

    conn.close()


if __name__ == "__main__":
    update_trades()
