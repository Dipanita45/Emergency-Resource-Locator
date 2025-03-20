document.addEventListener("DOMContentLoaded", function () {
    let map = L.map('map').setView([19.076, 72.8777], 12); // Default to Mumbai
    let userMarker;
    let unitMarkers = {};
    let trackingInterval;

    // Load the map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Custom icons for different emergency services
    const icons = {
        ambulance: L.divIcon({ html: '🚑', className: 'emergency-icon', iconSize: [30, 30] }),
        police: L.divIcon({ html: '🚓', className: 'emergency-icon', iconSize: [30, 30] }),
        hospital: L.divIcon({ html: '🏥', className: 'emergency-icon', iconSize: [30, 30] }),
        fire_station: L.divIcon({ html: '🚒', className: 'emergency-icon', iconSize: [30, 30] }),
        default: L.divIcon({ html: '🚨', className: 'emergency-icon', iconSize: [30, 30] })
    };

    // Function to locate the user
    function locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                map.setView([userLat, userLon], 14);

                if (!userMarker) {
                    userMarker = L.marker([userLat, userLon]).addTo(map)
                        .bindPopup("You are here").openPopup();
                } else {
                    userMarker.setLatLng([userLat, userLon]);
                }

                updateUnits(userLat, userLon);
            }, () => {
                alert("Unable to retrieve location. Please allow location access.");
                map.setView([19.076, 72.8777], 12);
            });
        } else {
            alert("Geolocation not supported by your browser.");
            map.setView([19.076, 72.8777], 12);
        }
    }

    // Fetch and update emergency units
    function updateUnits(userLat, userLon) {
        fetch("/get_nearest_units", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
        .then(response => response.json())
        .then(data => {
            Object.values(unitMarkers).forEach(marker => map.removeLayer(marker));
            unitMarkers = {};

            data.units.forEach((unit, index) => {
                const unitId = unit.id || `service-${index}`;
                const icon = icons[unit.type] || icons.default;

                let marker = L.marker([unit.lat, unit.lon], { icon }).addTo(map);
                marker.bindPopup(`<b>${unit.name || unit.type.toUpperCase()}</b><br>
                    ${unit.contact ? `Contact: <a href='tel:${unit.contact}'>${unit.contact}</a>` : ''}`);

                unitMarkers[unitId] = marker;
            });
        })
        .catch(error => {
            console.error("Error fetching emergency units:", error);
            alert("Failed to load emergency services.");
        });
    }

    // Emergency button click event
    const emergencyBtn = document.getElementById("emergency-btn");
    if (emergencyBtn) {
        emergencyBtn.addEventListener("click", function () {
            locateUser();
            this.classList.add('active');
            this.textContent = "Emergency Reported";

            if (trackingInterval) clearInterval(trackingInterval);
            trackingInterval = setInterval(locateUser, 5000);

            setTimeout(() => {
                clearInterval(trackingInterval);
                this.classList.remove('active');
                this.textContent = "Report Emergency";
            }, 30 * 60 * 1000);
        });
    }

    // Distress message function
    const distressBtn = document.getElementById("distress-message");
    if (distressBtn) {
        distressBtn.addEventListener("click", function () {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    const message = `EMERGENCY: I need help! My location: https://www.google.com/maps?q=${userLat},${userLon}`;

                    navigator.clipboard.writeText(message).then(() => {
                        alert("Distress message copied! Share it with emergency contacts.");
                    }).catch(() => {
                        showMessageModal(message);
                    });
                });
            } else {
                alert("Geolocation not supported.");
            }
        });
    }

    // Show distress message in modal
    function showMessageModal(message) {
        const modal = document.createElement('div');
        modal.className = 'message-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Emergency Message</h3>
                <p>Copy this message and share it:</p>
                <textarea readonly>${message}</textarea>
                <button id="close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('textarea').select();
        modal.querySelector('#close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    locateUser();

    // Add CSS for icons and modal
    const style = document.createElement('style');
    style.textContent = `
        .emergency-icon {
            font-size: 20px;
            text-align: center;
        }
        .message-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            max-width: 80%;
        }
        .modal-content textarea {
            width: 100%;
            margin: 10px 0;
        }
    `;
    document.head.appendChild(style);
});
