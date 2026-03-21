// ===== MOBILE NAV =====
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ===== COUNT-UP ANIMATION =====
function countUp(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target).toLocaleString('pl-PL');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target = parseInt(e.target.dataset.target);
      countUp(e.target, target);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => statsObserver.observe(el));

// ===== REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('revealed'), i * 80);
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// ===== HERO BACKGROUND CANVAS =====
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, nodes, animId;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createNodes(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }
    return arr;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const maxDist = 150;

    // Update & draw connections
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      a.pulse += a.pulseSpeed;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0, 212, 170, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const n of nodes) {
      const glow = 0.4 + Math.sin(n.pulse) * 0.3;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 212, 170, ${glow})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    const density = Math.min(60, Math.floor((W * H) / 15000));
    nodes = createNodes(density);
    if (animId) cancelAnimationFrame(animId);
    draw();
  }

  window.addEventListener('resize', () => {
    init();
  });
  init();
}

initHeroCanvas();

// ===== D3 INTEGRATION MAP =====
const integrationData = {
  nodes: [
    { id: 'ha', label: 'Home Assistant', group: 'core', desc: 'Centralny hub automatyki. 65 automatyzacji, ~3857 encji, pełna kontrola nad domem.' },
    { id: 'knx', label: 'KNX', group: 'protocol', desc: '14+ obwodów oświetlenia, klimatyzacja, wentylacja. Protokół przewodowy TP.' },
    { id: 'modbus', label: 'Modbus', group: 'protocol', desc: 'RS485 — komunikacja z falownikiem Deye, odczyt parametrów PV i baterii.' },
    { id: 'wmbus', label: 'M-Bus WL', group: 'protocol', desc: 'Wireless M-Bus — bezprzewodowy odczyt liczników Apator (woda x2, gaz).' },
    { id: 'opentherm', label: 'OpenTherm', group: 'protocol', desc: 'Komunikacja z kotłem Termet Ecodens. Watchdog automation, modulacja mocy.' },
    { id: 'zigbee', label: 'Zigbee', group: 'protocol', desc: 'Sieć czujników — temperatura, wilgotność, otwarcie drzwi/okien.' },
    { id: 'mqtt', label: 'MQTT', group: 'protocol', desc: 'Broker komunikacji dla ESPHome, czujników i urządzeń IoT.' },
    { id: 'deye', label: 'Deye Inverter', group: 'device', desc: 'Falownik hybrydowy — zarządzanie PV 8.4 kW, bateria 48V LiFePO4, sieć.' },
    { id: 'aquarea', label: 'Aquarea T-CAP', group: 'device', desc: 'Pompa ciepła Panasonic. Integracja natywna, sterowanie w algorytmie bivalent.' },
    { id: 'tesla', label: 'Tesla Model Y', group: 'device', desc: 'Ładowanie 11 kW zarządzane automatyzacją HA, optymalizacja wg taryfy G12W.' },
    { id: 'esp32', label: 'ESP32 (x4)', group: 'device', desc: '4 urządzenia ESPHome — oświetlenie garażu, czujniki, sterowanie relay.' },
    { id: 'lora32', label: 'LoRa32 WMBUS', group: 'device', desc: 'ESP32 LoRa32 jako receiver WMBus — dekodowanie ramek liczników Apator.' },
    { id: 'waveshare', label: 'Waveshare 8DI/8RO', group: 'device', desc: 'ESP32-S3-POE-ETH z 8 wejściami i 8 wyjściami. Sterowanie garażem, brama.' },
    { id: 'termet', label: 'Termet Ecodens', group: 'device', desc: 'Kocioł gazowy kondensacyjny. Backup grzewczy w algorytmie bivalent v4.' },
    { id: 'zamel', label: 'ZAMEL SBW-02', group: 'device', desc: 'Sterownik bramy garażowej. Integracja przez SUPLA → HA.' },
    { id: 'supla', label: 'SUPLA Cloud', group: 'cloud', desc: 'Legacy — automatyzacja bramy. Migracja do sterowania lokalnego w toku.' },
    { id: 'cloudflare', label: 'Cloudflare', group: 'cloud', desc: 'DNS, proxy, cache. Migracja domeny przypominamy.pl.' },
    { id: 'esphome', label: 'ESPHome', group: 'automation', desc: 'Firmware dla ESP32 — YAML config, OTA update, natywna integracja z HA.' },
    { id: 'emhass', label: 'Mini-EMHASS', group: 'automation', desc: 'Custom optymalizator energii (scipy.optimize.linprog). Sterowanie ładowaniem i pompą ciepła.' },
  ],
  links: [
    { source: 'ha', target: 'knx' },
    { source: 'ha', target: 'modbus' },
    { source: 'ha', target: 'wmbus' },
    { source: 'ha', target: 'opentherm' },
    { source: 'ha', target: 'zigbee' },
    { source: 'ha', target: 'mqtt' },
    { source: 'ha', target: 'tesla' },
    { source: 'ha', target: 'aquarea' },
    { source: 'ha', target: 'supla' },
    { source: 'ha', target: 'emhass' },
    { source: 'ha', target: 'esphome' },
    { source: 'ha', target: 'cloudflare' },
    { source: 'knx', target: 'deye' },
    { source: 'modbus', target: 'deye' },
    { source: 'opentherm', target: 'termet' },
    { source: 'wmbus', target: 'lora32' },
    { source: 'mqtt', target: 'esp32' },
    { source: 'mqtt', target: 'lora32' },
    { source: 'esphome', target: 'esp32' },
    { source: 'esphome', target: 'lora32' },
    { source: 'esphome', target: 'waveshare' },
    { source: 'supla', target: 'zamel' },
  ]
};

const colorMap = {
  core: '#00d4aa',
  protocol: '#4a9eff',
  device: '#ff6b35',
  cloud: '#9b59b6',
  automation: '#f1c40f'
};

const groupLabels = {
  core: 'CORE',
  protocol: 'PROTOKÓŁ',
  device: 'HARDWARE',
  cloud: 'CHMURA',
  automation: 'AUTOMATYZACJA'
};

function initIntegrationMap() {
  const container = document.getElementById('integration-map');
  const W = container.clientWidth;
  const H = container.clientHeight;

  const svg = d3.select('#integration-map')
    .append('svg')
    .attr('width', W)
    .attr('height', H);

  // Glow filter
  const defs = svg.append('defs');
  const filter = defs.append('filter').attr('id', 'glow');
  filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  const simulation = d3.forceSimulation(integrationData.nodes)
    .force('link', d3.forceLink(integrationData.links).id(d => d.id).distance(90))
    .force('charge', d3.forceManyBody().strength(-350))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(45))
    .force('x', d3.forceX(W / 2).strength(0.05))
    .force('y', d3.forceY(H / 2).strength(0.05));

  const link = svg.append('g')
    .selectAll('line')
    .data(integrationData.links)
    .join('line')
    .attr('stroke', 'rgba(0,212,170,0.15)')
    .attr('stroke-width', 1);

  const node = svg.append('g')
    .selectAll('g')
    .data(integrationData.nodes)
    .join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  node.append('circle')
    .attr('r', d => d.group === 'core' ? 26 : 16)
    .attr('fill', d => colorMap[d.group] + '18')
    .attr('stroke', d => colorMap[d.group])
    .attr('stroke-width', d => d.group === 'core' ? 2.5 : 1.5)
    .attr('filter', d => d.group === 'core' ? 'url(#glow)' : null);

  node.append('text')
    .text(d => d.label)
    .attr('text-anchor', 'middle')
    .attr('dy', d => d.group === 'core' ? 42 : 28)
    .attr('font-family', 'JetBrains Mono, monospace')
    .attr('font-size', d => d.group === 'core' ? '11px' : '9px')
    .attr('fill', d => colorMap[d.group])
    .attr('pointer-events', 'none');

  // Tooltip logic
  const tooltip = document.getElementById('map-tooltip');
  const tooltipTitle = tooltip.querySelector('.map-tooltip__title');
  const tooltipDesc = tooltip.querySelector('.map-tooltip__desc');
  const tooltipGroup = tooltip.querySelector('.map-tooltip__group');
  const tooltipClose = tooltip.querySelector('.map-tooltip__close');

  node.on('click', (event, d) => {
    event.stopPropagation();
    tooltipTitle.textContent = d.label;
    tooltipDesc.textContent = d.desc || '';
    tooltipGroup.textContent = groupLabels[d.group] || d.group;
    tooltipGroup.style.color = colorMap[d.group];

    const rect = container.getBoundingClientRect();
    let left = event.clientX + 12;
    let top = event.clientY - 20;

    // Keep tooltip on screen
    if (left + 320 > window.innerWidth) left = event.clientX - 332;
    if (top + 150 > window.innerHeight) top = event.clientY - 150;
    if (top < 60) top = 60;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.classList.add('visible');
  });

  tooltipClose.addEventListener('click', () => tooltip.classList.remove('visible'));
  document.addEventListener('click', (e) => {
    if (!tooltip.contains(e.target)) tooltip.classList.remove('visible');
  });

  simulation.on('tick', () => {
    // Keep nodes within bounds
    integrationData.nodes.forEach(d => {
      d.x = Math.max(30, Math.min(W - 30, d.x));
      d.y = Math.max(30, Math.min(H - 30, d.y));
    });

    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Pulse animation for core node
  function pulseCore() {
    node.filter(d => d.group === 'core')
      .select('circle')
      .transition().duration(800).attr('r', 30).attr('stroke-width', 3)
      .transition().duration(800).attr('r', 26).attr('stroke-width', 2.5)
      .on('end', pulseCore);
  }
  pulseCore();
}

initIntegrationMap();

// ===== ACTIVE NAV HIGHLIGHT =====
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav__links a');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      allNavLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav__links a[href="#${e.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

sections.forEach(s => navObserver.observe(s));
