
/* --- nav toggle --- */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const barIcon = document.getElementById('bar');
if(navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    barIcon.className = navLinks.classList.contains('show') ? 'ri-close-line' : 'ri-menu-line';
  });
}

/* --- smooth anchors & active state --- */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navLinks.classList.remove('show');
      barIcon.className = 'ri-menu-line';
      document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
      link.classList.add('active');
    }
  });
});

/* --- scroll reveal (IntersectionObserver) --- */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll('[data-anim]').forEach(el => revealObserver.observe(el));

/* --- stagger grids delays --- */
document.querySelectorAll('.cards-grid .crd').forEach((el, i) => { el.style.transitionDelay = `${i * 60}ms`; });
document.querySelectorAll('.blog-grid .blog-card').forEach((el, i) => { el.style.transitionDelay = `${i * 80}ms`; });

/* ==========================
   PARALLAX / MAGNETIC BEHAVIOR
   ========================== */
const parallaxElements = document.querySelectorAll('[data-parallax]');
const magneticElems = document.querySelectorAll('.magnetic');

let mouseX = 0, mouseY = 0;
let winW = window.innerWidth, winH = window.innerHeight;

window.addEventListener('resize', () => { winW = window.innerWidth; winH = window.innerHeight; });

window.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
});

/* parallax update loop (lightweight, requestAnimationFrame) */
function updateParallax() {
  parallaxElements.forEach(el => {
    const strength = Number(el.dataset.strength || 8);
    // position relative to center
    const rect = el.getBoundingClientRect();
    const elCenterX = rect.left + rect.width / 2;
    const elCenterY = rect.top + rect.height / 2;
    const dx = (mouseX - elCenterX) / winW;
    const dy = (mouseY - elCenterY) / winH;
    // apply transform
    const tx = dx * strength;
    const ty = dy * strength;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  });

  // magnetic effect: slightly pull elements toward pointer if close
  magneticElems.forEach(el => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const distX = mouseX - cx;
    const distY = mouseY - cy;
    const dist = Math.hypot(distX, distY);
    const maxEffect = 40; // px
    if (dist < 180) {
      const sx = (distX / dist) * Math.min(maxEffect, (180 - dist) * 0.35 || 0);
      const sy = (distY / dist) * Math.min(maxEffect, (180 - dist) * 0.35 || 0);
      el.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    } else {
      // reset only parallax-managed ones keep existing transform (parallax will override)
      if (!el.hasAttribute('data-parallax')) el.style.transform = '';
    }
  });

  requestAnimationFrame(updateParallax);
}
requestAnimationFrame(updateParallax);

/* ==========================
   CURSOR AURA + PARTICLE TRAIL
   ========================== */
const aura = document.getElementById('cursorAura');
const canvas = document.getElementById('cursorCanvas');
const ctx = canvas.getContext('2d');
let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;
let cursor = { x: cw/2, y: ch/2, vx: 0, vy: 0 };
let particles = [];
const MAX_PARTICLES = 90;

// handle resize
window.addEventListener('resize', () => {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
});

// pointer move updates aura & spawns particles
let lastSpawn = 0;
window.addEventListener('mousemove', e => {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  aura.style.left = `${cursor.x}px`;
  aura.style.top = `${cursor.y}px`;
  // small scale pulse when moving fast
  aura.style.transform = `translate(-50%,-50%) scale(${Math.min(1.25, 0.9 + Math.hypot(e.movementX, e.movementY)/50)})`;

  const now = performance.now();
  if (now - lastSpawn > 8) { // throttle spawn
    spawnParticle(cursor.x, cursor.y, e.movementX, e.movementY);
    lastSpawn = now;
  }
});

// hide aura on touch devices (CSS also hides)
window.addEventListener('touchstart', () => { aura.style.display = 'none'; canvas.style.display = 'none'; });

// particle factory
function spawnParticle(x, y, vx=0, vy=0) {
  if (particles.length > MAX_PARTICLES) particles.shift();
  const p = {
    x: x + (Math.random()-0.5) * 8,
    y: y + (Math.random()-0.5) * 8,
    vx: vx * 0.08 + (Math.random()-0.5) * 0.6,
    vy: vy * 0.08 + (Math.random()-0.5) * 0.6,
    life: 0,
    ttl: 60 + Math.random() * 60,
    r: 2 + Math.random()*3,
    hue: 180 + Math.random()*60
  };
  particles.push(p);
}

// particle render loop
function renderParticles() {
  ctx.clearRect(0,0,cw,ch);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life++;
    const alpha = Math.max(0, 1 - p.life / p.ttl);

    // glow
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*6);
    g.addColorStop(0, `hsla(${p.hue}, 90%, 60%, ${alpha*0.9})`);
    g.addColorStop(0.4, `hsla(${p.hue}, 80%, 50%, ${alpha*0.35})`);
    g.addColorStop(1, `hsla(${p.hue}, 80%, 45%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r*3, 0, Math.PI*2);
    ctx.fill();

    if (p.life > p.ttl) particles.splice(i,1);
  }

  requestAnimationFrame(renderParticles);
}
requestAnimationFrame(renderParticles);

/* subtle auto-drift for aura when idle */
let idleTimer = null;
let idleAngle = 0;
function idleDrift() {
  idleAngle += 0.01;
  aura.style.left = `${cursor.x + Math.sin(idleAngle)*3}px`;
  aura.style.top = `${cursor.y + Math.cos(idleAngle)*3}px`;
  requestAnimationFrame(idleDrift);
}
requestAnimationFrame(idleDrift);


// hide heavy interactions for touch devices (already via CSS) - additionally stop particle loop
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  // stop particle loop by clearing particles and hiding canvas/aura
  particles = [];
  canvas.style.display = 'none';
  aura.style.display = 'none';
}


document.querySelectorAll('.card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.transition = 'transform .18s cubic-bezier(.2,.9,.2,1)';
    el.style.transform += ' scale(1.02)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
});


function connect(){
  const name = document.getElementById('connectName');
  const number = document.getElementById('connectNumber');
  if (!name || !number) { alert('Please fill the form fields.'); return; }
  if (name.value.trim() === '' || number.value.trim() === '') {
    alert('Please enter both name and number.');
  } else {
    alert('Thanks for connecting!');
    name.value = ''; number.value = '';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    navLinks.classList.remove('show');
    if (barIcon) barIcon.className = 'ri-menu-line';
  }
});

