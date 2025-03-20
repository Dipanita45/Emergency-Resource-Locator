from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import logging

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Dummy emergency units with initial locations
emergency_units = [
    {"id": 1, "type": "ambulance", "lat": 19.076, "lon": 72.8777, "contact": "+911234567890"},
    {"id": 2, "type": "police", "lat": 19.08, "lon": 72.88, "contact": "+911234567891"}
]

@app.route("/")
def index():
    return render_template("index.html")  # Flask will look inside /templates/

@app.route("/get_nearest_units", methods=["POST"])
def get_nearest_units():
    data = request.json
    user_lat, user_lon = data.get("lat"), data.get("lon")

    logging.info(f"User location: lat={user_lat}, lon={user_lon}")
    
    return jsonify({"units": emergency_units})

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

if __name__ == "__main__":
    app.run(debug=True)
