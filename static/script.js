document.addEventListener("DOMContentLoaded", function () {
    let map = L.map('map'); // Initialize the map without default center
    let userMarker;
    let unitMarkers = {};

    // Load the map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Function to locate user and update map
    function locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                let userLat = position.coords.latitude;
                let userLon = position.coords.longitude;

                // Set map view to user's location on first load
                if (!map.hasLayer(userMarker)) {
                    map.setView([userLat, userLon], 14);
                }

                // Add or update user's marker
                if (!userMarker) {
                    userMarker = L.marker([userLat, userLon]).addTo(map)
                        .bindPopup("You are here")
                        .openPopup();
                } else {
                    userMarker.setLatLng([userLat, userLon]);
                }

                // Fetch emergency units nearby
                updateUnits(userLat, userLon);
            }, () => {
                alert("Unable to retrieve your location. Please allow location access.");
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    }

    // Function to fetch and update emergency units
    function updateUnits(userLat, userLon) {
        fetch("http://127.0.0.1:5000/get_nearest_units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
        .then(response => response.json())
        .then(data => {
            data.units.forEach(unit => {
                if (unitMarkers[unit.id]) {
                    unitMarkers[unit.id].setLatLng([unit.lat, unit.lon]);
                } else {
                    let iconUrl;
                    switch (unit.type) {
                        case "ambulance":
                            iconUrl = "ambulance-icon.png";
                            break;
                        case "police":
                            iconUrl = "police-icon.png";
                            break;
                        default:
                            iconUrl = "default-icon.png";
                    }
                    let marker = L.marker([unit.lat, unit.lon], {
                        icon: L.icon({ iconUrl: iconUrl, iconSize: [30, 30] })
                    }).addTo(map);

                    marker.bindPopup(`<b>${unit.type.toUpperCase()}</b><br>Contact: <a href='tel:${unit.contact}'>${unit.contact}</a>`);
                    unitMarkers[unit.id] = marker;
                }
            });
        })
        .catch(error => console.error("Error fetching emergency units:", error));
    }

    // Call locateUser function when "Report Emergency" button is clicked
    document.getElementById("emergency-btn").addEventListener("click", function () {
        locateUser();
        setInterval(locateUser, 5000); // Update user location every 5 seconds
    });

    // Function to send distress message with location
    document.getElementById("distress-message").addEventListener("click", function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                let userLat = position.coords.latitude;
                let userLon = position.coords.longitude;
                let message = `I am in an emergency! My location: https://www.google.com/maps?q=${userLat},${userLon}`;
                navigator.clipboard.writeText(message).then(() => {
                    alert("Distress message copied! Share it now.");
                });
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // Locate user on page load
    locateUser();
});
