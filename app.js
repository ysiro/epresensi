// --- GLOBAL FUNCTIONS EXPOSURE ---
// Memastikan fungsi bisa diakses dari HTML onclick
window.navigate = navigate;
window.toggleTheme = toggleTheme;
window.startCamera = startCamera;
window.toggleSpeech = toggleSpeech;
window.toggleAbsenFields = toggleAbsenFields;

// --- NAVIGASI ---
function navigate(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    
    // Tampilkan section target
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // Update Active State pada Sidebar (Desktop)
    document.querySelectorAll('.sidebar .nav-links li').forEach(li => {
        li.classList.remove('active');
        // Simple check based on onclick attribute content
        if(li.getAttribute('onclick').includes(pageId)) {
            li.classList.add('active');
        }
    });

    // Update Active State pada Bottom Nav (Mobile)
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if(item.getAttribute('onclick').includes(pageId)) {
            item.classList.add('active');
        }
        // Khusus tombol tema
        if(item.getAttribute('onclick').includes('toggleTheme')) {
            item.classList.remove('active');
        }
    });

    // Re-render icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Jika masuk ke maps, resize peta
    if(pageId === 'maps' && map) {
        setTimeout(() => { map.invalidateSize(); }, 200);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// --- JAM SERVER & GREETING ---
function updateClock() {
    const now = new Date();
    
    // Dynamic Greeting
    const hour = now.getHours();
    let greeting = "Selamat Malam";
    if(hour >= 4 && hour < 11) greeting = "Selamat Pagi";
    else if(hour >= 11 && hour < 15) greeting = "Selamat Siang";
    else if(hour >= 15 && hour < 18) greeting = "Selamat Sore";
    
    const greetingEl = document.getElementById('greeting');
    if(greetingEl) greetingEl.innerText = `${greeting}, Pegawai!`;
    
    checkWorkRules(now);
}

setInterval(updateClock, 1000);

// --- THEME TOGGLE LOGIC ---
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    // Elements Desktop
    const labelDesktop = document.getElementById('theme-label-desktop');
    const iconDesktop = document.getElementById('theme-icon-desktop');
    
    // Elements Mobile
    const iconMobile = document.getElementById('theme-icon-mobile');
    
    if (currentTheme === 'light') {
        html.setAttribute('data-theme', 'dark');
        if(labelDesktop) labelDesktop.innerText = 'Dark Mode';
        if(iconDesktop) iconDesktop.setAttribute('data-lucide', 'moon');
        if(iconMobile) iconMobile.setAttribute('data-lucide', 'moon');
        if(map) updateMapTiles('dark');
    } else {
        html.setAttribute('data-theme', 'light');
        if(labelDesktop) labelDesktop.innerText = 'Light Mode';
        if(iconDesktop) iconDesktop.setAttribute('data-lucide', 'sun');
        if(iconMobile) iconMobile.setAttribute('data-lucide', 'sun');
        if(map) updateMapTiles('light');
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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
        if(btnSubmit) btnSubmit.style.display = 'block';
    } else {
        presensiDiv.style.display = 'none';
        nonPresensiDiv.style.display = 'block';
        if(btnSubmit) btnSubmit.style.display = 'none';
    }
}

function checkWorkRules(now) {
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const infoBox = document.getElementById('work-rule-info');
    const submitBtn = document.getElementById('btn-submit-presensi');
    
    if(!infoBox || !submitBtn) return;

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

// --- KAMERA ---
async function startCamera(facingMode) {
    const video = document.getElementById('camera-feed');
    if(!video) return;

    try {
        if(videoStream) videoStream.getTracks().forEach(track => track.stop());
        
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
        });
        video.srcObject = videoStream;
        window.currentStream = videoStream;
    } catch (err) {
        alert("Gagal mengakses kamera: " + err.message);
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    if(!video || !canvas) return;

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
    if(imgPreview) {
        imgPreview.src = capturedPhotoData;
        imgPreview.style.display = 'block';
        video.style.display = 'none';
    }
    
    if(window.currentStream) window.currentStream.getTracks().forEach(track => track.stop());
    
    const btn = document.getElementById('btn-submit-presensi');
    if(btn) btn.disabled = false;
}

// Submit Handler
document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('btn-submit-presensi');
    if(submitBtn) {
        submitBtn.onclick = function() {
            if(!capturedPhotoData) {
                if(window.currentStream) {
                    capturePhoto();
                } else {
                    alert("Silakan aktifkan kamera terlebih dahulu!");
                    return;
                }
            }
            processSubmission();
        };
    }
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

    recognition.onstart = function() { if(micBtn) micBtn.classList.add('listening'); };
    recognition.onend = function() { if(micBtn) micBtn.classList.remove('listening'); };
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        if(inputField) inputField.value += (inputField.value ? " " : "") + transcript;
    };

    recognition.start();
}

// --- ANTRIAN SUBMISSION ---
function processSubmission() {
    const queueIndicator = document.getElementById('queue-indicator');
    if(queueIndicator) queueIndicator.style.display = 'flex';
    
    console.log("Masuk Antrian Lokal...", {
        photo: capturedPhotoData ? "Ada" : "Tidak Ada",
        note: document.getElementById('activity-note')?.value,
        gps: "Lat: -6.20, Long: 106.82"
    });

    setTimeout(() => {
        if(queueIndicator) {
            queueIndicator.innerHTML = `<i data-lucide="check-circle" style="color:green"></i> Terkirim ke Server!`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        setTimeout(() => {
            if(queueIndicator) queueIndicator.style.display = 'none';
            capturedPhotoData = null;
            const imgPreview = document.getElementById('photo-preview');
            const videoFeed = document.getElementById('camera-feed');
            if(imgPreview) imgPreview.style.display = 'none';
            if(videoFeed) videoFeed.style.display = 'block';
            const noteField = document.getElementById('activity-note');
            if(noteField) noteField.value = '';
            alert("Absensi Berhasil!");
        }, 2000);
    }, 3000);
}

// --- MAPS INITIALIZATION ---
let map;
function initMap() {
    const mapContainer = document.getElementById('map-container');
    if(mapContainer) {
        map = L.map('map-container').setView([-6.2088, 106.8456], 13);
        updateMapTiles('dark');
        
        L.marker([-6.2088, 106.8456]).addTo(map)
            .bindPopup('<b>Budi Santoso</b><br>Terakhir: Baru saja')
            .openPopup();
    }
}

function updateMapTiles(theme) {
    if(!map) return;
    
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

// Start Application
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    initMap();
    updateClock();
});
