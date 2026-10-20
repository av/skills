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

// Neutral surfaces matched to GitHub's light and dark themes. Status follows
// SKILL.md's muted palette: two accents (red FAILED, amber ESCALATED); the
// other states differ by marker and line weight only. Edge colours are opaque
// so shared segments never darken where they overlap.
const themes = {
  dark: {
    canvas: '#10151c', card: '#2a323c', grid: '#1b2129', node: '#161c24', nodeLine: '#2b333d', done: '#222a33',
    text: '#e6edf3', muted: '#9aa3ad', edge: '#5f6873', loop: '#5a636e', fail: '#f85149', attn: '#d29922', shadow: 0,
  },
  light: {
    canvas: '#f6f8fa', card: '#dfe4e9', grid: '#e1e6eb', node: '#ffffff', nodeLine: '#d6dce2', done: '#e8ecf0',
    text: '#1f2328', muted: '#656d76', edge: '#9aa3ad', loop: '#a8b1bb', fail: '#cf222e', attn: '#9a6700', shadow: 0.05,
  },
};
const STATES = ['pending', 'ready', 'running', 'verified', 'failed', 'escalated'];
// Per state: node fill, border, border width, dash, label colour, marker.
const look = (t) => ({
  pending: { fill: t.node, stroke: t.muted, width: 1, dash: '3 3', text: t.muted, marker: ['ring', t.muted] },
  ready: { fill: t.node, stroke: t.muted, width: 1, text: t.text, marker: ['ring', t.text] },
  running: { fill: t.node, stroke: t.text, width: 1.5, text: t.text, marker: ['live', t.text] },
  verified: { fill: t.done, stroke: t.done, width: 1, text: t.text, marker: ['check', t.muted] },
  failed: { fill: t.node, stroke: t.fail, width: 1.5, text: t.text, marker: ['dot', t.fail] },
  escalated: { fill: t.node, stroke: t.attn, width: 1.5, text: t.text, marker: ['bang', t.attn] },
});

// Injected into the page: draws a 6px status marker centred on (x, y).
function marker(el, parent, [kind, c], x, y) {
  if (kind === 'ring') return el('circle', { cx: x, cy: y, r: 2.8, fill: 'none', stroke: c, 'stroke-width': 1.3 }, parent);
  if (kind === 'dot') return el('circle', { cx: x, cy: y, r: 3.2, fill: c }, parent);
  if (kind === 'live') {
    el('circle', { cx: x, cy: y, r: 5.6, fill: 'none', stroke: c, 'stroke-opacity': 0.4, 'stroke-width': 1.2 }, parent);
    return el('circle', { cx: x, cy: y, r: 2.6, fill: c }, parent);
  }
  if (kind === 'check') return el('path', { d: `M${x - 3.4},${y + 0.2} L${x - 1},${y + 2.6} L${x + 3.6},${y - 2.6}`, fill: 'none', stroke: c, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  // bang: small filled triangle with a notch, for "needs a human"
  el('path', { d: `M${x},${y - 4} L${x + 4.2},${y + 3.4} L${x - 4.2},${y + 3.4} Z`, fill: c, 'stroke-linejoin': 'round' }, parent);
  return el('rect', { x: x - 0.6, y: y - 1.4, width: 1.2, height: 2.6, rx: 0.6, fill: '#fff', 'fill-opacity': 0.9 }, parent);
}

// Runs in the page. Lays out and draws one graph card into <svg id="out">.
function draw({ spec, t, look }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  };
  const FS = 14, H = 34, RX = 9, PAD = 13, DOT = 6, DOTGAP = 9;
  const ROW = 52, GAP = 30, BUS = 6, LOOP = 22, R = 10, ARW = 6, AW = 3.4, LS = 11;
  const LINE = { 'stroke-width': 1.25, fill: 'none', 'stroke-linejoin': 'round' };
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6, fill: 'none' };
  const measure = (text, size) => {
    const m = el('text', { 'font-size': size });
    m.textContent = text;
    const w = m.getComputedTextLength();
    m.remove();
    return w;
  };

  const defs = el('defs');
  const pat = el('pattern', { id: 'grid', width: 16, height: 16, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 8, cy: 8, r: 0.9, fill: t.grid }, pat);
  const lift = el('filter', { id: 'lift', x: '-20%', y: '-40%', width: '140%', height: '180%' }, defs);
  el('feDropShadow', { dx: 0, dy: 1, stdDeviation: 1.2, 'flood-color': '#000', 'flood-opacity': t.shadow }, lift);
  const card = el('g');
  const g = el('g');
  const edges = el('g', {}, g), labels = el('g', {}, g), nodes = el('g', {}, g);

  // Every node in a column takes the column's width, so stacks line up.
  const N = new Map(spec.nodes.map((n) => [n.id, { ...n }]));
  for (const n of N.values()) {
    n.suffix = n.visits ? ` ×${n.visits}` : '';
    n.tw = measure(n.id + n.suffix, FS);
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
    const tx = el('text', { x, y: y + 3.8, 'text-anchor': anchor, 'font-size': LS, 'font-weight': 500, fill: color }, labels);
    tx.textContent = s;
    return tx;
  };

  // Forward edges, orthogonal with rounded corners. Plain edges turn on a bus
  // in the middle of the column gap (fan-outs just left of it, joins just right),
  // so branches share one clean trunk. Labelled edges leave from the top or
  // bottom of their node and turn into the target, label beside the riser.
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
      const w = measure(e.label, LS) + 12, mx = (tx + hx) / 2;
      el('rect', { x: mx - w / 2, y: cy - 9, width: w, height: 18, fill: t.canvas }, labels);
      text(mx, cy, e.label, t.fail, 'middle');
    }
  }

  // Nodes: neutral pill; state shows as marker, border weight and fill only.
  // Content is left-aligned so stacked markers line up.
  for (const n of N.values()) {
    const st = look[n.state];
    const inset = st.width / 2;
    el('rect', {
      x: n.x + inset, y: n.y + inset, width: n.w - 2 * inset, height: H - 2 * inset, rx: RX, fill: st.fill,
      stroke: st.stroke, 'stroke-width': st.width, ...(st.dash ? { 'stroke-dasharray': st.dash } : {}),
      filter: n.state === 'verified' ? 'none' : 'url(#lift)',
    }, nodes);
    const x0 = n.x + PAD;
    marker(el, nodes, st.marker, x0 + DOT / 2, n.cy);
    const label = el('text', { x: x0 + DOT + DOTGAP, y: n.cy + 4.8, 'font-size': FS, 'font-weight': n.state === 'running' ? 500 : 400, fill: st.text }, nodes);
    label.textContent = n.id;
    if (n.suffix) {
      const v = el('tspan', { fill: t.muted }, label);
      v.textContent = n.suffix;
    }
  }

  // Card around the content, with an eyebrow title and a faint dot grid.
  const b = g.getBBox();
  const PX = 22, TOP = 58, BOTTOM = 24;
  const W = Math.ceil(b.width + 2 * PX), Ht = Math.ceil(b.height + TOP + BOTTOM);
  g.setAttribute('transform', `translate(${PX - b.x},${TOP - b.y})`);
  el('rect', { x: 0.5, y: 0.5, width: W - 1, height: Ht - 1, rx: 14, fill: t.canvas, stroke: t.card }, card);
  el('rect', { x: 1, y: 1, width: W - 2, height: Ht - 2, rx: 14, fill: 'url(#grid)' }, card);
  el('circle', { cx: 25, cy: 26, r: 3, fill: t.muted }, card);
  const title = el('text', { x: 36, y: 30, 'font-size': 12, 'letter-spacing': 0.6, 'font-weight': 500, fill: t.muted }, card);
  title.textContent = spec.title.toUpperCase();
  svg.setAttribute('width', W);
  svg.setAttribute('height', Ht);
  svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
}

// Runs in the page. Draws the one-line colour key, in the nodes' marker style.
function legend({ t, look, states }) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.getElementById('out');
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  };
  const DOTTED = { 'stroke-dasharray': '0.1 4', 'stroke-linecap': 'round', 'stroke-width': 1.6 };
  const card = el('rect', { x: 0.5, y: 0.5, rx: 12, fill: t.canvas, stroke: t.card });
  let x = 22;
  const cy = 24;
  const text = (s) => {
    const tx = el('text', { x, y: cy + 4, 'font-size': 11.5, 'letter-spacing': 0.5, 'font-weight': 500, fill: t.muted });
    tx.textContent = s;
    x += tx.getComputedTextLength() + 22;
  };
  for (const k of states) {
    marker(el, svg, look[k].marker, x + 3, cy);
    x += 14;
    text(k.toUpperCase());
  }
  x += 4;
  el('path', { d: `M${x},${cy} H${x + 20}`, stroke: t.fail, ...DOTTED });
  x += 28;
  text('FAIL');
  el('path', { d: `M${x},${cy} H${x + 20}`, stroke: t.loop, ...DOTTED });
  x += 28;
  text('LOOP BACK');
  text('×N VISITS');
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
    await page.addScriptTag({ content: marker.toString() });
    await page.evaluate(() => document.fonts.load("500 12px 'Geist Mono'"));
    await page.evaluate(fn, { ...arg, t, look: look(t), states: STATES });
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
