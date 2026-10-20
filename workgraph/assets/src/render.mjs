// Renders the workgraph README sample graphs and colour key.
//   src/<name>.dot -> ../graph-<name>-light.png, ../graph-<name>-dark.png (transparent, 2x)
// Graphviz (WASM) lays out nodes and forward edges; back edges (class "back top"
// or "back bottom") are left out of the layout and drawn as brackets above or
// below every node they span, so loops never cross the forward flow.
//
// Run from any directory that has the two packages installed:
//   npm i @viz-js/viz playwright-core
//   CHROME=/path/to/chrome node <repo>/workgraph/assets/src/render.mjs
// It prints the README <img> widths that keep every image at the same scale.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'index.js'));
const { instance } = require('@viz-js/viz');
const { chromium } = require('playwright-core');

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.dirname(SRC);
const CHROME = process.env.CHROME;
const README_WIDTH = 860; // github.com README column is ~860px wide

// Status palette from SKILL.md (classDef fills).
const palette = {
  pending: '#9e9e9e', ready: '#1e88e5', running: '#fb8c00',
  verified: '#43a047', failed: '#e53935', escalated: '#8e24aa',
};
// Edge and label ink per GitHub theme (fgColor.muted / a softened fgColor.default).
const themes = { light: { ink: '#59636e', text: '#424a53' }, dark: { ink: '#9198a1', text: '#d1d7e0' } };
// Light fills take dark node text; the rest keep SKILL.md's white.
const darkText = ['pending', 'running'];
const FONT = "'Noto Sans', 'Liberation Sans', sans-serif";

const graphAttributes = { rankdir: 'LR', nodesep: 0.22, ranksep: 0.4, pad: 0, splines: 'spline' };
const nodeAttributes = {
  shape: 'box', style: 'rounded,filled', fixedsize: true, width: 1.45, height: 0.4,
  fontname: 'Helvetica', fontsize: 13, penwidth: 0,
};
const edgeAttributes = { tailport: 'e', arrowsize: 0.6, penwidth: 1.3, fontname: 'Helvetica', fontsize: 10 };

const css = ({ ink, text }) => `
  body { margin: 0; background: transparent; }
  svg { display: block; }
  svg text { font-family: ${FONT}; }
  .node text { fill: #fff; font-weight: 500; }
  ${darkText.map((k) => `.node.${k} text`).join(', ')} { fill: #1f2328; }
  ${Object.entries(palette).map(([k, v]) => `.node.${k} path { fill: ${v}; stroke: ${v}; }`).join('\n  ')}
  .edge path { stroke: ${ink}; fill: none; }
  .edge polygon { fill: ${ink}; stroke: ${ink}; }
  .edge.back path { stroke-dasharray: 4 3; }
  .edge text { fill: ${text}; font-weight: 600; font-size: 10px; letter-spacing: 0.05em; }
`;

// Back edges are pulled out of the layout so they cannot bend it, then drawn by finish().
const BACK = /^\s*(\w+)\s*->\s*(\w+)\s*\[([^\]]*class="back (top|bottom)"[^\]]*)\]\s*$/gm;
function splitBack(dot) {
  const back = [...dot.matchAll(BACK)].map(([, tail, head, attrs, side]) => ({
    tail, head, side, label: attrs.match(/label="?([^",\]]+)/)?.[1],
  }));
  dot = dot.replace(BACK, '');
  // Edges leave from the right side; a node with one input takes it on its left
  // side, a join keeps Graphviz's spread so its arrowheads never stack.
  const EDGE = /^(\s*)(\w+)\s*->\s*(\w+)\s*(?:\[([^\]]*)\])?\s*$/gm;
  const fanIn = {};
  for (const [, , , head] of dot.matchAll(EDGE)) fanIn[head] = (fanIn[head] || 0) + 1;
  dot = dot.replace(EDGE, (_, ind, tail, head, attrs) =>
    `${ind}${tail} -> ${head} [${[attrs, fanIn[head] === 1 && 'headport=w'].filter(Boolean).join(', ')}]`);
  return { dot, back };
}

// Runs in the page: draw back edges, place labels, then crop the viewBox to the content.
function finish(back) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.querySelector('svg');
  const g = svg.querySelector('g.graph');
  g.querySelector(':scope > polygon')?.remove();
  const nodes = new Map([...g.querySelectorAll('g.node')].map((n) => [n.querySelector('title').textContent, n.getBBox()]));
  const fwd = [...g.querySelectorAll('g.edge')].map((e) => e.getBBox());
  const GAP = 11, R = 6, AL = 6, AW = 2.2;
  // Forward-edge labels: move beside the curve's midpoint, on its upper side.
  for (const e of g.querySelectorAll('g.edge')) {
    const t = e.querySelector('text');
    if (!t) continue;
    const p = e.querySelector('path'), L = p.getTotalLength();
    const m = p.getPointAtLength(L / 2), a = p.getPointAtLength(L / 2 - 1), b = p.getPointAtLength(L / 2 + 1);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    const nx = dy / len, ny = -dx / len;
    t.setAttribute('x', m.x + nx * 5);
    t.setAttribute('y', m.y + ny * 5);
    t.setAttribute('text-anchor', nx < -0.3 ? 'end' : nx > 0.3 ? 'start' : 'middle');
  }
  for (const { tail, head, side, label } of back) {
    const T = nodes.get(tail), H = nodes.get(head);
    const top = side === 'top';
    // Land right of centre, clear of joins that arrive from the left.
    const tx = T.x + T.width / 2, hx = H.x + H.width * 0.65;
    const lo = Math.min(tx, hx), hi = Math.max(tx, hx);
    const span = [...nodes.values(), ...fwd].filter((b) => b.x < hi && b.x + b.width > lo);
    const cy = top ? Math.min(...span.map((b) => b.y)) - GAP : Math.max(...span.map((b) => b.y + b.height)) + GAP;
    const ty = top ? T.y : T.y + T.height, hy = top ? H.y : H.y + H.height;
    const s = top ? 1 : -1, d = hx < tx ? -1 : 1;
    const e = document.createElementNS(NS, 'g');
    e.setAttribute('class', 'edge back');
    g.append(e);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `M${tx},${ty} V${cy + s * R} Q${tx},${cy} ${tx + d * R},${cy} H${hx - d * R} Q${hx},${cy} ${hx},${cy + s * R} V${hy - s * AL}`);
    const a = document.createElementNS(NS, 'polygon');
    a.setAttribute('points', `${hx - AW},${hy - s * AL} ${hx + AW},${hy - s * AL} ${hx},${hy}`);
    e.append(p, a);
    if (label) {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', (tx + hx) / 2);
      t.setAttribute('y', top ? cy - 4 : cy + 11);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = label;
      e.append(t);
    }
  }
  const PAD = 14;
  const b = g.getBBox();
  g.removeAttribute('transform');
  svg.setAttribute('viewBox', `${b.x - PAD} ${b.y - PAD} ${b.width + 2 * PAD} ${b.height + 2 * PAD}`);
  svg.setAttribute('width', `${b.width + 2 * PAD}pt`);
  svg.setAttribute('height', `${b.height + 2 * PAD}pt`);
}

const viz = await instance();
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ deviceScaleFactor: 2 });
const widths = {};
async function shoot(name, theme) {
  const el = await page.$('svg');
  widths[name] = (await el.boundingBox()).width;
  await el.screenshot({ path: path.join(OUT, `graph-${name}-${theme}.png`), omitBackground: true });
}

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith('.dot')).sort()) {
  const name = path.basename(file, '.dot');
  const { dot, back } = splitBack(fs.readFileSync(path.join(SRC, file), 'utf8'));
  const svg = viz.renderString(dot, {
    format: 'svg', graphAttributes, nodeAttributes, edgeAttributes,
  });
  for (const [theme, colors] of Object.entries(themes)) {
    await page.setContent(`<style>${css(colors)}</style>${svg}`);
    await page.evaluate(finish, back);
    await shoot(name, theme);
  }
}
// One-line colour key, same chip style as the nodes.
const chips = Object.entries(palette).map(([k, v], i) =>
  `<g class="node ${k}"><rect x="${i * 92}" y="0" width="86" height="24" rx="9" fill="${v}"/>` +
  `<text x="${i * 92 + 43}" y="16.5" text-anchor="middle" font-size="11.5">${k.toUpperCase()}</text></g>`).join('');
const x0 = 6 * 92 + 10, W = x0 + 222, P = 12;
const legend = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * P}pt" height="${24 + 2 * P}pt" viewBox="${-P} ${-P} ${W + 2 * P} ${24 + 2 * P}">${chips}
  <g class="edge back"><path d="M${x0},12 H${x0 + 24}"/><polygon points="${x0 + 24},9.8 ${x0 + 30},12 ${x0 + 24},14.2"/>
  <text x="${x0 + 36}" y="16.5" style="font-size: 11.5px; letter-spacing: 0">loop back</text>
  <text x="${x0 + 122}" y="16.5" style="font-size: 11.5px; letter-spacing: 0">×N visit count</text></g></svg>`;
for (const [theme, colors] of Object.entries(themes)) {
  await page.setContent(`<style>${css(colors)}</style>${legend}`);
  await shoot('legend', theme);
}
await browser.close();

const scale = README_WIDTH / Math.max(...Object.values(widths));
for (const [name, w] of Object.entries(widths)) console.log(`graph-${name}: width="${Math.round(w * scale)}"`);
