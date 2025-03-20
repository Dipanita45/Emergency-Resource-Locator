import requests
import sqlite3
import os

# Overpass API query for hospitals, police, and fire stations in Mumbai
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
QUERY = """
[out:json];
area[name="Mumbai"]->.searchArea;
(
  node["amenity"="hospital"](area.searchArea);
  node["amenity"="police"](area.searchArea);
  node["amenity"="fire_station"](area.searchArea);
);
out body;
"""

def main():
    # Fetch data from Overpass API
    print("Fetching emergency services data from Overpass API...")
    response = requests.get(OVERPASS_URL, params={"data": QUERY})
    
    if response.status_code != 200:
        print(f"Error: Failed to fetch data. Status code: {response.status_code}")
        return
    
    data = response.json()
    print(f"Received data for {len(data['elements'])} locations")

    # Extract relevant details
    places = []
    for element in data["elements"]:
        name = element.get("tags", {}).get("name", "Unknown")
        amenity_type = element["tags"].get("amenity", "Unknown")
        lat = element.get("lat", 0)
        lon = element.get("lon", 0)
        places.append((name, amenity_type, lat, lon))

    # Create and connect to SQLite database
    db_path = "emergency_locator.db"
    
    # Check if database exists and optionally back it up
    if os.path.exists(db_path):
        print(f"Database already exists at {db_path}")
        # Uncomment to create backup before overwriting
        # import shutil
        # import time
        # backup_path = f"{db_path}.backup.{int(time.time())}"
        # shutil.copy2(db_path, backup_path)
        # print(f"Created backup at {backup_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emergency_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        amenity_type TEXT,
        lat REAL,
        lon REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Clear existing data if any
    cursor.execute("DELETE FROM emergency_services")
    print("Cleared existing emergency services data")
    
    # Insert new data
    cursor.executemany(
        "INSERT INTO emergency_services (name, amenity_type, lat, lon) VALUES (?, ?, ?, ?)",
        places
    )
    
    # Commit changes and close connection
    conn.commit()
    print(f"Successfully stored {cursor.rowcount} emergency services in the database")
    conn.close()

if __name__ == "__main__":
    main()