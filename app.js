const users = [
  { id: "Eltohamy", pass: "551855125500", name: "المهندس مهند التهامي", role: "admin" },
  { id: "Moheb", pass: "0102030", name: "مهيب", role: "user" },
  { id: "Elhgrasy", pass: "203010", name: "الهجراسي", role: "user" },
  { id: "Bahe", pass: "55185512", name: "باهي", role: "user" }
];

let current = null, view = 'my', lastData = {};

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service Worker مسجل'))
    .catch(err => console.log('خطأ في Service Worker:', err));
}

function toggleReg(s) { 
  document.getElementById('loginOverlay').style.display = s ? 'none' : 'flex'; 
  document.getElementById('registerOverlay').style.display = s ? 'flex' : 'none'; 
}

function sendRequest() {
  const msg = `طلب تصريح دخول للمنصة:%0Aالاسم: ${document.getElementById('regName').value}%0Aاليوزر المطلوب: ${document.getElementById('regUser').value}`;
  window.open(`https://wa.me/201021102607?text=${msg}`);
}

function login() {
  const u = document.getElementById('u').value, p = document.getElementById('p').value;
  const user = users.find(x => x.id === u && x.pass === p);
  
  if(user) {
    current = user;
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('welcomeMsg').innerText = "مرحباً: " + current.name;
    document.getElementById('role').innerText = current.role === 'admin' ? "مدير" : "ضابط";
    
    if(current.role === 'admin') 
      document.getElementById('adminTabs').style.display = 'block';
    
    start();
  } else { 
    alert("خطأ في البيانات"); 
  }
}

function start() {
  setInterval(() => { 
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('ar-EG'); 
  }, 1000);
  
  build('camTime'); 
  build('realTime');
  render();
}

function build(id) {
  const el = document.getElementById(id), n = new Date();
  el.innerHTML = `
    <div class="date-picker-col">
      <div class="date-label">يوم</div>
      <select class="d" onchange="updateDays('${id}')">${o(1,31,n.getDate())}</select>
    </div>
    <div class="date-picker-col">
      <div class="date-label">شهر</div>
      <select class="m" onchange="updateDays('${id}')">${o(1,12,n.getMonth()+1)}</select>
    </div>
    <div class="date-picker-col">
      <div class="date-label">سنة</div>
      <select class="y" onchange="updateDays('${id}')">${o(2000,2200,n.getFullYear())}</select>
    </div>
    <div class="date-picker-col">
      <div class="date-label">ساعة</div>
      <select class="h">${o(0,23,n.getHours())}</select>
    </div>
    <div class="date-picker-col">
      <div class="date-label">دقيقة</div>
      <select class="i">${o(0,59,n.getMinutes())}</select>
    </div>
  `;
}

function updateDays(id) {
  const el = document.getElementById(id);
  const month = parseInt(el.querySelector('.m').value);
  const year = parseInt(el.querySelector('.y').value);
  const currentDay = parseInt(el.querySelector('.d').value);
  
  let maxDays = 31;
  if (month === 2) {
    // فبراير - تحقق من السنة الكبيسة
    maxDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
  } else if ([4, 6, 9, 11].includes(month)) {
    // أبريل، يونيو، سبتمبر، نوفمبر
    maxDays = 30;
  }
  
  const daySelect = el.querySelector('.d');
  const selectedDay = Math.min(currentDay, maxDays);
  daySelect.innerHTML = o(1, maxDays, selectedDay);
}

function o(s,e,v) { 
  let r=""; 
  for(let i=s;i<=e;i++) 
    r+=`<option value="${i}" ${i==v?'selected':''}>${i<10?'0'+i:i}</option>`; 
  return r; 
}

function calculate() {
  const cam = get('camTime'), realTarget = get('realTime');
  const now = new Date();
  const diffMs = now.getTime() - cam.getTime();
  const res = new Date(realTarget.getTime() - diffMs);
  
  const abs = Math.abs(diffMs), 
        d = Math.floor(abs/86400000), 
        h = Math.floor((abs%86400000)/3600000), 
        m = Math.floor((abs%3600000)/60000);
  
  const status = diffMs > 0 ? "متأخر" : "متقدم";
  const analysis = `${status} بمقدار ${d}ي ${h}س ${m}د`;
  
  lastData = { res: res.toLocaleString('ar-EG'), diff: analysis };
  
  document.getElementById('resTime').innerText = res.toLocaleTimeString('ar-EG', {
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true
  });
  
  document.getElementById('fullAnalysis').innerText = analysis;
  document.getElementById('result').style.display = 'block';
}

function get(id) {
  const e = document.getElementById(id);
  return new Date(
    e.querySelector('.y').value, 
    e.querySelector('.m').value-1, 
    e.querySelector('.d').value, 
    e.querySelector('.h').value, 
    e.querySelector('.i').value
  );
}

function save() {
  const title = prompt("اسم الموقع:"); 
  if(!title) return;
  
  const log = { 
    id: Date.now(), 
    uId: current.id, 
    uName: current.name, 
    title, 
    res: lastData.res, 
    diff: lastData.diff 
  };
  
  let logs = JSON.parse(localStorage.getItem('eltohamy_logs_v1') || '[]');
  logs.unshift(log); 
  localStorage.setItem('eltohamy_logs_v1', JSON.stringify(logs));
  render();
}

function deleteLog(id) {
  if(confirm("حذف؟")) {
    let logs = JSON.parse(localStorage.getItem('eltohamy_logs_v1') || '[]');
    logs = logs.filter(l => l.id !== id);
    localStorage.setItem('eltohamy_logs_v1', JSON.stringify(logs));
    render();
  }
}

function render() {
  let logs = JSON.parse(localStorage.getItem('eltohamy_logs_v1') || '[]');
  if(view === 'my') logs = logs.filter(l => l.uId === current.id);
  
  document.getElementById('logList').innerHTML = logs.map(l => `
    <div class="log-item">
      <i class="fas fa-trash-alt delete-btn" 
         style="position: absolute; left: 15px; top: 15px; opacity: 0.3; cursor: pointer;" 
         onclick="deleteLog(${l.id})"></i>
      <div style="font-weight:bold; color:var(--accent); font-size:0.9rem;">📍 ${l.title}</div>
      <div style="color:var(--danger); font-size:0.85rem; margin:8px 0;">🎯 البحث: ${l.res}</div>
      <div style="font-size:0.75rem; opacity:0.7;">${l.diff}</div>
    </div>
  `).join('') || '<p style="text-align:center; font-size:0.8rem; opacity:0.5;">لا يوجد سجلات</p>';
}
