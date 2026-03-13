// --- NAVIGASI ---
function navigate(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));

    // Tampilkan section target
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // Highlight menu (Simple logic for demo)
    // In real app, match by ID or data attribute
    
    // Re-render icons
    lucide.createIcons();

    // Jika masuk ke maps, resize peta (fix bug leaflet di hidden div)
    if(pageId === 'maps' && map) {
        setTimeout(() => { map.invalidateSize(); }, 200);
    }
}

// --- JAM SERVER & GREETING ---
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    
    // Dynamic Greeting
    const hour = now.getHours();
    let greeting = "Selamat Malam";
    if(hour >= 4 && hour < 11) greeting = "Selamat Pagi";
    else if(hour >= 11 && hour < 15) greeting = "Selamat Siang";
    else if(hour >= 15 && hour < 18) greeting = "Selamat Sore";
    
    document.getElementById('greeting').innerText = `${greeting}, Pegawai!`;
    
    checkWorkRules(now); // Cek aturan kerja setiap detik
}

setInterval(updateClock, 1000);

// --- THEME TOGGLE LOGIC ---
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const label = document.getElementById('theme-label');
    const icon = document.getElementById('theme-icon');
    
    if (currentTheme === 'light') {
        html.setAttribute('data-theme', 'dark');
        label.innerText = 'Dark Mode';
        icon.setAttribute('data-lucide', 'moon');
        // Update map tiles if needed
        if(map) updateMapTiles('dark');
    } else {
        html.setAttribute('data-theme', 'light');
        label.innerText = 'Light Mode';
        icon.setAttribute('data-lucide', 'sun');
        // Update map tiles if needed
        if(map) updateMapTiles('light');
    }
    lucide.createIcons();
}

// --- LOGIKA E-PRESENSI ---
let capturedPhotoData = null;
let videoStream;

function toggleAbsenFields() {
    const type = document.getElementById('absen-type').value;
    const presensiDiv = document.getElementById('presensi-fields');
    const nonPresensiDiv = document.getElementById('non-presensi-fields');
    const btnSubmit = document.getElementById('btn-submit-presensi');

    if (['hadir'].includes(type)) {
        presensiDiv.style.display = 'block';
        nonPresensiDiv.style.display = 'none';
        btnSubmit.style.display = 'block';
    } else {
        presensiDiv.style.display = 'none';
        nonPresensiDiv.style.display = 'block';
        btnSubmit.style.display = 'none';
    }
}

function checkWorkRules(now) {
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const infoBox = document.getElementById('work-rule-info');
    const submitBtn = document.getElementById('btn-submit-presensi');

    // Logika Sederhana untuk Demo
    if (currentTime <= "07:40") {
        infoBox.innerHTML = `<span style="color:#10b981">Waktu Ideal (Skor 50)</span>`;
        submitBtn.disabled = false;
        submitBtn.innerText = "Absen MASUK";
    } else if (currentTime <= "08:00") {
        infoBox.innerHTML = `<span style="color:#f97316">Terlambat Ringan (Skor 40)</span>`;
        submitBtn.disabled = false;
        submitBtn.innerText = "Absen MASUK";
    } else if (currentTime < "10:00") {
        infoBox.innerHTML = `<span style="color:#ef4444">Terlambat Signifikan (Skor 25)</span>`;
        submitBtn.disabled = false;
        submitBtn.innerText = "Absen MASUK (Terlambat)";
    } else {
        infoBox.innerHTML = `<span style="color:#3b82f6">Waktu Pulang (Bonus +50)</span>`;
        submitBtn.disabled = false;
        submitBtn.innerText = "Absen PULANG";
    }
}

// --- KAMERA & WATERMARKING ---
async function startCamera(facingMode) {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    
    try {
        if(videoStream) videoStream.getTracks().forEach(track => track.stop());
        
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
        });
        video.srcObject = videoStream;
        window.currentStream = videoStream;
        
        // Auto capture after 2 seconds for demo purposes (optional)
        // setTimeout(capturePhoto, 2000); 
    } catch (err) {
        alert("Gagal mengakses kamera: " + err.message);
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Watermark
    const now = new Date();
    const timestamp = now.toLocaleString('id-ID');
    
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "white";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    
    ctx.fillText(`Nama: Budi Santoso`, 20, canvas.height - 60);
    ctx.fillText(`Waktu: ${timestamp}`, 20, canvas.height - 30);
    
    capturedPhotoData = canvas.toDataURL('image/jpeg');
    
    const imgPreview = document.getElementById('photo-preview');
    imgPreview.src = capturedPhotoData;
    imgPreview.style.display = 'block';
    video.style.display = 'none';
    
    if(window.currentStream) window.currentStream.getTracks().forEach(track => track.stop());
    
    // Enable submit button visually (logic handled in submit click)
    document.getElementById('btn-submit-presensi').disabled = false;
}

// Override submit button to trigger capture first
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('btn-submit-presensi');
    submitBtn.onclick = function() {
        if(!capturedPhotoData) {
            // Simulate auto capture if user didn't click camera button explicitly
            if(window.currentStream) {
                capturePhoto();
            } else {
                alert("Silakan aktifkan kamera terlebih dahulu!");
                return;
            }
        }
        processSubmission();
    };
});

// --- SPEECH TO TEXT ---
function toggleSpeech() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Browser Anda tidak mendukung fitur suara.");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    const micBtn = document.getElementById('mic-btn');
    const inputField = document.getElementById('activity-note');

    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() { micBtn.classList.add('listening'); };
    recognition.onend = function() { micBtn.classList.remove('listening'); };
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        inputField.value += (inputField.value ? " " : "") + transcript;
    };

    recognition.start();
}

// --- ANTRIAN SUBMISSION ---
function processSubmission() {
    const queueIndicator = document.getElementById('queue-indicator');
    queueIndicator.style.display = 'flex';
    
    console.log("Masuk Antrian Lokal...", {
        photo: capturedPhotoData ? "Ada" : "Tidak Ada",
        note: document.getElementById('activity-note').value,
        gps: "Lat: -6.20, Long: 106.82" // Mockup
    });

    setTimeout(() => {
        queueIndicator.innerHTML = `<i data-lucide="check-circle" style="color:green"></i> Terkirim ke Server!`;
        lucide.createIcons();
        setTimeout(() => {
            queueIndicator.style.display = 'none';
            capturedPhotoData = null;
            document.getElementById('photo-preview').style.display = 'none';
            document.getElementById('camera-feed').style.display = 'block';
            document.getElementById('activity-note').value = '';
            alert("Absensi Berhasil!");
        }, 2000);
    }, 3000);
}

// --- MAPS INITIALIZATION ---
let map;
function initMap() {
    if(document.getElementById('map-container')) {
        map = L.map('map-container').setView([-6.2088, 106.8456], 13);
        updateMapTiles('dark'); // Default dark
        
        L.marker([-6.2088, 106.8456]).addTo(map)
            .bindPopup('<b>Budi Santoso</b><br>Terakhir: Baru saja')
            .openPopup();
    }
}

function updateMapTiles(theme) {
    if(!map) return;
    
    // Clear existing layers
    map.eachLayer((layer) => {
        if(layer instanceof L.TileLayer) map.removeLayer(layer);
    });

    const style = theme === 'light' ? 'light_all' : 'dark_all';
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
        style: style
    }).addTo(map);
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initMap();
    updateClock();
});
