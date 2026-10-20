// Renders the workgraph README sample graphs and colour key.
//   src/<name>.json -> ../graph-<name>-dark.png, ../graph-<name>-light.png (2x, rounded card)
//   (built in)      -> ../graph-legend-dark.png, ../graph-legend-light.png
// Nodes are hand-placed on a column/row grid in the JSON. Forward edges run
// from a node's right port to the next node's left port; edges with
// "loop": "above" | "below" are drawn as rounded arcs outside every node they span.
//
// Run from any directory that has the packages installed:
//   npm i playwright-core geist
//   CHROME=/path/to/chrome node <repo>/workgraph/assets/src/render.mjs
// It prints the README <img> widths that keep every image at the same scale.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'index.js'));
const { chromium } = require('playwright-core');

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.dirname(SRC);
const README_WIDTH = 860; // github.com README column is ~860px wide
const FONT = path.join(process.cwd(), 'node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2');

// Status colours from SKILL.md; shown only as the status dot (and a soft glow
// on nodes that need attention). Everything else is neutral.
const status = {
  pending: '#9e9e9e', ready: '#1e88e5', running: '#fb8c00',
  verified: '#43a047', failed: '#e53935', escalated: '#8e24aa',
};
const themes = {
  dark: {
    canvas: '#0f1012', card: 'rgba(255,255,255,0.09)', grid: 'rgba(255,255,255,0.05)',
    node: '#17181b', nodeLine: 'rgba(255,255,255,0.11)', text: '#ececec', muted: 'rgba(236,236,236,0.62)',
    edge: 'rgba(236,236,236,0.40)', loop: 'rgba(236,236,236,0.34)', fail: '#f26b65', shadow: 0,
  },
  light: {
    canvas: '#f7f7f4', card: 'rgba(20,18,11,0.09)', grid: 'rgba(20,18,11,0.06)',
    node: '#ffffff', nodeLine: 'rgba(20,18,11,0.12)', text: '#14120b', muted: 'rgba(20,18,11,0.56)',
    edge: 'rgba(20,18,11,0.42)', loop: 'rgba(20,18,11,0.32)', fail: '#d32f2f', shadow: 0.06,
  },
};

// Runs in the page. Lays out and draws one graph card into <svg id="out">.
function draw({ spec, t, status }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  };
  const FS = 14, H = 34, RX = 9, PADL = 14, DOT = 6, DOTGAP = 10, PADR = 16;
  const ROW = 54, GAP = 38, GAP_LABEL = 66, STUB = 9, LOOP = 22, R = 12, ARW = 6, AW = 3.4, LS = 11;
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6 };
  const measure = (text, size) => {
    const m = el('text', { 'font-size': size });
    m.textContent = text;
    const w = m.getComputedTextLength();
    m.remove();
    return w;
  };

  const defs = el('defs');
  const pat = el('pattern', { id: 'grid', width: 16, height: 16, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 8, cy: 8, r: 0.8, fill: t.grid }, pat);
  const lift = el('filter', { id: 'lift', x: '-20%', y: '-40%', width: '140%', height: '180%' }, defs);
  el('feDropShadow', { dx: 0, dy: 1, stdDeviation: 1.5, 'flood-color': '#000', 'flood-opacity': t.shadow }, lift);
  for (const [k, c] of Object.entries(status)) {
    const f = el('filter', { id: `glow-${k}`, x: '-30%', y: '-80%', width: '160%', height: '260%' }, defs);
    el('feDropShadow', { dx: 0, dy: 0, stdDeviation: 6, 'flood-color': c, 'flood-opacity': 0.32 }, f);
  }
  const card = el('g');
  const g = el('g');
  const edges = el('g', {}, g), labels = el('g', {}, g), nodes = el('g', {}, g);

  // Every node in a column takes the column's width, so stacks line up.
  const N = new Map(spec.nodes.map((n) => [n.id, { ...n }]));
  for (const n of N.values()) {
    n.suffix = n.visits ? ` ×${n.visits}` : '';
    n.w = PADL + DOT + DOTGAP + measure(n.id + n.suffix, FS) + PADR;
  }
  const cols = Math.max(...[...N.values()].map((n) => n.col)) + 1;
  const colW = Array.from({ length: cols }, (_, c) => Math.max(...[...N.values()].filter((n) => n.col === c).map((n) => n.w)));
  const E = spec.edges.map((e) => (Array.isArray(e) ? { from: e[0], to: e[1] } : e));
  const colX = [0];
  for (let c = 1; c < cols; c++) {
    const labelled = E.some((e) => !e.loop && e.label && N.get(e.from).col === c - 1);
    colX[c] = colX[c - 1] + colW[c - 1] + (labelled ? GAP_LABEL : GAP);
  }
  for (const n of N.values()) {
    n.w = colW[n.col];
    n.x = colX[n.col];
    n.cx = n.x + n.w / 2;
    n.cy = n.row * ROW;
    n.y = n.cy - H / 2;
  }

  const label = (x, y, text, color, anchor = 'middle', knock = false) => {
    if (knock) {
      const w = measure(text, LS) + 12;
      el('rect', { x: x - w / 2, y: y - 9, width: w, height: 18, rx: 4, fill: t.canvas }, labels);
    }
    const tx = el('text', { x, y: y + 3.8, 'text-anchor': anchor, 'font-size': LS, 'font-weight': 500, fill: color }, labels);
    tx.textContent = text;
  };
  const arrow = (x, y, dir, color) => {
    // Tip at (x, y), pointing right, down or up.
    const p = { right: [[-ARW, -AW], [-ARW, AW]], down: [[-AW, -ARW], [AW, -ARW]], up: [[-AW, ARW], [AW, ARW]] }[dir];
    el('path', { d: `M${x + p[0][0]},${y + p[0][1]} L${x},${y} L${x + p[1][0]},${y + p[1][1]} Z`, fill: color }, edges);
  };

  // Forward edges: a short stub out of the right port, a curve, a short stub
  // into the left port. Fan-outs and joins share their stub, so one arrowhead per input.
  const inputs = new Map(), outputs = new Set();
  for (const e of E.filter((e) => !e.loop)) {
    const a = N.get(e.from), b = N.get(e.to);
    const x0 = a.x + a.w + STUB, y0 = a.cy, x1 = b.x - ARW - STUB, y1 = b.cy;
    const c = Math.max(12, (x1 - x0) * 0.5);
    el('path', {
      d: `M${x0},${y0} C${x0 + c},${y0} ${x1 - c},${y1} ${x1},${y1}`, fill: 'none',
      ...(e.label ? { stroke: t.fail, ...DOTTED } : { stroke: t.edge, 'stroke-width': 1.25 }),
    }, edges);
    if (e.label) {
      // Beside the curve's midpoint, on its outer side.
      const up = y1 < y0;
      label((x0 + x1) / 2 + (up ? -6 : 6), (y0 + y1) / 2 + (up ? -8 : 8), e.label, t.fail, up ? 'end' : 'start');
    }
    inputs.set(e.to, [...(inputs.get(e.to) || []), e]);
    outputs.add(e.from);
  }
  for (const id of outputs) {
    const a = N.get(id);
    el('path', { d: `M${a.x + a.w},${a.cy} H${a.x + a.w + STUB}`, stroke: t.edge, 'stroke-width': 1.25 }, edges);
  }
  for (const [id, es] of inputs) {
    const b = N.get(id), color = es.every((e) => e.label) ? t.fail : t.edge;
    el('path', { d: `M${b.x - ARW - STUB},${b.cy} H${b.x - ARW}`, stroke: color, 'stroke-width': 1.25 }, edges);
    arrow(b.x, b.cy, 'right', color);
  }

  // Loop edges: rounded arcs above or below everything they span.
  for (const e of E.filter((e) => e.loop)) {
    const a = N.get(e.from), b = N.get(e.to);
    const up = e.loop === 'above', s = up ? -1 : 1;
    const tx = a.cx, hx = b.cx, d = hx < tx ? -1 : 1;
    const lo = Math.min(tx, hx), hi = Math.max(tx, hx);
    const span = [...N.values()].filter((n) => n.x < hi && n.x + n.w > lo);
    const cy = up ? Math.min(...span.map((n) => n.y)) - LOOP : Math.max(...span.map((n) => n.y + H)) + LOOP;
    const ty = up ? a.y : a.y + H, hy = up ? b.y : b.y + H;
    const color = e.label ? t.fail : t.loop;
    el('path', {
      d: `M${tx},${ty} V${cy - s * R} Q${tx},${cy} ${tx + d * R},${cy} H${hx - d * R} Q${hx},${cy} ${hx},${cy - s * R} V${hy + s * ARW}`,
      fill: 'none', stroke: color, ...DOTTED,
    }, edges);
    arrow(hx, hy, up ? 'down' : 'up', color);
    if (e.label) label((tx + hx) / 2, cy, e.label, t.fail, 'middle', true);
  }

  // Nodes: neutral pill, hairline border, status dot; attention states glow softly.
  for (const n of N.values()) {
    const c = status[n.state];
    const loud = ['running', 'failed', 'escalated'].includes(n.state);
    el('rect', {
      x: n.x, y: n.y, width: n.w, height: H, rx: RX, fill: t.node,
      stroke: loud ? c : t.nodeLine, 'stroke-opacity': loud ? 0.7 : 1, 'stroke-width': 1,
      filter: `url(#${loud ? `glow-${n.state}` : 'lift'})`,
    }, nodes);
    const dx = n.x + PADL + DOT / 2;
    if (n.state === 'running') el('circle', { cx: dx, cy: n.cy, r: 6.5, fill: c, 'fill-opacity': 0.22 }, nodes);
    if (n.state === 'pending') el('circle', { cx: dx, cy: n.cy, r: 2.7, fill: 'none', stroke: c, 'stroke-width': 1.3 }, nodes);
    else el('circle', { cx: dx, cy: n.cy, r: 3.1, fill: c }, nodes);
    const text = el('text', { x: n.x + PADL + DOT + DOTGAP, y: n.cy + 4.8, 'font-size': FS, 'font-weight': 420, fill: n.state === 'pending' ? t.muted : t.text }, nodes);
    text.textContent = n.id;
    if (n.suffix) {
      const v = el('tspan', { fill: t.muted }, text);
      v.textContent = n.suffix;
    }
  }

  // Card around the content, with an eyebrow title and a faint dot grid.
  const b = g.getBBox();
  const PX = 32, TOP = 58, BOTTOM = 30;
  const W = Math.ceil(b.width + 2 * PX), Ht = Math.ceil(b.height + TOP + BOTTOM);
  g.setAttribute('transform', `translate(${PX - b.x},${TOP - b.y})`);
  el('rect', { x: 0.5, y: 0.5, width: W - 1, height: Ht - 1, rx: 14, fill: t.canvas, stroke: t.card }, card);
  el('rect', { x: 1, y: 1, width: W - 2, height: Ht - 2, rx: 14, fill: 'url(#grid)' }, card);
  el('circle', { cx: 25, cy: 25, r: 3, fill: t.muted }, card);
  const title = el('text', { x: 36, y: 29, 'font-size': 11.5, 'letter-spacing': 0.6, 'font-weight': 500, fill: t.muted }, card);
  title.textContent = spec.title.toUpperCase();
  svg.setAttribute('width', W);
  svg.setAttribute('height', Ht);
  svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
}

// Runs in the page. Draws the one-line colour key.
function legend({ t, status }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.append(e);
    return e;
  };
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6 };
  const card = el('rect', { x: 0.5, y: 0.5, rx: 12, fill: t.canvas, stroke: t.card });
  let x = 22;
  const cy = 24;
  const text = (s, color, gap = 24) => {
    const tx = el('text', { x, y: cy + 4.2, 'font-size': 12, 'font-weight': 420, fill: color });
    tx.textContent = s;
    x += tx.getComputedTextLength() + gap;
  };
  for (const [k, c] of Object.entries(status)) {
    if (k === 'running') el('circle', { cx: x + 3, cy, r: 6.5, fill: c, 'fill-opacity': 0.22 });
    if (k === 'pending') el('circle', { cx: x + 3, cy, r: 2.7, fill: 'none', stroke: c, 'stroke-width': 1.3 });
    else el('circle', { cx: x + 3, cy, r: 3.1, fill: c });
    x += 14;
    text(k.toUpperCase(), t.text);
  }
  el('rect', { x: x - 10, y: cy - 9, width: 1, height: 18, fill: t.nodeLine });
  x += 12;
  el('path', { d: `M${x},${cy} H${x + 22}`, stroke: t.fail, ...DOTTED });
  x += 30;
  text('fail', t.muted);
  el('path', { d: `M${x},${cy} H${x + 22}`, stroke: t.loop, ...DOTTED });
  x += 30;
  text('loop back', t.muted);
  text('×2', t.text, 6);
  text('visits', t.muted);
  const W = Math.ceil(x), Ht = 48;
  card.setAttribute('width', W - 1);
  card.setAttribute('height', Ht - 1);
  svg.setAttribute('width', W);
  svg.setAttribute('height', Ht);
  svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
}

const font = fs.readFileSync(FONT).toString('base64');
const html = `<style>
  @font-face { font-family: 'Geist Mono'; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
  body { margin: 0; background: transparent; }
  svg { display: block; font-family: 'Geist Mono', monospace; }
</style><svg id="out" xmlns="http://www.w3.org/2000/svg"></svg>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
const widths = {};
async function render(name, fn, arg) {
  for (const [theme, t] of Object.entries(themes)) {
    await page.setContent(html);
    await page.evaluate(() => document.fonts.load("500 12px 'Geist Mono'"));
    await page.evaluate(fn, { ...arg, t, status });
    const svg = await page.$('svg');
    widths[name] = (await svg.boundingBox()).width;
    await svg.screenshot({ path: path.join(OUT, `graph-${name}-${theme}.png`), omitBackground: true });
  }
}
for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort()) {
  const spec = JSON.parse(fs.readFileSync(path.join(SRC, file), 'utf8'));
  await render(path.basename(file, '.json'), draw, { spec });
}
await render('legend', legend, {});
await browser.close();

const scale = README_WIDTH / Math.max(...Object.values(widths));
for (const [name, w] of Object.entries(widths)) console.log(`graph-${name}: width="${Math.round(w * scale)}"`);
