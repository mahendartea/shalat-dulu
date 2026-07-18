// DOM Elements
const widgetClock = document.getElementById('widget-clock');
const widgetLocation = document.getElementById('widget-location');
const widgetLabel = document.getElementById('widget-label');
const widgetPrayerName = document.getElementById('widget-prayer-name');
const widgetCountdown = document.getElementById('widget-countdown');
const btnCloseWidget = document.getElementById('btn-close-widget');

// State
let prayerTimings = {};
let activeLocation = { city: 'Banda Aceh', country: 'Indonesia' };
let nextPrayer = null;

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
  startClock();
});

function setupEventListeners() {
  // Close button hides widget
  btnCloseWidget.addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.toggleWidget(false);
    }
  });

  // Listen to storage changes from the main window
  window.addEventListener('storage', (e) => {
    if (e.key === 'shalat-dulu-timings' || e.key === 'shalat-dulu-active-location') {
      loadData();
    }
  });
}

function loadData() {
  const timingsSaved = localStorage.getItem('shalat-dulu-timings');
  const locationSaved = localStorage.getItem('shalat-dulu-active-location');

  if (timingsSaved) {
    try {
      prayerTimings = JSON.parse(timingsSaved);
    } catch (e) {
      console.error('Error parsing timings in widget:', e);
    }
  }

  if (locationSaved) {
    try {
      activeLocation = JSON.parse(locationSaved);
      // Clean up "Kab. " or "Kota " prefixes to keep widget text compact
      let cleanCityName = activeLocation.city || 'Banda Aceh';
      cleanCityName = cleanCityName.replace(/^(Kab\.\s+|Kota\s+)/i, '');
      widgetLocation.innerText = cleanCityName;
    } catch (e) {
      console.error('Error parsing location in widget:', e);
    }
  }

  determineNextPrayer();
}

function startClock() {
  // Run once immediately
  updateClockDisplay();
  
  setInterval(() => {
    updateClockDisplay();
    
    if (nextPrayer) {
      updateCountdown();
    }
  }, 1000);
}

function updateClockDisplay() {
  const now = new Date();
  widgetClock.innerText = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function parseTimeString(timeStr, addToDate = 0) {
  if (!timeStr) return new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + addToDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function determineNextPrayer() {
  if (Object.keys(prayerTimings).length === 0) {
    widgetLabel.innerText = 'Data Kosong';
    return;
  }

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
    // If all prayers today have passed, tomorrow's first prayer
    const firstPrayerName = list[0].name;
    const tomorrowTime = parseTimeString(prayerTimings[firstPrayerName], 1);
    nextPrayer = { name: firstPrayerName, time: tomorrowTime, isTomorrow: true };
  } else {
    nextPrayer = { name: found.name, time: found.time, isTomorrow: false };
  }

  widgetPrayerName.innerText = nextPrayer.name;
  widgetLabel.innerText = `Menuju ${nextPrayer.name}${nextPrayer.isTomorrow ? ' (Besok)' : ''}`;
  updateCountdown();
}

function updateCountdown() {
  const now = new Date();
  let diffMs = nextPrayer.time - now;

  // Handle boundary checks (when current prayer time is reached exactly)
  if (diffMs <= 0) {
    determineNextPrayer();
    return;
  }

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  const pad = (num) => String(num).padStart(2, '0');
  
  const timerString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  widgetCountdown.innerText = timerString;
}
