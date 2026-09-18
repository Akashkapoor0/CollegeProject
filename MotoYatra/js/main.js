// ==========================================
// MotoYatra — Motorbike Rentals India
// ==========================================

let allBikes = [];
let currentPage = 'home';
let pendingBikeId = null;
let selectedDurationHours = null;

// ==========================================
// PICKUP LOCATIONS PER CITY
// ==========================================

const PICKUP_LOCATIONS = {
  mumbai:    { address: 'Shop 14, Dadar Market, Dadar (W), Mumbai – 400 028', landmark: 'Near Dadar Railway Station (West Exit)', timing: '8:00 AM – 9:00 PM' },
  delhi:     { address: '42, Connaught Place, Block F, New Delhi – 110 001', landmark: 'Near Rajiv Chowk Metro, Gate No. 5', timing: '8:00 AM – 9:00 PM' },
  bangalore: { address: 'No. 7, Church Street, MG Road, Bengaluru – 560 001', landmark: 'Opposite Trinity Metro Station', timing: '8:00 AM – 9:00 PM' },
  hyderabad: { address: 'Road No. 2, Banjara Hills, Hyderabad – 500 034', landmark: 'Next to GVK One Mall', timing: '8:00 AM – 9:00 PM' },
  chennai:   { address: '23, Anna Salai, Thousand Lights, Chennai – 600 002', landmark: 'Near Thousand Lights Metro Station', timing: '8:00 AM – 9:00 PM' },
  kolkata:   { address: '11, Park Street, Taltala, Kolkata – 700 016', landmark: 'Opposite Oxford Bookstore', timing: '8:00 AM – 8:00 PM' },
  jaipur:    { address: 'C-18, MI Road, Near Panch Batti, Jaipur – 302 001', landmark: 'Near Jaipur Junction Railway Station', timing: '8:00 AM – 8:00 PM' },
  goa:       { address: 'Shop 3, Calangute Beach Road, Calangute, Goa – 403 516', landmark: 'Near Calangute Beach Entrance', timing: '7:00 AM – 10:00 PM' },
  pune:      { address: 'FC Road, Deccan Gymkhana, Pune – 411 004', landmark: 'Near Deccan Bus Stand', timing: '8:00 AM – 9:00 PM' },
  ahmedabad: { address: 'CG Road, Navrangpura, Ahmedabad – 380 009', landmark: 'Near Swami Vivekanand Statue', timing: '8:00 AM – 8:00 PM' },
};

function getCityPickup() {
  const city = localStorage.getItem('my_city');
  return city ? PICKUP_LOCATIONS[city] : null;
}

// ==========================================
// INIT
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  allBikes = loadBikes();
  initCity();
  renderNavActions();
  navigate('home');
});

// ==========================================
// MOTORBIKE DATA
// ==========================================

// ---- EMBEDDED BIKE DATA — works offline without any server ----
  const BIKES_DATA = [
  {
    "id": 1,
    "name": "Royal Enfield Classic 350",
    "category": "Cruiser",
    "price": 500,
    "priceDay": 2500,
    "emoji": "🏍️",
    "image": "",
    "description": "The iconic thumper. Timeless Royal Enfield design with a punchy 350cc engine perfect for highways and city roads alike.",
    "features": [
      "350cc Engine",
      "Air-Cooled",
      "Electric Start",
      "Disc Brakes"
    ],
    "available": true,
    "rating": 4.9
  },
  {
    "id": 2,
    "name": "Royal Enfield Bullet 500",
    "category": "Cruiser",
    "price": 600,
    "priceDay": 3000,
    "emoji": "🏍️",
    "image": "",
    "description": "The legendary Bullet. A symbol of power and prestige on Indian roads with its signature thump.",
    "features": [
      "500cc Engine",
      "Cast Iron Bore",
      "Twin Seats",
      "Classic Look"
    ],
    "available": true,
    "rating": 4.8
  },
  {
    "id": 3,
    "name": "Royal Enfield Himalayan",
    "category": "Adventure",
    "price": 750,
    "priceDay": 3800,
    "emoji": "🏔️",
    "image": "",
    "description": "Built for the mountains. The Himalayan conquers any terrain from Leh-Ladakh highways to forest trails.",
    "features": [
      "411cc Engine",
      "Long Travel Suspension",
      "GPS Mount",
      "All-Terrain Tyres"
    ],
    "available": true,
    "rating": 4.9
  },
  {
    "id": 4,
    "name": "Royal Enfield Thunderbird X",
    "category": "Cruiser",
    "price": 550,
    "priceDay": 2800,
    "emoji": "🏍️",
    "image": "",
    "description": "Comfortable cruiser for long-distance rides. Relaxed seating and powerful brakes for highway touring.",
    "features": [
      "350cc Engine",
      "ABS",
      "Touring Handlebars",
      "Saddlebag Ready"
    ],
    "available": true,
    "rating": 4.7
  },
  {
    "id": 5,
    "name": "KTM Duke 200",
    "category": "Sports",
    "price": 400,
    "priceDay": 2000,
    "emoji": "🔥",
    "image": "",
    "description": "Austrian precision on Indian roads. Lightweight, nimble and thrilling — the Duke 200 is a street fighter.",
    "features": [
      "200cc Engine",
      "Trellis Frame",
      "WP Suspension",
      "Dual-Channel ABS"
    ],
    "available": true,
    "rating": 4.8
  },
  {
    "id": 6,
    "name": "KTM Duke 390",
    "category": "Sports",
    "price": 650,
    "priceDay": 3200,
    "emoji": "🔥",
    "image": "",
    "description": "The beast. 390cc of raw performance with class-leading braking and suspension. Not for the faint-hearted.",
    "features": [
      "390cc Engine",
      "Cornering ABS",
      "Quickshifter",
      "TFT Display"
    ],
    "available": false,
    "rating": 5
  },
  {
    "id": 7,
    "name": "Bajaj Pulsar NS200",
    "category": "Sports",
    "price": 350,
    "priceDay": 1800,
    "emoji": "⚡",
    "image": "",
    "description": "Naked street fighter from Bajaj. Aggressive styling with a 200cc liquid-cooled engine for spirited riding.",
    "features": [
      "200cc Liquid-Cooled",
      "Perimeter Frame",
      "Mono Suspension",
      "Triple Spark"
    ],
    "available": true,
    "rating": 4.6
  },
  {
    "id": 8,
    "name": "Bajaj Dominar 400",
    "category": "Tourer",
    "price": 500,
    "priceDay": 2500,
    "emoji": "🏍️",
    "image": "",
    "description": "Dark, powerful and long-range. The Dominar 400 blends sports performance with touring capability.",
    "features": [
      "373cc Engine",
      "Twin Exhaust",
      "Dual-Channel ABS",
      "LED Headlamps"
    ],
    "available": true,
    "rating": 4.7
  },
  {
    "id": 9,
    "name": "Yamaha FZ-S V3",
    "category": "Sports",
    "price": 280,
    "priceDay": 1400,
    "emoji": "⚡",
    "image": "",
    "description": "Smooth, stylish and fuel-efficient. The FZ-S is perfect for daily commutes and weekend fun rides.",
    "features": [
      "150cc FI Engine",
      "LED All-Round",
      "Single-Channel ABS",
      "Assist & Slipper Clutch"
    ],
    "available": true,
    "rating": 4.5
  },
  {
    "id": 10,
    "name": "TVS Apache RTR 200 4V",
    "category": "Sports",
    "price": 350,
    "priceDay": 1700,
    "emoji": "⚡",
    "image": "",
    "description": "Race-tuned performance from TVS. The Apache RTR 200 brings track-inspired technology to city streets.",
    "features": [
      "200cc 4V Engine",
      "Race Tuned EFI",
      "Petal Disc Brakes",
      "SmartXonnect"
    ],
    "available": true,
    "rating": 4.6
  },
  {
    "id": 11,
    "name": "Honda Activa 6G",
    "category": "Scooter",
    "price": 180,
    "priceDay": 900,
    "emoji": "🛵",
    "image": "",
    "description": "India's most trusted scooter. Easy to ride, fuel-efficient and perfect for city errands and short trips.",
    "features": [
      "110cc Silent Start",
      "Combi Brake",
      "USB Charging",
      "Under-Seat Storage"
    ],
    "available": true,
    "rating": 4.4
  },
  {
    "id": 12,
    "name": "Honda CB350 H'Ness",
    "category": "Cruiser",
    "price": 480,
    "priceDay": 2400,
    "emoji": "🏍️",
    "image": "",
    "description": "Neo-retro elegance meets modern reliability. The H'Ness offers a premium riding experience at every rpm.",
    "features": [
      "348cc Engine",
      "Dual-Channel ABS",
      "Bluetooth Connect",
      "Assist Slipper Clutch"
    ],
    "available": true,
    "rating": 4.8
  }
];

  function loadBikes() {
    return [...BIKES_DATA, ...getCustomBikes()];
  }

function getCustomBikes() {
  return JSON.parse(localStorage.getItem('my_bikes') || '[]');
}

function saveCustomBike(bike) {
  const existing = getCustomBikes();
  const nextId = Math.max(1000, ...existing.map(b => b.id), ...allBikes.map(b => b.id)) + 1;
  bike.id = nextId;
  bike.rating = 4.5;
  existing.push(bike);
  localStorage.setItem('my_bikes', JSON.stringify(existing));
  return bike;
}

function deleteCustomBike(id) {
  localStorage.setItem('my_bikes', JSON.stringify(getCustomBikes().filter(b => b.id !== id)));
  allBikes = allBikes.filter(b => b.id !== id);
}

function isCustomBike(id) {
  return getCustomBikes().some(b => b.id === id);
}

// ==========================================
// NAVIGATION
// ==========================================

window.navigate = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.remove('hidden');
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (page === 'home') renderHome();
  if (page === 'fleet') renderFleet();
  if (page === 'admin') renderAdmin();
  if (page === 'user') renderUserPanel();
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('navActions').classList.remove('open');
  return false;
};

window.toggleMenu = function() {
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('navActions').classList.toggle('open');
};

// ==========================================
// CITY
// ==========================================

window.saveCity = function(value) {
  if (value) localStorage.setItem('my_city', value);
  const label = value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  showToast(`📍 City set to ${label}`, 'success');
};

function initCity() {
  const saved = localStorage.getItem('my_city');
  if (saved) { const s = document.getElementById('citySelect'); if (s) s.value = saved; }
}

// ==========================================
// AUTH
// ==========================================

function getUsers() { return JSON.parse(localStorage.getItem('my_users') || '[]'); }
function saveUsers(u) { localStorage.setItem('my_users', JSON.stringify(u)); }
function getCurrentUser() { const r = localStorage.getItem('my_current_user'); return r ? JSON.parse(r) : null; }
function setCurrentUser(u) { u ? localStorage.setItem('my_current_user', JSON.stringify(u)) : localStorage.removeItem('my_current_user'); }

window.handleLogin = function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  if (email === 'admin@motoyatra.in' && password === 'admin123') {
    setCurrentUser({ id: 0, name: 'Admin', email, role: 'admin' });
    renderNavActions(); showToast('Welcome back, Admin! 🏍️', 'success'); navigate('admin'); return;
  }
  const user = getUsers().find(u => u.email === email && u.password === password);
  if (!user) { errEl.textContent = 'Invalid email or password.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');
  setCurrentUser({ id: user.id, name: user.name, email: user.email, role: 'user' });
  renderNavActions(); showToast(`Welcome back, ${user.name}! 🏍️`, 'success'); navigate('home');
};

window.handleRegister = function(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errEl = document.getElementById('registerError');
  if (password !== confirm) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return; }
  const users = getUsers();
  if (users.find(u => u.email === email)) { errEl.textContent = 'Email already registered.'; errEl.classList.remove('hidden'); return; }
  const newUser = { id: Date.now(), name, email, password, role: 'user' };
  users.push(newUser); saveUsers(users);
  errEl.classList.add('hidden');
  setCurrentUser({ id: newUser.id, name, email, role: 'user' });
  renderNavActions(); showToast(`Account created! Welcome, ${name}! 🏍️`, 'success'); navigate('home');
};

window.logout = function() {
  setCurrentUser(null); renderNavActions();
  showToast('You have been logged out. Ride safe!', ''); navigate('home');
};

window.switchTab = function(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('registerError').classList.add('hidden');
  return false;
};

// ==========================================
// NAV ACTIONS
// ==========================================

function renderNavActions() {
  const el = document.getElementById('navActions');
  const user = getCurrentUser();
  if (user) {
    el.innerHTML = `
      <span style="font-size:13px;font-weight:600;color:var(--gray-700);">Hi, ${user.name.split(' ')[0]}</span>
      ${user.role === 'user' ? `<button class="btn btn-outline btn-sm" onclick="navigate('user')">My Rides</button>` : ''}
      ${user.role === 'admin' ? `<button class="btn btn-outline btn-sm" onclick="navigate('admin')">Admin Panel</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
    `;
  } else {
    el.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="navigate('auth')">Login</button>
      <button class="btn btn-primary btn-sm" onclick="navigate('auth')">Register</button>
    `;
  }
}

// ==========================================
// BOOKING — STEP 1: FORM MODAL
// ==========================================

window.bookBike = function(id) {
  const user = getCurrentUser();
  if (!user) { showToast('Please login to book a motorbike!', 'error'); navigate('auth'); return; }
  const bike = allBikes.find(b => b.id === id);
  if (!bike || !bike.available) { showToast('Sorry, this motorbike is currently unavailable.', 'error'); return; }

  pendingBikeId = id;
  selectedDurationHours = null;

  document.getElementById('bfModalTitle').textContent = `Book — ${bike.name}`;
  document.getElementById('bfModalSub').textContent = `${bike.category} · ₹${bike.price}/hr${bike.priceDay ? ` · ₹${bike.priceDay}/day` : ''}`;

  document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('totalPriceVal').textContent = 'Select duration above';
  document.getElementById('confirmBookingBtn').disabled = true;

  const pickup = getCityPickup();
  const pickupCard = document.getElementById('pickupInfoCard');
  if (pickup) {
    pickupCard.innerHTML = `
      <div class="pickup-row"><span class="pickup-icon">🏢</span><div><strong>${pickup.address}</strong></div></div>
      <div class="pickup-row"><span class="pickup-icon">🗺️</span><div>${pickup.landmark}</div></div>
      <div class="pickup-row"><span class="pickup-icon">⏰</span><div>Open: ${pickup.timing}</div></div>
      <div class="pickup-note">Please bring your valid driving licence and a government-issued photo ID at the time of pickup.</div>
    `;
  } else {
    pickupCard.innerHTML = `<p class="pickup-no-city">⚠️ Please select your city from the navbar to see the nearest pickup point.</p>`;
  }

  document.getElementById('bookingFormModal').classList.remove('hidden');
};

window.selectDuration = function(hours) {
  selectedDurationHours = hours;
  document.querySelectorAll('.duration-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.hours) === hours);
  });
  const bike = allBikes.find(b => b.id === pendingBikeId);
  if (!bike) return;
  const total = hours === 24 && bike.priceDay ? bike.priceDay : bike.price * hours;
  const label = hours === 24 ? 'Full Day (24 hrs)' : `${hours} hr${hours > 1 ? 's' : ''}`;
  document.getElementById('totalPriceVal').innerHTML = `<strong>₹${total.toLocaleString('en-IN')}</strong> <span style="font-size:13px;color:var(--gray-500);">for ${label}</span>`;
  document.getElementById('confirmBookingBtn').disabled = false;
};

window.closeBookingForm = function() {
  document.getElementById('bookingFormModal').classList.add('hidden');
  pendingBikeId = null;
  selectedDurationHours = null;
};

// ==========================================
// BOOKING — STEP 2: CONFIRM
// ==========================================

window.confirmBooking = function() {
  const user = getCurrentUser();
  const bike = allBikes.find(b => b.id === pendingBikeId);
  if (!user || !bike || !selectedDurationHours) return;

  const hours = selectedDurationHours;
  const total = hours === 24 && bike.priceDay ? bike.priceDay : bike.price * hours;
  const city = localStorage.getItem('my_city');
  const cityLabel = city ? city.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not specified';
  const pickup = getCityPickup();
  const durationLabel = hours === 24 ? 'Full Day (24 hrs)' : `${hours} hr${hours > 1 ? 's' : ''}`;

  closeBookingForm();

  document.getElementById('modalBody').textContent = `You've successfully booked the ${bike.name}. Gear up and ride safe!`;
  document.getElementById('modalDetails').innerHTML = `
    <p>🏍️ <strong>Motorbike:</strong> ${bike.name}</p>
    <p>🏷️ <strong>Category:</strong> ${bike.category}</p>
    <p>⏱️ <strong>Duration:</strong> ${durationLabel}</p>
    <p>💰 <strong>Total Cost:</strong> ₹${total.toLocaleString('en-IN')}</p>
    <p>📍 <strong>City:</strong> ${cityLabel}</p>
    ${pickup ? `<p>🏢 <strong>Pickup Point:</strong> ${pickup.address}</p>` : ''}
    <p>👤 <strong>Booked by:</strong> ${user.name}</p>
    <p>📅 <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}</p>
  `;
  document.getElementById('bookingModal').classList.remove('hidden');

  const bookings = JSON.parse(localStorage.getItem('my_bookings') || '[]');
  bookings.unshift({
    id: Date.now(),
    bikeId: bike.id,
    bikeName: bike.name,
    bikeCategory: bike.category,
    bikeEmoji: bike.emoji || '🏍️',
    userId: user.id,
    userName: user.name,
    hours,
    totalCost: total,
    pricePerHr: bike.price,
    city: cityLabel,
    pickupAddress: pickup ? pickup.address : null,
    pickupLandmark: pickup ? pickup.landmark : null,
    date: new Date().toISOString(),
  });
  localStorage.setItem('my_bookings', JSON.stringify(bookings));
};

window.closeModal = function() {
  document.getElementById('bookingModal').classList.add('hidden');
};

// ==========================================
// USER PANEL
// ==========================================

function renderUserPanel() {
  const user = getCurrentUser();
  if (!user) { navigate('auth'); return; }

  document.getElementById('userPanelSub').textContent = `Hello, ${user.name}! Here's a summary of all your rides.`;

  const allBookings = JSON.parse(localStorage.getItem('my_bookings') || '[]');
  const myBookings = allBookings.filter(b => b.userId === user.id);

  const totalSpent = myBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
  const totalHours = myBookings.reduce((sum, b) => sum + (b.hours || 0), 0);

  document.getElementById('userStatsRow').innerHTML = `
    <div class="user-stat-card">
      <div class="user-stat-icon">🏍️</div>
      <div class="user-stat-num">${myBookings.length}</div>
      <div class="user-stat-label">Total Bookings</div>
    </div>
    <div class="user-stat-card">
      <div class="user-stat-icon">⏱️</div>
      <div class="user-stat-num">${totalHours}</div>
      <div class="user-stat-label">Hours Ridden</div>
    </div>
    <div class="user-stat-card">
      <div class="user-stat-icon">💰</div>
      <div class="user-stat-num">₹${totalSpent.toLocaleString('en-IN')}</div>
      <div class="user-stat-label">Total Spent</div>
    </div>
    <div class="user-stat-card">
      <div class="user-stat-icon">📍</div>
      <div class="user-stat-num">${[...new Set(myBookings.map(b => b.city).filter(Boolean))].length || '—'}</div>
      <div class="user-stat-label">Cities Explored</div>
    </div>
  `;

  const listEl = document.getElementById('userBookingsList');
  if (myBookings.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏍️</div>
        <h3>No rides yet!</h3>
        <p>Your booking history will appear here once you book your first motorbike.</p>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="navigate('fleet')">Browse Fleet</button>
      </div>
    `;
    return;
  }

  listEl.innerHTML = myBookings.map((b, i) => {
    const date = new Date(b.date);
    const dateStr = date.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    const durationLabel = b.hours === 24 ? 'Full Day (24 hrs)' : `${b.hours} hr${b.hours > 1 ? 's' : ''}`;
    return `
      <div class="booking-history-card">
        <div class="bh-left">
          <div class="bh-emoji">${b.bikeEmoji || '🏍️'}</div>
        </div>
        <div class="bh-main">
          <div class="bh-toprow">
            <div>
              <div class="bh-bike-name">${b.bikeName}</div>
              <div class="bh-category">${b.bikeCategory || ''}</div>
            </div>
            <div class="bh-booking-num">Booking #${String(i + 1).padStart(3, '0')}</div>
          </div>
          <div class="bh-details">
            <div class="bh-detail-item"><span class="bh-detail-icon">⏱️</span><span>${durationLabel}</span></div>
            <div class="bh-detail-item"><span class="bh-detail-icon">💰</span><span>₹${(b.totalCost || 0).toLocaleString('en-IN')} total</span></div>
            <div class="bh-detail-item"><span class="bh-detail-icon">📍</span><span>${b.city || '—'}</span></div>
            <div class="bh-detail-item"><span class="bh-detail-icon">📅</span><span>${dateStr} at ${timeStr}</span></div>
          </div>
          ${b.pickupAddress ? `
            <div class="bh-pickup">
              <span class="bh-pickup-icon">🏢</span>
              <div>
                <strong>Pickup:</strong> ${b.pickupAddress}
                ${b.pickupLandmark ? `<br><span style="font-size:12px;color:var(--gray-500);">${b.pickupLandmark}</span>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// HOME PAGE
// ==========================================

function renderHome() {
  animateCount('statBikes', allBikes.filter(b => b.available).length);
  const grid = document.getElementById('featuredBikes');
  if (grid) grid.innerHTML = allBikes.filter(b => b.available).slice(0, 4).map(bikeCard).join('') || '<div class="loading-spinner">No motorbikes available.</div>';
  renderCategories();
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let count = 0;
  const step = Math.ceil(target / 30);
  const t = setInterval(() => { count = Math.min(count + step, target); el.textContent = count; if (count >= target) clearInterval(t); }, 30);
}

function renderCategories() {
  const catMap = {};
  const catEmoji = { Cruiser: '🏍️', Sports: '🔥', Adventure: '🏔️', Tourer: '🛣️', Scooter: '🛵', Commuter: '⚡' };
  allBikes.forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + 1; });
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(catMap).map(([cat, count]) => `
    <div class="cat-card" onclick="filterByCategory('${cat}')">
      <div class="cat-icon">${catEmoji[cat] || '🏍️'}</div>
      <div class="cat-name">${cat}</div>
      <div class="cat-count">${count} motorbike${count !== 1 ? 's' : ''}</div>
    </div>
  `).join('');
}

window.filterByCategory = function(cat) {
  navigate('fleet');
  setTimeout(() => { const s = document.getElementById('categoryFilter'); if (s) s.value = cat; filterBikes(); }, 100);
};

// ==========================================
// FLEET PAGE
// ==========================================

function renderFleet() {
  const cats = [...new Set(allBikes.map(b => b.category))];
  const catFilter = document.getElementById('categoryFilter');
  if (catFilter) {
    const cur = catFilter.value;
    catFilter.innerHTML = `<option value="">All Categories</option>` + cats.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>${c}</option>`).join('');
  }
  filterBikes();
}

window.filterBikes = function() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || '';
  const sort = document.getElementById('sortFilter')?.value || 'name';
  let filtered = allBikes.filter(b =>
    (!search || b.name.toLowerCase().includes(search) || b.category.toLowerCase().includes(search) || (b.description || '').toLowerCase().includes(search)) &&
    (!category || b.category === category)
  );
  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else filtered.sort((a, b) => a.name.localeCompare(b.name));
  const grid = document.getElementById('fleetGrid');
  if (!grid) return;
  grid.innerHTML = filtered.length ? filtered.map(bikeCard).join('') : `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <h3>No motorbikes found</h3>
      <p>Try adjusting your search or filters.</p>
    </div>`;
};

// ==========================================
// MOTORBIKE CARD
// ==========================================

function bikeCard(bike) {
  const user = getCurrentUser();
  const canDelete = user && user.role === 'admin' && isCustomBike(bike.id);
  return `
    <div class="bike-card">
      <div class="bike-img-wrapper">
        ${bike.image
          ? `<img src="${bike.image}" alt="${bike.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"><span style="display:none;font-size:72px;">${bike.emoji || '🏍️'}</span>`
          : `<span>${bike.emoji || '🏍️'}</span>`}
        <span class="${bike.available ? 'bike-available-badge' : 'bike-unavailable-badge'}">${bike.available ? 'Available' : 'Rented'}</span>
      </div>
      <div class="bike-body">
        <div class="bike-cat">${bike.category}</div>
        <div class="bike-name">${bike.name}</div>
        <div class="bike-desc">${bike.description || ''}</div>
        ${bike.features?.length ? `<div class="bike-features">${bike.features.map(f => `<span class="bike-feature-tag">${f}</span>`).join('')}</div>` : ''}
        <div class="bike-footer">
          <div class="bike-price">
            <span class="bike-price-main">₹${bike.price}<span>/hr</span></span>
            ${bike.priceDay ? `<span style="font-size:12px;color:var(--gray-500);">₹${bike.priceDay}/day</span>` : ''}
          </div>
          <div class="bike-rating"><span>★</span> ${(bike.rating || 4.5).toFixed(1)}</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn ${bike.available ? 'btn-primary' : 'btn-outline'} btn-full"
            onclick="bookBike(${bike.id})"
            ${!bike.available ? 'disabled style="opacity:.5;cursor:not-allowed;"' : ''}>
            ${bike.available ? 'Book Now' : 'Unavailable'}
          </button>
          ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="adminDeleteBike(${bike.id})" title="Delete">🗑</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// ADMIN PANEL
// ==========================================

function renderAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') { navigate('home'); showToast('Admin access required.', 'error'); return; }
  document.getElementById('adminUserBadge').textContent = `Logged in as ${user.name}`;
  switchPanel('dashboard');
}

window.switchPanel = function(panel) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('active', l.dataset.panel === panel));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`panel-${panel}`);
  if (target) target.classList.remove('hidden');
  const titles = { dashboard: 'Dashboard', bikes: 'Manage Fleet', 'add-bike': 'Add New Motorbike', users: 'Registered Riders' };
  const titleEl = document.getElementById('adminPageTitle');
  if (titleEl) titleEl.textContent = titles[panel] || panel;
  if (panel === 'dashboard') renderDashboard();
  if (panel === 'bikes') renderAdminBikes();
  if (panel === 'users') renderAdminUsers();
  return false;
};

function renderDashboard() {
  const users = getUsers();
  const cats = [...new Set(allBikes.map(b => b.category))];
  document.getElementById('adminTotalBikes').textContent = allBikes.length;
  document.getElementById('adminAvailable').textContent = allBikes.filter(b => b.available).length;
  document.getElementById('adminTotalUsers').textContent = users.length + 1;
  document.getElementById('adminCategories').textContent = cats.length;
  const catMap = {};
  allBikes.forEach(b => { catMap[b.category] = (catMap[b.category] || 0) + 1; });
  const max = Math.max(...Object.values(catMap));
  document.getElementById('categoryBreakdown').innerHTML = Object.entries(catMap).map(([cat, count]) => `
    <div class="cat-bar-row">
      <span class="cat-bar-label">${cat}</span>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${(count / max) * 100}%"></div></div>
      <span class="cat-bar-count">${count}</span>
    </div>
  `).join('');
  const allUsers = [{ name: 'Admin', email: 'admin@motoyatra.in', role: 'admin' }, ...users];
  document.getElementById('recentUsers').innerHTML = allUsers.slice(0, 5).map(u => `
    <div class="user-row">
      <div class="user-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${u.name}</div>
        <div class="user-email">${u.email}</div>
      </div>
      <span class="user-badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span>
    </div>
  `).join('') || '<p style="color:var(--gray-500);font-size:14px;">No riders yet.</p>';
}

function renderAdminBikes() {
  const tbody = document.getElementById('adminBikesBody');
  if (!tbody) return;
  tbody.innerHTML = allBikes.map(bike => `
    <tr>
      <td><div class="bike-cell"><span class="bike-cell-emoji">${bike.emoji || '🏍️'}</span><span class="bike-cell-name">${bike.name}</span></div></td>
      <td>${bike.category}</td>
      <td>₹${bike.price}/hr</td>
      <td><span class="status-badge ${bike.available ? 'status-available' : 'status-unavailable'}">${bike.available ? 'Available' : 'Rented'}</span></td>
      <td>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="adminToggleAvailability(${bike.id})">${bike.available ? 'Mark Rented' : 'Mark Available'}</button>
          ${isCustomBike(bike.id) ? `<button class="btn btn-danger btn-sm" onclick="adminDeleteBike(${bike.id})">Delete</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500);">No motorbikes found.</td></tr>';
}

function renderAdminUsers() {
  const users = getUsers();
  const allUsers = [{ id: 0, name: 'Admin', email: 'admin@motoyatra.in', role: 'admin' }, ...users];
  const tbody = document.getElementById('adminUsersBody');
  if (!tbody) return;
  tbody.innerHTML = allUsers.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span class="user-badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
    </tr>
  `).join('');
}

window.adminToggleAvailability = function(id) {
  const bike = allBikes.find(b => b.id === id);
  if (!bike) return;
  bike.available = !bike.available;
  if (isCustomBike(id)) {
    const custom = getCustomBikes();
    const cb = custom.find(b => b.id === id);
    if (cb) { cb.available = bike.available; localStorage.setItem('my_bikes', JSON.stringify(custom)); }
  }
  renderAdminBikes();
  showToast(`${bike.name} marked as ${bike.available ? 'Available' : 'Rented'}.`, 'success');
};

window.adminDeleteBike = function(id) {
  if (!confirm('Remove this motorbike from the fleet?')) return;
  deleteCustomBike(id); renderAdminBikes(); showToast('Motorbike removed from fleet.', '');
};

window.handleAddBike = function(e) {
  e.preventDefault();
  const name = document.getElementById('bikeName').value.trim();
  const category = document.getElementById('bikeCategory').value;
  const price = parseFloat(document.getElementById('bikePrice').value);
  const priceDay = parseFloat(document.getElementById('bikePriceDay').value) || null;
  const description = document.getElementById('bikeDescription').value.trim();
  const emoji = document.getElementById('bikeEmoji').value.trim() || '🏍️';
  const image = document.getElementById('bikeImage').value.trim();
  const features = document.getElementById('bikeFeatures').value.trim().split(',').map(f => f.trim()).filter(Boolean);
  const available = document.getElementById('bikeAvailable').value === 'true';
  const saved = saveCustomBike({ name, category, price, priceDay, description, emoji, image, features, available });
  allBikes.push(saved);
  document.getElementById('addBikeForm').reset();
  showToast(`${name} added to the fleet! 🏍️`, 'success');
  switchPanel('bikes');
};

// ==========================================
// TOAST
// ==========================================

window.showToast = function(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ` ${type}` : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
};
