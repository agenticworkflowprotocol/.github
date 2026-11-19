#!/usr/bin/env node
// Generates the light and dark variants of the overview diagram of the organisation profile.
//   node profile/assets/build-diagrams.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const THEMES = {
  light: { bg: '#ffffff', fg: '#17202a', muted: '#4d5966', line: '#c9d1d9', box: '#f5f7f9', accent: '#0b5cad', accentBg: '#e8f1fb', ok: '#146c2e', okBg: '#e7f4ea', warn: '#7a4d00', warnBg: '#fdf3dc' },
  dark: { bg: '#0d1117', fg: '#e6edf3', muted: '#9da7b3', line: '#30363d', box: '#161b22', accent: '#7db7f0', accentBg: '#122338', ok: '#8fd6a2', okBg: '#12261a', warn: '#f0c674', warnBg: '#2b230e' },
};

const W = 1200;
const H = 540;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Box with title and up to three lines. */
function box({ x, y, w, h, title, lines = [], kind = 'box', badge }) {
  const rows = lines.map((l, i) => `<text class="line" x="${x + 16}" y="${y + 58 + i * 20}">${esc(l)}</text>`).join('');
  const tag = badge ? `<text class="badge" x="${x + 16}" y="${y + h - 16}">${esc(badge)}</text>` : '';
  return `<g><rect class="${kind}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/><text class="title" x="${x + 16}" y="${y + 30}">${esc(title)}</text>${tag}${rows}</g>`;
}

const arrow = (d, cls = 'arrow') => `<path class="${cls}" d="${d}" marker-end="url(#head)"/>`;
const label = (x, y, text, anchor = 'middle') => `<text class="label" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;

function diagram(t) {
  const top = 110;
  const bw = 200;
  const bh = 150;
  const gap = 32;
  const x0 = (W - (5 * bw + 4 * gap)) / 2;
  const col = (i) => x0 + i * (bw + gap);
  const steps = [
    { title: '1  Write', lines: ['one YAML manifest:', 'agents, tools, steps,', 'budgets, permissions'], badge: 'awp-editor' },
    { title: '2  Validate', lines: ['JSON Schema and', 'semantic rules per', 'conformance profile'], badge: 'awp-validator' },
    { title: '3  Review', lines: ['semantic version,', 'digest, diff and', 'four-eyes approval'] },
    { title: '4  Run', lines: ['any AWP runtime', 'enforces limits before', 'every call (deny by default)'], kind: 'runtime' },
    { title: '5  Audit', lines: ['workflow events,', 'decision trace,', 'reproducibility record'] },
  ];
  const boxes = steps.map((s, i) => box({ x: col(i), y: top, w: bw, h: bh, kind: s.kind ?? 'box', ...s })).join('');
  const arrows = [0, 1, 2, 3].map((i) => arrow(`M${col(i) + bw + 4} ${top + bh / 2} H${col(i + 1) - 6}`)).join('');
  // Loop back from Audit to Write: a change is a new version.
  const loopY = top - 26;
  const loop = `<path class="loop" d="M${col(4) + bw / 2} ${top - 4} V${loopY} H${col(0) + bw / 2} V${top - 8}" marker-end="url(#head)"/>${label(W / 2, loopY - 8, 'every change is a new, reviewable version')}`;

  // Runtime connections below step 4.
  const rx = col(3) + bw / 2;
  const by = top + bh + 88;
  const cw = 190;
  const cg = 24;
  const cx0 = rx - (3 * cw + 2 * cg) / 2;
  const conns = [
    { title: 'MCP', lines: ['agents ↔ tools'], note: 'tool calls' },
    { title: 'A2A', lines: ['agent ↔ agent'], note: 'remote agents' },
    { title: 'Models', lines: ['any provider'], note: 'model policy' },
  ];
  const connBoxes = conns.map((c, i) => box({ x: cx0 + i * (cw + cg), y: by, w: cw, h: 84, title: c.title, lines: c.lines, kind: 'proto' })).join('');
  const connArrows = conns.map((c, i) => {
    const tx = cx0 + i * (cw + cg) + cw / 2;
    return arrow(`M${rx} ${top + bh + 4} V${top + bh + 36} H${tx} V${by - 6}`, 'arrow thin');
  }).join('');
  const connLabel = label(rx, by + 84 + 26, 'referenced by the manifest – AWP does not replace them');

  // Left: what the manifest answers.
  const qx = x0;
  const qy = top + bh + 30;
  const questions = ['Which agents, models and tools?', 'Which steps, in which order?', 'What may run, what needs approval?', 'How much may it cost and take?', 'What happened in a run?'];
  const qBox = `<g><rect class="note" x="${qx}" y="${qy}" width="${cx0 - qx - 48}" height="${questions.length * 22 + 52}" rx="12"/><text class="title" x="${qx + 16}" y="${qy + 30}">One manifest answers</text>${questions.map((q, i) => `<text class="line" x="${qx + 16}" y="${qy + 56 + i * 22}">· ${esc(q)}</text>`).join('')}</g>`;

  const footer = `<text class="foot" x="${W / 2}" y="${H - 22}" text-anchor="middle">Declarative · versioned · schema first · fail closed · extensible with x- fields · vendor-neutral</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">How the Agentic Workflow Protocol works</title>
<desc id="d">A manifest is written, validated, reviewed as a new version, run by any AWP runtime that enforces budgets, permissions and approvals before every call, and audited; every change is a new version. The runtime reaches tools through MCP, other agents through A2A and models of any provider.</desc>
<defs><marker id="head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${t.muted}"/></marker></defs>
<style>
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: ${t.fg}; }
  .heading { font-size: 26px; font-weight: 700; }
  .sub { font-size: 15px; fill: ${t.muted}; }
  .title { font-size: 17px; font-weight: 700; }
  .line { font-size: 14px; fill: ${t.muted}; }
  .badge { font-size: 12px; font-weight: 600; fill: ${t.accent}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .label { font-size: 13px; fill: ${t.muted}; font-style: italic; }
  .foot { font-size: 14px; fill: ${t.muted}; letter-spacing: 0.02em; }
  .box { fill: ${t.box}; stroke: ${t.line}; stroke-width: 1.5; }
  .runtime { fill: ${t.accentBg}; stroke: ${t.accent}; stroke-width: 2; }
  .proto { fill: ${t.okBg}; stroke: ${t.ok}; stroke-width: 1.5; }
  .note { fill: ${t.warnBg}; stroke: ${t.warn}; stroke-width: 1.2; stroke-dasharray: 5 4; }
  .arrow { fill: none; stroke: ${t.muted}; stroke-width: 2; }
  .thin { stroke-width: 1.5; }
  .loop { fill: none; stroke: ${t.accent}; stroke-width: 1.8; stroke-dasharray: 6 5; }
</style>
<rect width="${W}" height="${H}" fill="${t.bg}" rx="16"/>
<text class="heading" x="${W / 2}" y="34" text-anchor="middle">AWP: a versioned contract for agentic workflows</text>
${loop}
${boxes}
${arrows}
${connArrows}
${connLabel}
${connBoxes}
${qBox}
${footer}
</svg>
`;
}

const dir = fileURLToPath(new URL('.', import.meta.url));
for (const [name, theme] of Object.entries(THEMES)) writeFileSync(`${dir}awp-overview-${name}.svg`, diagram(theme));
console.log('wrote awp-overview-light.svg and awp-overview-dark.svg');
