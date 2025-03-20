from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging
import sqlite3

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Dummy emergency units with initial locations
emergency_units = [
    {"id": 1, "type": "ambulance", "lat": 19.076, "lon": 72.8777, "contact": "+911234567890"},
    {"id": 2, "type": "police", "lat": 19.08, "lon": 72.88, "contact": "+911234567891"}
]

# Serve main HTML page
@app.route("/")
def index():
    return render_template("index.html")

# Route to fetch nearest emergency units
@app.route("/get_nearest_units", methods=["POST"])
def get_nearest_units():
    data = request.json
    user_lat, user_lon = data.get("lat"), data.get("lon")

    logging.info(f"User location: lat={user_lat}, lon={user_lon}")

    # Fetch from database
    conn = sqlite3.connect("emergency_locator.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, amenity_type, lat, lon FROM emergency_services")
    db_units = cursor.fetchall()
    conn.close()

    services = [{"name": name, "type": amenity, "lat": lat, "lon": lon} for name, amenity, lat, lon in db_units]

    return jsonify({"units": emergency_units + services})

# Route to update emergency unit location
@app.route("/update_location", methods=["POST"])
def update_location():
    data = request.json
    logging.info(f"Received update request: {data}")

    for unit in emergency_units:
        if unit["id"] == data.get("id"):
            unit["lat"] = data.get("lat")
            unit["lon"] = data.get("lon")
            return jsonify({"message": "Location updated"})

    return jsonify({"error": "Unit not found"}), 404

# Route to handle "Report Emergency"
@app.route("/report_emergency", methods=["POST"])
def report_emergency():
    emergency = request.form.get("emergency", "Unknown Emergency")
    logging.info(f"Emergency reported: {emergency}")
    return jsonify({"message": "Emergency reported successfully!", "emergency": emergency})

# Route to handle "Send Distress Message"
@app.route("/send_distress", methods=["POST"])
def send_distress():
    distress_message = request.form.get("distress_message", "No message provided")
    logging.info(f"Distress message sent: {distress_message}")
    return jsonify({"message": "Distress message sent successfully!", "distress_message": distress_message})

# Route to handle "Search"
@app.route("/search", methods=["GET"])
def search():
    query = request.args.get("query", "")
    logging.info(f"Search query: {query}")
    return jsonify({"message": f"Results for '{query}'"})

if __name__ == "__main__":
    app.run(debug=True)
