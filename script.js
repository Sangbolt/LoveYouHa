// Dữ liệu tọa độ của các điểm
let locations = {}; // Để lưu dữ liệu sau khi đọc từ file
let markers = [];// để lưu các điểm để hiển thị lên bản đồ
// Hàm đọc file locations.txt
function readLocationsFile(event) {
    const file = event.target.files[0]; // Lấy file từ input
    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        locations = parseLocations(content); // Phân tích dữ liệu từ file
        console.log("Locations:", locations);
        createCheckboxes(); // Tạo lại checkbox sau khi đọc file
        
    };

    reader.readAsText(file); // Đọc file dưới dạng văn bản
}

//Hàm xóa các điểm trên bản đồ
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker); // Xóa từng marker khỏi bản đồ
    });
    markers = []; // Làm rỗng mảng
}


// Hàm phân tích dữ liệu từ file
function parseLocations(content) {
    const lines = content.split('\n'); // Tách từng dòng
    const parsedLocations = {};
    let hasNhaXe = false; // Biến kiểm tra sự tồn tại của "Nhà Xe"

    lines.forEach(line => {
        const [name, lat, lon] = line.split(','); // Tách dữ liệu bằng dấu phẩy
        if (name && lat && lon) {
            const trimmedName = name.trim();
            parsedLocations[trimmedName] = [parseFloat(lat), parseFloat(lon)];
            if (trimmedName === 'Nhà Xe') {
                hasNhaXe = true; // Đánh dấu "Nhà Xe" đã tồn tại
            }
        }
    });

    if (!hasNhaXe) {
        alert("Vui lòng thêm điểm 'Nhà Xe' vào file TXT!");
    }

    return parsedLocations;
}
// Tạo input để chọn file
document.getElementById('fileInput').addEventListener('change', readLocationsFile);
// Tạo checkbox động dựa trên dữ liệu locations
function createCheckboxes() {
    const container = document.getElementById('checkboxContainer');

    // Duyệt qua các điểm trong `locations`
    for (let point in locations) {
        if (point !== 'Nhà Xe') { // Loại trừ "Nhà Xe" vì điểm này luôn được chọn
            const label = document.createElement('label');
            label.innerHTML = `<input type="checkbox" id="${point}" checked> ${point}`;
            container.appendChild(label);
        }
    }
}



// Tạo bản đồ
const map = L.map('map').setView([10.8231, 106.6297], 13);

// Thêm lớp bản đồ OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Thêm các điểm vào bản đồ
for (let point in locations) {
    L.marker(locations[point])
        .addTo(map)
        .bindPopup(point)
        .openPopup();
}

// Hàm lấy các điểm tham quan đã chọn từ các checkbox
function getSelectedPoints() {
    const selectedPoints = [];
    selectedPoints.push('Nhà Xe'); // Luôn thêm "Nhà Xe" vào đầu

    for (let point in locations) {
        if (point !== 'Nhà Xe') { // Bỏ qua "Nhà Xe" vì nó luôn được chọn
            const checkbox = document.getElementById(point);
            if (checkbox && checkbox.checked) {
                selectedPoints.push(point);
            }
        }
    }

    selectedPoints.push('Nhà Xe'); // Kết thúc tại "Nhà Xe"
    return selectedPoints;
}

function greedyTSP(points) {
    const route = [points[0]];
    const remaining = points.slice(1, -1);

    while (remaining.length > 0) {
        const last = route[route.length - 1];
        let nearest = remaining[0];
        let minDist = getHeuristic(locations[last], locations[nearest]);

        for (let i = 1; i < remaining.length; i++) {
            const dist = getHeuristic(locations[last], locations[remaining[i]]);
            if (dist < minDist) {
                nearest = remaining[i];
                minDist = dist;
            }
        }

        route.push(nearest);
        remaining.splice(remaining.indexOf(nearest), 1);
    }

    route.push(points[points.length - 1]); // Thêm điểm "Nhà Xe" vào cuối
    return route;
}

// Hàm tính khoảng cách ước lượng (heuristic) giữa hai điểm
function getHeuristic(a, b) {
    const lat1 = a[0], lon1 = a[1];
    const lat2 = b[0], lon2 = b[1];
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
}

// Hàm vẽ đường đi lên bản đồ
let currentRouteControl = null;
let lastRouteControl = null;

function drawRoute(route) {
    const routeMain = route.slice(0, -1); // Các điểm từ đầu đến điểm gần cuối
    const routeLast = route.slice(-2);   // Điểm gần cuối và điểm cuối ("Nhà Xe")

    if (currentRouteControl) {
        map.removeControl(currentRouteControl);
        currentRouteControl = null;
    }
    if (lastRouteControl) {
        map.removeControl(lastRouteControl);
        lastRouteControl = null;
    }

    currentRouteControl = L.Routing.control({
        waypoints: routeMain.map(point => L.latLng(locations[point])),
        routeWhileDragging: true,
        language: 'vi',
        createMarker: function(i, waypoint) {
            // Tạo marker với tooltip hiển thị tên điểm
            const marker = L.marker(waypoint.latLng)
                .bindTooltip(route[i], { // Tên điểm từ route
                    permanent: false,
                    direction: 'top'
                });
            return marker;
        }
    }).addTo(map);

    lastRouteControl = L.Routing.control({
        waypoints: routeLast.map(point => L.latLng(locations[point])),
        routeWhileDragging: true,
        language: 'vi',
        lineOptions: { styles: [{ color: 'blue', opacity: 0.5, weight: 6 }] },
        createMarker: function(i, waypoint) {
            // Tạo marker với tooltip hiển thị tên điểm
            const marker = L.marker(waypoint.latLng)
                .bindTooltip(route[i], { // Tên điểm từ route
                    permanent: false,
                    direction: 'top'
                });
            return marker;
        }
    }).addTo(map);
}
L.Routing.Localization['vi'] = {
    directions: {
        N: 'Bắc',
        NE: 'Đông Bắc',
        E: 'Đông',
        SE: 'Đông Nam',
        S: 'Nam',
        SW: 'Tây Nam',
        W: 'Tây',
        NW: 'Tây Bắc'
    },
    instructions: {
        'Head': ['Đi về phía {dir}', ' trên {road}'],
        'Continue': ['Tiếp tục đi về phía {dir}', ' trên {road}'],
        'Turn': ['Rẽ {modifier}', ' vào {road}'],
        'DestinationReached': ['Đã đến điểm {destination}']
    }
};

//Bật tắt bảng chỉ dẫn
document.getElementById('toggleInstructionsBtn').addEventListener('click', () => {
    // Chọn tất cả các thẻ có class .leaflet-routing-container
    const guideContainers = document.querySelectorAll('.leaflet-routing-container');

    // Duyệt qua tất cả các thẻ và thay đổi display của chúng
    guideContainers.forEach(guideContainer => {
        if (guideContainer.style.display === 'none') {
            guideContainer.style.display = 'block';  // Hiện bảng chỉ dẫn
        } else {
            guideContainer.style.display = 'none';  // Ẩn bảng chỉ dẫn
        }
    });
});

// Hàm hiển thị thứ tự các điểm đi qua
function displayRouteOrder(route) {
    const routeOrderElement = document.getElementById('routeOrder');
    routeOrderElement.innerHTML = '';
    route.forEach((point, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `(${index + 1}) ${point}`;  // index + 1 để đánh số bắt đầu từ 1
        routeOrderElement.appendChild(listItem);
    });

    routeOrderElement.innerHTML += `</ul>`;
}

// Tính lộ trình
function calculateRoute() {
    const selectedPoints = getSelectedPoints();
    const route = greedyTSP(selectedPoints);
    console.log("Thứ tự các điểm tham quan:", route);
    drawRoute(route);
    displayRouteOrder(route);
}

// Tạo checkbox khi tải trang
createCheckboxes();
