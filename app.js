// --- NAVIGASI ---
function navigate(pageId) {
    // Sembunyikan semua section
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));

    // Tampilkan section target
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // Highlight menu
    // (Logic sederhana untuk highlight menu berdasarkan index/klik)
    
    // Re-render icons jika perlu
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
    document.getElementById('jam-server').innerText = timeString + " WIB";

    // Dynamic Greeting
    const hour = now.getHours();
    let greeting = "Selamat Malam";
    if(hour >= 4 && hour < 11) greeting = "Selamat Pagi";
    else if(hour >= 11 && hour < 15) greeting = "Selamat Siang";
    else if(hour >= 15 && hour < 18) greeting = "Selamat Sore";
    
    document.getElementById('greeting').innerText = `${greeting}, Pegawai!`;
}

setInterval(updateClock, 1000);
updateClock();

// --- INISIALISASI PETA (LEAFLET) ---
let map;
function initMap() {
    // Koordinat default (Contoh: Monas)
    map = L.map('map-container').setView([-6.175392, 106.827153], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Contoh Marker Pegawai
    L.marker([-6.175392, 106.827153]).addTo(map)
        .bindPopup('<b>Budi Santoso</b><br>Terakhir: 10 menit lalu')
        .openPopup();
}

// Jalankan saat load
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initMap();
});
// ... kode navigasi dan jam yang lama tetap ada ...

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
    } else {
        html.setAttribute('data-theme', 'light');
        label.innerText = 'Light Mode';
        icon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons(); // Refresh icons
}

// Initialize Map (Pastikan map di-render ulang saat tab aktif jika perlu)
let map;
function initMap() {
    if(document.getElementById('map-container')) {
        map = L.map('map-container').setView([-6.2088, 106.8456], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/{style}/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap',
            subdomains: 'abcd',
            maxZoom: 19,
            style: document.documentElement.getAttribute('data-theme') === 'light' ? 'light_all' : 'dark_all'
        }).addTo(map);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initMap();
    updateClock(); // Pastikan jam jalan
});

// Update map tiles when theme changes (Optional enhancement)
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            if(map) {
                // Reload map tiles with new style logic if needed
                // For simple implementation, user might need to refresh map tab
            }
        }
    });
});
observer.observe(document.documentElement, { attributes: true });
