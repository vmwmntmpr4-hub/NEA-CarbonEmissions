const buttons = document.querySelectorAll(".nav button");        // document [whole webpage] then query finds all that match .nav [button] elements
const slider = document.querySelector(".slider");  // finds the very first element that has .slider
const uploadSection = document.getElementById("uploadSection");  // finds html elements of upload section id using whole webpage
const mapSection = document.getElementById("mapSection"); // finds html elements of map section by id using whole webpage
const californiaBounds = [ [-124.5, 32.3],  [-114.0, 42.1] ]; // northwest  corner and southwest corner - longitude / latitude
const videoElement = document.getElementById("traffic-video");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const uploadedVideo = document.getElementById("uploaded-video");
const uploadText = document.getElementById("upload-text");
const filterButtons = document.querySelectorAll(".filter-btn");



const map = new maplibregl.Map({  // creates map libre map
    container: "map",  // display inside map id
    style: "https://tiles.openfreemap.org/styles/liberty", // appearance eg dark mode, googlemaps, satellite
    center: [-119.4179, 36.7783], // center
    zoom: 5.8, // initial zoom
    minZoom: 5,
    maxZoom: 16,
    maxBounds: californiaBounds  // prevents going outside of california
});

 buttons.forEach((button) => {     // loop runs for amount of each button
    button.addEventListener("click", () => {   // wait for user to click
        slider.style.left = `${button.offsetLeft}px`; // moves slider to where they clicked on the slider [uses offset to find the amount of pixels left]
        if (button.id === "uploadBtn") {   // if upload button was clicked
            uploadSection.style.display = "block";
            mapSection.style.display = "none"; // hides map
        } // map disappears
        if (button.id === "mapBtn") { // if map button was clicked
            uploadSection.style.display = "none";  // no blockage so shows map
            mapSection.style.display = "flex";
            setTimeout(() => {
                map.resize(); // resizes the map after 100 milliseconds
            }, 100);
        } // map appears
    });
});



cameras.forEach(camera => { // cycles through each camera
    const marker = new maplibregl.Marker() // creates a marker on the map for each camera
        .setLngLat([camera.lon, camera.lat]) // sets longitude and latitude
        .addTo(map); // adds it
    marker.getElement().addEventListener("click", () => { // waits for the client to click
        map.flyTo({ center: [camera.lon + 0.015, camera.lat], zoom: 15, essential: true }); // moves to
        document.getElementById("cameraTitle").innerText = camera.name; // displays camera title
        document.getElementById("cameraSideSheet").classList.add("active"); //displays the SideSheet
        videoElement.src = camera.stream_url; // displays  the stream
        videoElement.load(); // loads
    });
});

dropZone.addEventListener("click", () => { // waits for click
    if (uploadText.style.display !== "none") {
        fileInput.click(); // opens finder
    }
});

fileInput.addEventListener("change", async () => { // waits till the data exists
    const file = fileInput.files[0];
    if (!file) return; // no file exists
    uploadText.style.display = "none";
    document.getElementById("loading-message").style.display = "flex";
    uploadedVideo.style.display = "none";
    const formData = new FormData();
    formData.append("video", file);

const response = await fetch("/upload", {method: "POST", body: formData});
const result = await response.json();
document.getElementById("loading-message").style.display = "none";
uploadedVideo.src = result.video + "?t=" + Date.now(); // cache checker to update to the newest version of the video
uploadedVideo.style.display = "block";
uploadedVideo.load();
uploadedVideo.play();

const ctx = document.getElementById("emissionsChart");
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: "Cars",
                data: [],
                borderColor: "#00ff88",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                parsing: false
            },
            {
                label: "Motorcycles",
                data: [],
                borderColor: "#ff00ff",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                parsing: false
            },
            {
                label: "Buses",
                data: [],
                borderColor: "#ffff00",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                parsing: false
            },
            {
                label: "Trucks",
                data: [],
                borderColor: "#ff4444",
                borderWidth: 3,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                parsing: false
            }
        ]
    },
options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,

    plugins: {
        legend: { // graph keys
            display: false
        }
    },
    scales: {
            x: {
            type: 'linear',
            min: 0,
            max: 10,
            grid: {
                color: 'rgba(255,255,255,0.05)'
            },
            border: {
                color: '#ffffff'
            },
            ticks: {
                stepSize: 1,
                color: '#ffffff',
                font: {
                    size: 20
                }
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(255,255,255,0.08)'
            },
            border: {
                color: '#ffffff'
            },
            ticks: {
                stepSize: 5,
                color: '#ffffff',
                font: {
                    size: 20
                }
            }
        }
    }
}
});

const co2PieChart = new Chart(
    document.getElementById("co2PieChart"),
    {
        type: "doughnut",
        data: {
            labels: [
                "Cars",
                "Motorcycles",
                "Buses",
                "Trucks"
            ],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    "#00E396",
                    "#ff00ff",
                    "#ffff00",
                    "#ff4444"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "white",
                        font: {
                            size: 14
                        }
                    }
                }
            },

            cutout: "65%"
        }
    }
);

filterButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        button.classList.toggle("active");
        chart.data.datasets[index].hidden = !chart.data.datasets[index].hidden; // if hidden = visible and visible = hidden
        chart.update();
    });
});

uploadedVideo.addEventListener("timeupdate", () => {
    const currentTime = uploadedVideo.currentTime;
    const visiblePoints = result.graph_data.filter(
        point =>
            point.time >= currentTime - 10 && point.time <= currentTime
    );
    chart.data.datasets[0].data = visiblePoints.map(point => ({x: point.time, y: point.cars}));
    chart.data.datasets[1].data = visiblePoints.map(point => ({x: point.time, y: point.motorcycles}));
    chart.data.datasets[2].data = visiblePoints.map(point => ({x: point.time, y: point.buses}));
    chart.data.datasets[3].data = visiblePoints.map(point => ({x: point.time, y: point.trucks}));
    const windowSize = 10;
    chart.options.scales.x.min = Math.max(0, currentTime - windowSize);
    chart.options.scales.x.max = Math.max(windowSize, currentTime);
    if (visiblePoints.length > 0) {
        const latestPoint = visiblePoints[visiblePoints.length - 1];
        const co2Cars = latestPoint.cars * 0.12;
        const co2Motorcycles = latestPoint.motorcycles * 0.08;
        const co2Buses = latestPoint.buses * 0.90;
        const co2Trucks = latestPoint.trucks * 1.20;
        const totalCO2 = co2Cars + co2Motorcycles + co2Buses + co2Trucks;
        document.getElementById("totalCars").innerText = latestPoint.cars;
        document.getElementById("totalMotorcycles").innerText = latestPoint.motorcycles;
        document.getElementById("totalBuses").innerText = latestPoint.buses;
        document.getElementById("totalTrucks").innerText = latestPoint.trucks;
        document.getElementById("totalVehicles").innerText = latestPoint.cars + latestPoint.motorcycles + latestPoint.buses + latestPoint.trucks;
        document.getElementById("totalCO2").innerText = totalCO2.toFixed(2) + " kg";
        document.getElementById("totalCO2Cars").innerText = co2Cars.toFixed(2) + " kg";
        document.getElementById("totalCO2Buses").innerText = co2Buses.toFixed(2) + " kg";
        document.getElementById("totalCO2Motorcycles").innerText = co2Motorcycles.toFixed(2) + " kg";
        document.getElementById("totalCO2Trucks").innerText = co2Trucks.toFixed(2) + " kg";
        co2PieChart.data.datasets[0].data = [co2Cars, co2Motorcycles, co2Buses, co2Trucks];
        co2PieChart.update("none");
    }
    chart.update("none");
    });
});