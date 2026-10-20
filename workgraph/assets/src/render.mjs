// Renders the workgraph README sample graphs and colour key.
//   src/<name>.json -> ../graph-<name>-light.png, ../graph-<name>-dark.png (2x, transparent)
//   (built in)      -> ../graph-legend-light.png, ../graph-legend-dark.png
// Nodes are hand-placed on a column/row grid in the JSON. Forward edges are
// orthogonal: they turn on a bus in the middle of each column gap. Edges with
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
const FONTS = path.join(process.cwd(), 'node_modules/geist/dist/fonts');

// Status colours from SKILL.md, used only for the small status marker.
const status = {
  pending: '#9e9e9e', ready: '#1e88e5', running: '#fb8c00',
  verified: '#43a047', failed: '#e53935', escalated: '#8e24aa',
};
// Neutral ink per GitHub theme; `page` is GitHub's background, used behind
// inline labels. Edge colours are opaque so shared segments never darken.
const themes = {
  light: {
    page: '#ffffff', node: '#ffffff', nodeLine: '#d1d9e0', text: '#1f2328', muted: '#59636e',
    edge: '#8c959f', loop: '#afb8c1', fail: '#cf222e', shadow: 0.05,
  },
  dark: {
    page: '#0d1117', node: '#151b23', nodeLine: '#3d444d', text: '#f0f6fc', muted: '#b1b8c0',
    edge: '#656c76', loop: '#545b64', fail: '#f85149', shadow: 0,
  },
};

// Injected into the page: the status marker, centred on (x, y).
function marker(el, parent, state, c, x, y) {
  if (state === 'pending') return el('circle', { cx: x, cy: y, r: 2.8, fill: 'none', stroke: c, 'stroke-width': 1.3 }, parent);
  if (state === 'running') el('circle', { cx: x, cy: y, r: 5.6, fill: 'none', stroke: c, 'stroke-opacity': 0.35, 'stroke-width': 1.2 }, parent);
  return el('circle', { cx: x, cy: y, r: 3.2, fill: c }, parent);
}

// Runs in the page. Lays out and draws one graph into <svg id="out">.
function draw({ spec, t, status }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  };
  const SANS = "'Geist', sans-serif", MONO = "'Geist Mono', monospace";
  const FS = 13.5, VS = 11.5, H = 32, RX = 8, PAD = 12, DOT = 6, DOTGAP = 9;
  const ROW = 50, GAP = 34, BUS = 6, LOOP = 22, R = 10, ARW = 6, AW = 3.4, LS = 11.5;
  const LINE = { 'stroke-width': 1.25, fill: 'none', 'stroke-linejoin': 'round' };
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6, fill: 'none' };
  const measure = (text, size, family) => {
    const m = el('text', { 'font-size': size, 'font-family': family, 'font-weight': 450 });
    m.textContent = text;
    const w = m.getComputedTextLength();
    m.remove();
    return w;
  };

  const defs = el('defs');
  const lift = el('filter', { id: 'lift', x: '-20%', y: '-40%', width: '140%', height: '180%' }, defs);
  el('feDropShadow', { dx: 0, dy: 1, stdDeviation: 1, 'flood-color': '#000', 'flood-opacity': t.shadow }, lift);
  const g = el('g');
  const edges = el('g', {}, g), labels = el('g', {}, g), nodes = el('g', {}, g);

  // Every node in a column takes the column's width, so stacks line up.
  const N = new Map(spec.nodes.map((n) => [n.id, { ...n }]));
  for (const n of N.values()) {
    n.suffix = n.visits ? `×${n.visits}` : '';
    n.tw = measure(n.id, FS, SANS) + (n.suffix ? 7 + measure(n.suffix, VS, MONO) : 0);
    n.w = 2 * PAD + DOT + DOTGAP + n.tw;
  }
  const cols = Math.max(...[...N.values()].map((n) => n.col)) + 1;
  const colW = Array.from({ length: cols }, (_, c) => Math.max(...[...N.values()].filter((n) => n.col === c).map((n) => n.w)));
  const colX = [0];
  for (let c = 1; c < cols; c++) colX[c] = colX[c - 1] + colW[c - 1] + GAP;
  for (const n of N.values()) {
    n.w = colW[n.col];
    n.x = colX[n.col];
    n.cx = n.x + n.w / 2;
    n.cy = n.row * ROW;
    n.y = n.cy - H / 2;
  }
  const E = spec.edges.map((e) => (Array.isArray(e) ? { from: e[0], to: e[1] } : e));
  const fwd = E.filter((e) => !e.loop);
  const outs = (id) => fwd.filter((e) => e.from === id && !e.label).length;
  const ins = (id) => fwd.filter((e) => e.to === id).length;

  const arrow = (x, y, dir, color) => {
    // Tip at (x, y), pointing right, down or up.
    const p = { right: [[-ARW, -AW], [-ARW, AW]], down: [[-AW, -ARW], [AW, -ARW]], up: [[-AW, ARW], [AW, ARW]] }[dir];
    el('path', { d: `M${x + p[0][0]},${y + p[0][1]} L${x},${y} L${x + p[1][0]},${y + p[1][1]} Z`, fill: color }, edges);
  };
  const text = (x, y, s, color, anchor) => {
    const tx = el('text', { x, y: y + 3.6, 'text-anchor': anchor, 'font-size': LS, 'font-family': MONO, 'font-weight': 500, 'letter-spacing': 0.3, fill: color }, labels);
    tx.textContent = s;
  };

  // Forward edges. Plain edges turn on a bus in the middle of the column gap
  // (fan-outs just left of it, joins just right), so branches share one trunk.
  // Labelled edges rise from the top or bottom of their node, label beside the riser.
  for (const e of fwd) {
    const a = N.get(e.from), b = N.get(e.to);
    const ya = a.cy, yb = b.cy, xe = b.x - ARW, s = Math.sign(yb - ya);
    if (e.label) {
      const vx = a.x + a.w - 18, r = Math.min(R, Math.abs(yb - ya) / 2);
      const y0 = s < 0 ? a.y : a.y + H;
      el('path', { d: `M${vx},${y0} V${yb - s * r} Q${vx},${yb} ${vx + r},${yb} H${xe}`, stroke: t.fail, ...DOTTED }, edges);
      text(vx - 7, (y0 + yb) / 2, e.label, t.fail, 'end');
      continue;
    }
    if (!s) {
      el('path', { d: `M${a.x + a.w},${ya} H${xe}`, stroke: t.edge, ...LINE }, edges);
      continue;
    }
    const bus = a.x + a.w + GAP / 2;
    const vx = outs(e.from) > 1 && ins(e.to) <= 1 ? bus - BUS : ins(e.to) > 1 && outs(e.from) <= 1 ? bus + BUS : bus;
    const r = Math.min(R / 1.6, Math.abs(yb - ya) / 2);
    el('path', {
      d: `M${a.x + a.w},${ya} H${vx - r} Q${vx},${ya} ${vx},${ya + s * r} V${yb - s * r} Q${vx},${yb} ${vx + r},${yb} H${xe}`,
      stroke: t.edge, ...LINE,
    }, edges);
  }
  for (const n of N.values()) {
    const es = fwd.filter((e) => e.to === n.id);
    if (es.length) arrow(n.x, n.cy, 'right', es.every((e) => e.label) ? t.fail : t.edge);
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
      stroke: color, ...DOTTED,
    }, edges);
    arrow(hx, hy, up ? 'down' : 'up', color);
    if (e.label) {
      const w = measure(e.label, LS, MONO) + 12, mx = (tx + hx) / 2;
      el('rect', { x: mx - w / 2, y: cy - 9, width: w, height: 18, fill: t.page }, labels);
      text(mx, cy, e.label, t.fail, 'middle');
    }
  }

  // Nodes: one neutral pill for every state; the state is the small marker.
  for (const n of N.values()) {
    el('rect', {
      x: n.x + 0.5, y: n.y + 0.5, width: n.w - 1, height: H - 1, rx: RX,
      fill: t.node, stroke: t.nodeLine, 'stroke-width': 1, filter: 'url(#lift)',
    }, nodes);
    const x0 = n.x + PAD;
    marker(el, nodes, n.state, status[n.state], x0 + DOT / 2, n.cy);
    const label = el('text', {
      x: x0 + DOT + DOTGAP, y: n.cy + 4.6, 'font-size': FS, 'font-family': SANS, 'font-weight': 450,
      fill: n.state === 'pending' ? t.muted : t.text,
    }, nodes);
    label.textContent = n.id;
    if (n.suffix) {
      const v = el('tspan', { dx: 7, 'font-size': VS, 'font-family': MONO, fill: t.muted }, label);
      v.textContent = n.suffix;
    }
  }

  // Transparent margin: tight at the sides, room above and below for the prose.
  const PX = 8, PY = 22, b = g.getBBox();
  const W = Math.ceil(b.width + 2 * PX), Ht = Math.ceil(b.height + 2 * PY);
  g.setAttribute('transform', `translate(${PX - b.x},${PY - b.y})`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', Ht);
  svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
}

// Runs in the page. Draws the one-line colour key: node states, then edge types.
function legend({ t, status }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  };
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6 };
  let x = 8;
  const cy = 14;
  const text = (s, color, gap = 20) => {
    const tx = el('text', { x, y: cy + 4.3, 'font-size': 12.5, 'font-family': "'Geist', sans-serif", 'font-weight': 450, fill: color });
    tx.textContent = s;
    x += tx.getComputedTextLength() + gap;
  };
  for (const [k, c] of Object.entries(status)) {
    marker(el, svg, k, c, x + 3, cy);
    x += 13;
    text(k.toUpperCase(), t.muted);
  }
  x += 6;
  el('rect', { x, y: cy - 8, width: 1, height: 16, fill: t.nodeLine });
  x += 22;
  el('path', { d: `M${x},${cy} H${x + 20}`, stroke: t.fail, ...DOTTED });
  x += 28;
  text('FAIL edge', t.muted);
  el('path', { d: `M${x},${cy} H${x + 20}`, stroke: t.loop, ...DOTTED });
  x += 28;
  text('loop back', t.muted);
  text('×N', t.text, 7);
  text('visits', t.muted, 8);
  const W = Math.ceil(x), Ht = 28;
  svg.setAttribute('width', W);
  svg.setAttribute('height', Ht);
  svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
}

const font = (f) => fs.readFileSync(path.join(FONTS, f)).toString('base64');
const html = `<style>
  @font-face { font-family: 'Geist'; src: url(data:font/woff2;base64,${font('geist-sans/Geist-Variable.woff2')}) format('woff2'); font-weight: 100 900; }
  @font-face { font-family: 'Geist Mono'; src: url(data:font/woff2;base64,${font('geist-mono/GeistMono-Variable.woff2')}) format('woff2'); font-weight: 100 900; }
  body { margin: 0; background: transparent; }
  svg { display: block; }
</style><svg id="out" xmlns="http://www.w3.org/2000/svg"></svg>`;

const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
const widths = {};
async function render(name, fn, arg) {
  for (const [theme, t] of Object.entries(themes)) {
    await page.setContent(html);
    await page.addScriptTag({ content: marker.toString() });
    await page.evaluate(() => Promise.all([document.fonts.load("450 13px 'Geist'"), document.fonts.load("500 11px 'Geist Mono'")]));
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
