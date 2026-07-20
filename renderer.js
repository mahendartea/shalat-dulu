// DOM Elements
const digitalClock = document.getElementById('digital-clock');
const countdownLabel = document.getElementById('countdown-label');
const countdownTimer = document.getElementById('countdown-timer');
const currentCityEl = document.getElementById('current-city');

const btnSettings = document.getElementById('btn-settings');
const btnBackSettings = document.getElementById('btn-back-settings');
const btnQuit = document.getElementById('btn-quit');
const btnToggleSound = document.getElementById('btn-toggle-sound');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnTestNotification = document.getElementById('btn-test-notification');
const btnTestSound = document.getElementById('btn-test-sound');
const btnDevTools = document.getElementById('btn-dev-tools');

const soundIconOn = document.getElementById('sound-icon-on');
const soundIconOff = document.getElementById('sound-icon-off');
const soundStatusText = document.getElementById('sound-status-text');

const btnToggleWidget = document.getElementById('btn-toggle-widget');
const widgetStatusText = document.getElementById('widget-status-text');

const mainScreen = document.getElementById('main-screen');
const settingsScreen = document.getElementById('settings-screen');

const locationModeRadios = document.getElementsByName('location-mode');
const manualLocationInputs = document.getElementById('manual-location-inputs');

// API source switching elements
const selectApiSource = document.getElementById('select-api-source');
const equranInputs = document.getElementById('equran-inputs');
const aladhanInputs = document.getElementById('aladhan-inputs');

// EQuran elements
const selectProvinsi = document.getElementById('select-provinsi');
const selectKabkota = document.getElementById('select-kabkota');

// Aladhan elements
const inputCity = document.getElementById('input-city');
const inputCountry = document.getElementById('input-country');

const selectSoundType = document.getElementById('select-sound-type');
const selectAdzanFile = document.getElementById('select-adzan-file');
const adzanSelectorGroup = document.getElementById('adzan-selector-group');
const audioAdzan = document.getElementById('audio-adzan');

// Doa Harian Elements
const btnRefreshDoa = document.getElementById('btn-refresh-doa');
const doaGrup = document.getElementById('doa-grup');
const doaNama = document.getElementById('doa-nama');
const doaArab = document.getElementById('doa-arab');
const doaLatin = document.getElementById('doa-latin');
const doaArti = document.getElementById('doa-arti');

// Application State
let appSettings = {
  locationMode: 'manual',
  apiSource: 'equran',
  provinsi: 'Aceh',
  kabkota: 'Kota Banda Aceh',
  city: 'Banda Aceh',
  country: 'Indonesia',
  soundType: 'adzan',
  adzanFile: 'Athan Alafasy.mp3',
  soundEnabled: true
};

let prayerTimings = {};
let activeLocation = { city: '', country: '' };
let nextPrayer = null;
let currentNotification = null;
let doaList = []; // Array to store all doas from API

// Cache for EQuran API lists
let provincesList = [];
let citiesCache = {}; // { 'Provinsi Name': ['City1', 'City2'] }

// 1. Initialize App
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  startClock();
  fetchPrayerTimes();
  
  // Background load provinces list for quick settings switch
  preloadProvinces();

  // Background load random daily du'a list
  fetchDoaList();
});

// 2. Settings Management
function loadSettings() {
  const saved = localStorage.getItem('shalat-dulu-settings');
  if (saved) {
    try {
      appSettings = { ...appSettings, ...JSON.parse(saved) };
      // Migrasi: jika masih menggunakan default lama (Jakarta), ubah ke Banda Aceh
      if (appSettings.provinsi === 'DKI Jakarta' || appSettings.city === 'Jakarta') {
        appSettings.locationMode = 'manual';
        appSettings.provinsi = 'Aceh';
        appSettings.kabkota = 'Kota Banda Aceh';
        appSettings.city = 'Banda Aceh';
        localStorage.setItem('shalat-dulu-settings', JSON.stringify(appSettings));
      }
    } catch (e) {
      console.error('Gagal memuat pengaturan:', e);
    }
  } else {
    // Simpan default baru jika belum ada data tersimpan
    localStorage.setItem('shalat-dulu-settings', JSON.stringify(appSettings));
  }

  // Update Location Mode
  const mode = appSettings.locationMode;
  for (const radio of locationModeRadios) {
    if (radio.value === mode) radio.checked = true;
  }
  
  if (mode === 'manual') {
    manualLocationInputs.classList.remove('hidden');
  } else {
    manualLocationInputs.classList.add('hidden');
  }

  // Update API source & display correct input blocks
  selectApiSource.value = appSettings.apiSource;
  updateApiSourceInputsVisibility();

  // Populate values
  inputCity.value = appSettings.city;
  inputCountry.value = appSettings.country;
  selectSoundType.value = appSettings.soundType;
  selectAdzanFile.value = appSettings.adzanFile || 'Athan Alafasy.mp3';
  updateAdzanSelectorVisibility();
  
  updateSoundButtonUI();
}

function updateApiSourceInputsVisibility() {
  if (selectApiSource.value === 'equran') {
    equranInputs.classList.remove('hidden');
    aladhanInputs.classList.add('hidden');
  } else {
    equranInputs.classList.add('hidden');
    aladhanInputs.classList.remove('hidden');
  }
}

async function preloadProvinces() {
  try {
    const response = await fetch('https://equran.id/api/v2/shalat/provinsi');
    if (!response.ok) throw new Error('Gagal mengambil daftar provinsi');
    const resData = await response.json();
    if (resData.code === 200 && Array.isArray(resData.data)) {
      provincesList = resData.data;
      populateProvincesDropdown();
    }
  } catch (err) {
    console.error('Error preloading provinces:', err);
  }
}

function populateProvincesDropdown() {
  selectProvinsi.innerHTML = '';
  
  if (provincesList.length === 0) {
    selectProvinsi.innerHTML = '<option value="">Gagal memuat provinsi</option>';
    return;
  }

  provincesList.forEach(prov => {
    const opt = document.createElement('option');
    opt.value = prov;
    opt.innerText = prov;
    if (prov.toLowerCase() === appSettings.provinsi.toLowerCase()) {
      opt.selected = true;
    }
    selectProvinsi.appendChild(opt);
  });

  // Fetch cities for the selected province immediately
  handleProvinceChange(selectProvinsi.value);
}

async function handleProvinceChange(provinceName) {
  if (!provinceName) return;

  selectKabkota.innerHTML = '<option value="">Memuat...</option>';

  if (citiesCache[provinceName]) {
    populateCitiesDropdown(citiesCache[provinceName]);
    return;
  }

  try {
    const response = await fetch('https://equran.id/api/v2/shalat/kabkota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provinsi: provinceName })
    });
    if (!response.ok) throw new Error('Gagal mengambil kota');
    const resData = await response.json();
    if (resData.code === 200 && Array.isArray(resData.data)) {
      citiesCache[provinceName] = resData.data;
      populateCitiesDropdown(resData.data);
    }
  } catch (err) {
    console.error('Error fetching cities:', err);
    selectKabkota.innerHTML = '<option value="">Gagal memuat kabupaten/kota</option>';
  }
}

function populateCitiesDropdown(cities) {
  selectKabkota.innerHTML = '';
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.innerText = city;
    if (city.toLowerCase() === appSettings.kabkota.toLowerCase()) {
      opt.selected = true;
    }
    selectKabkota.appendChild(opt);
  });
}

function saveSettings() {
  const mode = Array.from(locationModeRadios).find(r => r.checked).value;
  appSettings.locationMode = mode;
  appSettings.apiSource = selectApiSource.value;
  
  if (selectApiSource.value === 'equran') {
    appSettings.provinsi = selectProvinsi.value;
    appSettings.kabkota = selectKabkota.value;
  } else {
    appSettings.city = inputCity.value.trim() || 'Jakarta';
    appSettings.country = inputCountry.value.trim() || 'Indonesia';
  }

  appSettings.soundType = selectSoundType.value;
  appSettings.adzanFile = selectAdzanFile.value;

  localStorage.setItem('shalat-dulu-settings', JSON.stringify(appSettings));
  
  // Reload prayer times
  fetchPrayerTimes();
  
  // Transition back to main screen
  showScreen(mainScreen);
}

function updateSoundButtonUI() {
  if (appSettings.soundEnabled) {
    soundIconOn.classList.remove('hidden');
    soundIconOff.classList.add('hidden');
    soundStatusText.innerText = 'Suara: On';
  } else {
    soundIconOn.classList.add('hidden');
    soundIconOff.classList.remove('hidden');
    soundStatusText.innerText = 'Suara: Off';
    stopAllSounds();
  }
}

function toggleSound() {
  appSettings.soundEnabled = !appSettings.soundEnabled;
  localStorage.setItem('shalat-dulu-settings', JSON.stringify(appSettings));
  updateSoundButtonUI();
}

function updateAdzanSelectorVisibility() {
  if (selectSoundType.value === 'adzan') {
    adzanSelectorGroup.classList.remove('hidden');
    adzanSelectorGroup.classList.add('animate-fade');
  } else {
    adzanSelectorGroup.classList.add('hidden');
  }
}

// 3. Screen Navigation
function showScreen(screen) {
  mainScreen.classList.remove('active');
  settingsScreen.classList.remove('active');
  screen.classList.add('active');
  
  // Refresh dropdown selections when entering settings screen
  if (screen === settingsScreen && provincesList.length > 0) {
    populateProvincesDropdown();
  }
}

// 4. Clock and Timers
function startClock() {
  setInterval(() => {
    const now = new Date();
    digitalClock.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    
    if (nextPrayer) {
      updateCountdown();
    }
  }, 1000);
}

// 5. API Integrations
async function fetchPrayerTimes() {
  currentCityEl.innerText = 'Memperbarui...';
  
  try {
    // Check if Auto-Location
    if (appSettings.locationMode === 'auto') {
      await fetchPrayerTimesAuto();
    } else {
      // Manual Location: route by selected API Source
      if (appSettings.apiSource === 'equran') {
        await fetchPrayerTimesEQuran();
      } else {
        await fetchPrayerTimesAladhan(appSettings.city, appSettings.country);
      }
    }
  } catch (err) {
    console.error('Error fetching timings:', err);
    currentCityEl.innerText = 'Koneksi Bermasalah';
    countdownLabel.innerText = 'Error';
    countdownTimer.innerText = 'Hubungkan Internet';
  }
}

// 5a. Auto-Location fetch (uses Aladhan as fallback/global helper)
async function fetchPrayerTimesAuto() {
  let city = 'Jakarta';
  let country = 'Indonesia';

  try {
    const geoResponse = await fetch('https://ipapi.co/json/');
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData.city && geoData.country_name) {
        city = geoData.city;
        country = geoData.country_name;
      }
    }
  } catch (geoErr) {
    console.warn('Gagal mendeteksi lokasi otomatis, menggunakan manual fallback:', geoErr);
  }

  activeLocation = { city, country };
  currentCityEl.innerText = `${city}, ${country}`;

  await fetchPrayerTimesAladhan(city, country);
}

// 5b. EQuran API implementation
async function fetchPrayerTimesEQuran() {
  const prov = appSettings.provinsi;
  const kab = appSettings.kabkota;

  activeLocation = { city: kab, country: 'Indonesia' };
  currentCityEl.innerText = `${kab}, ${prov}`;

  const response = await fetch('https://equran.id/api/v2/shalat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provinsi: prov, kabkota: kab })
  });

  if (!response.ok) throw new Error('EQuran API Request failed');
  const resData = await response.json();

  if (resData.code === 200 && resData.data && Array.isArray(resData.data.jadwal)) {
    const today = new Date();
    const todayDate = today.getDate(); // 1-31
    const jadwalToday = resData.data.jadwal.find(j => j.tanggal === todayDate);

    if (jadwalToday) {
      // Map equran fields to app fields
      prayerTimings = {
        Imsak: jadwalToday.imsak,
        Subuh: jadwalToday.subuh,
        Zuhur: jadwalToday.dzuhur,
        Asar: jadwalToday.ashar,
        Maghrib: jadwalToday.maghrib,
        Isya: jadwalToday.isya
      };

      // Simpan jadwal dan lokasi ke localStorage untuk digunakan oleh widget
      localStorage.setItem('shalat-dulu-timings', JSON.stringify(prayerTimings));
      localStorage.setItem('shalat-dulu-active-location', JSON.stringify(activeLocation));

      // Populate list in UI
      Object.keys(prayerTimings).forEach(prayer => {
        const el = document.getElementById(`time-${prayer}`);
        if (el) el.innerText = prayerTimings[prayer];
      });

      determineNextPrayer();
    } else {
      throw new Error('Jadwal hari ini tidak ditemukan');
    }
  } else {
    throw new Error('Respons API EQuran tidak valid');
  }
}

// 5c. Aladhan API implementation
async function fetchPrayerTimesAladhan(city, country) {
  const method = country.toLowerCase() === 'indonesia' ? 11 : 3;
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Aladhan API Request failed');

  const data = await response.json();
  if (data.code === 200 && data.data && data.data.timings) {
    const timings = data.data.timings;
    prayerTimings = {
      Imsak: timings.Imsak,
      Subuh: timings.Fajr,
      Zuhur: timings.Dhuhr,
      Asar: timings.Asr,
      Maghrib: timings.Maghrib,
      Isya: timings.Isha
    };

    // Simpan jadwal dan lokasi ke localStorage untuk digunakan oleh widget
    localStorage.setItem('shalat-dulu-timings', JSON.stringify(prayerTimings));
    localStorage.setItem('shalat-dulu-active-location', JSON.stringify(activeLocation));

    // Update times in the UI list
    Object.keys(prayerTimings).forEach(prayer => {
      const el = document.getElementById(`time-${prayer}`);
      if (el) el.innerText = prayerTimings[prayer];
    });

    determineNextPrayer();
  } else {
    throw new Error('Respons API Aladhan tidak valid');
  }
}

function parseTimeString(timeStr, addToDate = 0) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + addToDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function determineNextPrayer() {
  const now = new Date();
  const list = [];
  
  Object.keys(prayerTimings).forEach(name => {
    const time = parseTimeString(prayerTimings[name]);
    list.push({ name, time });
  });

  // Sort chronologically
  list.sort((a, b) => a.time - b.time);

  // Find next prayer after now
  let found = list.find(p => p.time > now);

  if (!found) {
    // If all prayers today have passed, the next one is the first prayer of tomorrow (Imsak tomorrow)
    const firstPrayerName = list[0].name;
    const tomorrowTime = parseTimeString(prayerTimings[firstPrayerName], 1);
    nextPrayer = { name: firstPrayerName, time: tomorrowTime, isTomorrow: true };
  } else {
    nextPrayer = { name: found.name, time: found.time, isTomorrow: false };
  }

  // Highlight next prayer card in UI
  document.querySelectorAll('.prayer-card').forEach(card => {
    card.classList.remove('active');
    if (card.getAttribute('data-prayer') === nextPrayer.name) {
      card.classList.add('active');
    }
  });

  updateCountdown();
}

function updateCountdown() {
  const now = new Date();
  let diffMs = nextPrayer.time - now;

  // Handle boundary checks (when current prayer time is reached exactly)
  if (diffMs <= 0) {
    triggerAlarm(nextPrayer.name);
    // Recalculate next prayer immediately
    determineNextPrayer();
    return;
  }

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const pad = (num) => String(num).padStart(2, '0');
  
  const timerString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  countdownTimer.innerText = timerString;
  countdownLabel.innerText = `Menuju ${nextPrayer.name}${nextPrayer.isTomorrow ? ' (Besok)' : ''}`;

  // Update native macOS menu bar title: "Subuh -04:45"
  if (window.electronAPI) {
    const compactCountdown = `${nextPrayer.name} -${pad(hours)}:${pad(minutes)}`;
    window.electronAPI.updateTrayTitle(compactCountdown);
  }
}

// 6. Alarms & Sound Synthesizer
function triggerAlarm(prayerName) {
  const bodyText = `Waktu shalat ${prayerName} telah tiba untuk wilayah ${activeLocation.city}.`;
  
  // Show notification
  sendNotification(`Shalat Dulu - ${prayerName}`, bodyText);

  // Play Audio
  if (appSettings.soundEnabled) {
    if (appSettings.soundType === 'adzan') {
      playAdzan();
    } else if (appSettings.soundType === 'chime') {
      playSyntheticChime();
    }
  }
}

function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    createNativeNotification(title, body);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        createNativeNotification(title, body);
      }
    });
  }
}

function createNativeNotification(title, body) {
  if (currentNotification) currentNotification.close();
  
  currentNotification = new Notification(title, {
    body: body,
    silent: true // Since we handle sound manually
  });

  currentNotification.onclick = () => {
    stopAllSounds();
  };
}

// Synthetic chime using Web Audio API (Offline, Zero-dependency)
function playSyntheticChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Warm chords in C Major 7 / F Major 7 for a spiritual feel
    const frequencies = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
    
    frequencies.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.12);
      
      // Envelopes
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + index * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 2.5);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now + index * 0.12);
      osc.stop(now + index * 0.12 + 3.0);
    });
  } catch (err) {
    console.error('Web Audio API chime failed:', err);
  }
}

function playAdzan() {
  stopAllSounds();
  
  // Memutar file adzan lokal yang dipilih dari folder assets
  audioAdzan.src = `assets/${appSettings.adzanFile || 'Athan Alafasy.mp3'}`;
  audioAdzan.currentTime = 0;
  
  audioAdzan.play()
    .catch(err => {
      console.warn('Gagal memutar adzan lokal:', err);
      // Fallback ke chime jika terjadi kendala akses file
      playSyntheticChime();
    });
}

function stopAllSounds() {
  audioAdzan.pause();
  audioAdzan.currentTime = 0;
}

// 7. Event Listeners Setup
function setupEventListeners() {
  // Navigation
  btnSettings.addEventListener('click', () => showScreen(settingsScreen));
  btnBackSettings.addEventListener('click', () => {
    loadSettings(); // revert un-saved UI state
    showScreen(mainScreen);
  });

  // Sound toggle
  btnToggleSound.addEventListener('click', toggleSound);

  // Radio input change (Auto / Manual)
  Array.from(locationModeRadios).forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'manual') {
        manualLocationInputs.classList.remove('hidden');
        manualLocationInputs.classList.add('animate-fade');
      } else {
        manualLocationInputs.classList.add('hidden');
      }
    });
  });

  // API Source change (EQuran / Aladhan)
  selectApiSource.addEventListener('change', () => {
    updateApiSourceInputsVisibility();
    if (selectApiSource.value === 'equran' && provincesList.length > 0) {
      populateProvincesDropdown();
    }
  });

  // Sound type change (show/hide adzan file selector)
  selectSoundType.addEventListener('change', () => {
    updateAdzanSelectorVisibility();
  });

  // Province dropdown change
  selectProvinsi.addEventListener('change', (e) => {
    handleProvinceChange(e.target.value);
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', saveSettings);

  // Test Utilities
  btnTestNotification.addEventListener('click', () => {
    sendNotification('Test Pengingat', `Ini adalah simulasi notifikasi shalat untuk ${activeLocation.city}.`);
  });

  btnTestSound.addEventListener('click', () => {
    const type = selectSoundType.value;
    if (type === 'adzan') {
      playAdzan();
    } else if (type === 'chime') {
      playSyntheticChime();
    } else {
      alert('Tipe alarm diatur ke "Tanpa Suara"');
    }
  });

  // System actions
  btnQuit.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.quitApp();
    }
  });

  btnDevTools.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.showDevTools();
    }
  });

  // Ask notification permission on first launch if not granted
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  // Widget toggle action
  btnToggleWidget.addEventListener('click', async () => {
    if (window.electronAPI) {
      const isOpen = await window.electronAPI.isWidgetOpen();
      window.electronAPI.toggleWidget(!isOpen);
    }
  });

  // Widget status listener
  if (window.electronAPI) {
    window.electronAPI.onWidgetStatusChanged((isOpen) => {
      widgetStatusText.innerText = isOpen ? 'Widget: On' : 'Widget: Off';
    });

    // Check initial state
    window.electronAPI.isWidgetOpen().then((isOpen) => {
      widgetStatusText.innerText = isOpen ? 'Widget: On' : 'Widget: Off';
    });
  }

  // Refresh Doa
  if (btnRefreshDoa) {
    btnRefreshDoa.addEventListener('click', () => {
      rotateRandomDoa();
    });
  }
}

// 8. Doa Harian (Daily Du'a) Integrations
async function fetchDoaList() {
  if (doaGrup) {
    doaNama.innerText = 'Memuat doa...';
    doaArab.innerText = '';
    doaLatin.innerText = '';
    doaArti.innerText = '';
  }

  try {
    const response = await fetch('https://equran.id/api/doa');
    if (!response.ok) throw new Error('API request failed');
    const resData = await response.json();
    if (resData.status === 'success' && Array.isArray(resData.data)) {
      doaList = resData.data;
      displayRandomDoa();
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (err) {
    console.error('Gagal mengambil daftar doa:', err);
    if (doaNama) {
      doaNama.innerHTML = '<span class="text-danger">Gagal Memuat Doa</span>';
      doaArti.innerHTML = 'Pastikan perangkat terhubung ke internet. <a href="#" id="retry-fetch-doa" style="color: #0A84FF; text-decoration: none; font-weight: 600;">Coba Lagi</a>';
      
      const retryBtn = document.getElementById('retry-fetch-doa');
      if (retryBtn) {
        retryBtn.addEventListener('click', (e) => {
          e.preventDefault();
          fetchDoaList();
        });
      }
    }
  }
}

function displayRandomDoa() {
  if (!doaList || doaList.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * doaList.length);
  const selectedDoa = doaList[randomIndex];
  
  if (doaGrup) doaGrup.innerText = selectedDoa.grup || 'Doa Harian';
  if (doaNama) doaNama.innerText = selectedDoa.nama || '';
  if (doaArab) doaArab.innerText = selectedDoa.ar || '';
  if (doaLatin) doaLatin.innerText = selectedDoa.tr || '';
  if (doaArti) doaArti.innerText = selectedDoa.idn || '';
}

function rotateRandomDoa() {
  if (!doaList || doaList.length === 0) {
    fetchDoaList();
    return;
  }

  const doaCard = document.querySelector('.doa-card');
  if (doaCard) {
    // Add class to trigger animation
    doaCard.classList.add('doa-card-content-fade');
    
    // Halfway through animation, swap content
    setTimeout(() => {
      displayRandomDoa();
    }, 150);

    // Remove animation class after animation completes
    setTimeout(() => {
      doaCard.classList.remove('doa-card-content-fade');
    }, 300);
  } else {
    displayRandomDoa();
  }
}
