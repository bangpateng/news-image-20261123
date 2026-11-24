// The World in One Day — Monday 23 November 2026.
//
// A front-page renderer for the news-image-20261123 bounty. It draws the
// day's world news as a newspaper front page (masthead, hero scene, four
// story panels, bottom strip) and writes a deterministic 1024x1024 PNG.
//
// Node 22+ stdlib only. No network, no randomness, no dependencies.
// Output: $MAKEFUN_OUTPUT_DIR/entry.png (default /output/entry.png).
// Two runs produce byte-identical output.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import * as crypto from "node:crypto";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

// ---------------------------------------------------------------- palette
const PAPER: RGB = [246, 240, 225];
const INK: RGB = [22, 32, 46];
const NAVY: RGB = [20, 33, 61];
const NAVY_SOFT: RGB = [38, 54, 88];
const GOLD: RGB = [217, 164, 65];
const RED: RGB = [179, 39, 30];
const RED_SOFT: RGB = [217, 95, 75];
const CREAM: RGB = [255, 253, 244];
const CARD_LINE: RGB = [217, 207, 184];
const BODY: RGB = [58, 58, 58];
const MUTED: RGB = [107, 98, 82];
const SKY_TOP: RGB = [247, 200, 115];
const SKY_MID: RGB = [232, 135, 60];
const SKY_LOW: RGB = [198, 90, 36];
const SEA: RGB = [18, 63, 74];
const SEA_LINE: RGB = [46, 125, 140];
const SUN: RGB = [249, 226, 160];
const HULL: RGB = [22, 36, 46];
const SMOKE: RGB = [90, 90, 90];
const FLAME: RGB = [232, 106, 28];
const FLAME_IN: RGB = [247, 201, 72];
const WHITE: RGB = [255, 255, 255];
const OFFWHITE: RGB = [205, 214, 228];

// ------------------------------------------------------- 5x7 bitmap font
// Each glyph is 7 rows of 5 bits, written as strings of 0/1.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "\u2022": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
  "\u2014": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
};

// ------------------------------------------------------------- PNG writer
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    rgb.copy(raw, y * (1 + width * 3) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ canvas
interface TextOpts {
  bold?: boolean;
  tracking?: number; // extra px between glyphs (default = scale)
}

class Sheet {
  readonly w: number;
  readonly h: number;
  private px: Buffer;

  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.px = Buffer.alloc(w * h * 3);
    this.fill(bg);
  }

  fill(c: RGB): void {
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = c[0];
      this.px[i + 1] = c[1];
      this.px[i + 2] = c[2];
    }
  }

  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const o = (y * this.w + x) * 3;
    this.px[o] = c[0];
    this.px[o + 1] = c[1];
    this.px[o + 2] = c[2];
  }

  span(x0: number, x1: number, y: number, c: RGB): void {
    if (y < 0 || y >= this.h) return;
    const a = Math.max(0, Math.min(x0, x1));
    const b = Math.min(this.w - 1, Math.max(x0, x1));
    for (let x = a; x <= b; x++) {
      const o = (y * this.w + x) * 3;
      this.px[o] = c[0];
      this.px[o + 1] = c[1];
      this.px[o + 2] = c[2];
    }
  }

  box(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) this.span(x, x + w - 1, yy, c);
  }

  frame(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
    this.box(x, y, w, t, c);
    this.box(x, y + h - t, w, t, c);
    this.box(x, y, t, h, c);
    this.box(x + w - t, y, t, h, c);
  }

  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy));
      this.span(cx - dx, cx + dx, cy + dy, c);
    }
  }

  oval(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.floor((rx * Math.sqrt(ry * ry - dy * dy)) / ry);
      this.span(cx - dx, cx + dx, cy + dy, c);
    }
  }

  tri(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, c: RGB): void {
    const pts = [[ax, ay], [bx, by], [cx, cy]].sort((p, q) => p[1] - q[1]);
    const [x0, y0] = pts[0];
    const [x1, y1] = pts[1];
    const [x2, y2] = pts[2];
    const edge = (px: number, py: number, qx: number, qy: number, y: number): number =>
      qy === py ? px : px + ((qx - px) * (y - py)) / (qy - py);
    for (let y = Math.ceil(y0); y <= Math.floor(y2); y++) {
      let xa: number;
      let xb: number;
      if (y < y1) {
        xa = edge(x0, y0, x1, y1, y);
        xb = edge(x0, y0, x2, y2, y);
      } else {
        xa = edge(x1, y1, x2, y2, y);
        xb = edge(x0, y0, x2, y2, y);
      }
      this.span(Math.ceil(Math.min(xa, xb)), Math.floor(Math.max(xa, xb)), y, c);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, c: RGB, thick = 1): void {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;
    const r = Math.max(0, Math.floor(thick / 2));
    for (let guard = 0; guard < 4096; guard++) {
      if (thick <= 1) this.set(x, y, c);
      else this.disc(x, y, r, c);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  polyline(points: Array<[number, number]>, c: RGB, thick = 1): void {
    for (let i = 0; i + 1 < points.length; i++) {
      this.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], c, thick);
    }
  }

  // Vertical gradient band between two or more color stops.
  band(x: number, y: number, w: number, h: number, stops: Array<{ t: number; c: RGB }>): void {
    for (let yy = 0; yy < h; yy++) {
      const t = h <= 1 ? 0 : yy / (h - 1);
      let a = stops[0];
      let b = stops[stops.length - 1];
      for (let i = 0; i + 1 < stops.length; i++) {
        if (t >= stops[i].t && t <= stops[i + 1].t) {
          a = stops[i];
          b = stops[i + 1];
          break;
        }
      }
      const span = b.t - a.t || 1;
      const f = Math.min(1, Math.max(0, (t - a.t) / span));
      const c: RGB = [
        Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
        Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
        Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
      ];
      this.span(x, x + w - 1, y + yy, c);
    }
  }

  // ------------------------------------------------------------ text
  glyph(ch: string, x: number, y: number, s: number, c: RGB, bold: boolean): void {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) {
      const row = g[r];
      for (let col = 0; col < 5; col++) {
        if (row[col] !== "1") continue;
        this.box(x + col * s, y + r * s, s, s, c);
        if (bold) this.box(x + col * s + 1, y + r * s, s, s, c);
      }
    }
  }

  tw(s: string, scale: number, tracking?: number): number {
    const tr = tracking === undefined ? scale : tracking;
    const up = s.toUpperCase();
    if (up.length === 0) return 0;
    return up.length * (5 * scale + tr) - tr;
  }

  text(s: string, x: number, y: number, scale: number, c: RGB, opts: TextOpts = {}): void {
    const tr = opts.tracking === undefined ? scale : opts.tracking;
    let cx = x;
    for (const ch of s.toUpperCase()) {
      this.glyph(ch, cx, y, scale, c, !!opts.bold);
      cx += 5 * scale + tr;
    }
  }

  textCentered(s: string, cx: number, y: number, scale: number, c: RGB, opts: TextOpts = {}): void {
    const w = this.tw(s, scale, opts.tracking);
    this.text(s, Math.round(cx - w / 2), y, scale, c, opts);
  }

  wrap(s: string, scale: number, maxW: number, maxLines: number, tracking?: number): string[] {
    const words = s.toUpperCase().split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const next = cur === "" ? word : cur + " " + word;
      if (this.tw(next, scale, tracking) <= maxW || cur === "") {
        cur = next;
      } else {
        lines.push(cur);
        cur = word;
        if (lines.length >= maxLines) return lines;
      }
    }
    if (cur !== "") lines.push(cur);
    return lines.slice(0, maxLines);
  }

  toPng(): Buffer {
    return encodePng(this.w, this.h, this.px);
  }
}

// ------------------------------------------------------- small illustrations
function flame(cv: Sheet, x: number, y: number, s: number): void {
  // Outer flame, then a smaller inner flame. (x, y) = base centre.
  cv.tri(x - 9 * s, y, x, y - 18 * s, x + 9 * s, y, FLAME);
  cv.disc(x, y - 3 * s, 7 * s, FLAME);
  cv.tri(x - 5 * s, y, x, y - 11 * s, x + 5 * s, y, FLAME_IN);
  cv.disc(x, y - 2 * s, 4 * s, FLAME_IN);
}

function tanker(cv: Sheet, x: number, y: number, w: number, big: boolean): void {
  // Hull with a pointed bow, deck cargo, funnel and smoke.
  const hullH = big ? 24 : 18;
  cv.box(x, y, w, hullH, HULL);
  cv.tri(x + w, y, x + w + (big ? 40 : 30), y + Math.floor(hullH / 2), x + w, y + hullH, HULL);
  const deckY = y - (big ? 22 : 18);
  if (big) {
    cv.box(x + 28, deckY + 2, 42, 20, RED);
    cv.box(x + 78, deckY + 6, 36, 16, [74, 124, 89]);
    cv.box(x + 122, deckY, 46, 22, CREAM);
    cv.box(x + 176, deckY + 4, 32, 18, RED);
    cv.box(x + 232, deckY - 12, 24, 34, HULL); // funnel
    cv.disc(x + 244, deckY - 20, 7, SMOKE);
    cv.disc(x + 250, deckY - 34, 9, [122, 122, 122]);
    cv.disc(x + 258, deckY - 48, 11, [150, 150, 150]);
    flame(cv, x + 150, deckY + 2, 1);
  } else {
    cv.box(x + 34, deckY, 34, 18, CREAM);
    cv.box(x + 76, deckY + 4, 14, 14, HULL);
    cv.disc(x + 83, deckY - 4, 5, SMOKE);
    cv.disc(x + 88, deckY - 14, 6, [122, 122, 122]);
  }
}

function flatsBlock(cv: Sheet, x: number, y: number, w: number, h: number): void {
  cv.box(x, y, w, h, [31, 39, 51]);
  const cols = 4;
  const rows = 5;
  const ww = 18;
  const wh = 12;
  const gx = Math.floor((w - cols * ww) / (cols + 1));
  const gy = Math.floor((h - rows * wh) / (rows + 1));
  const lit: Array<[number, number]> = [[0, 1], [2, 0], [1, 2], [3, 3], [0, 4], [2, 4]];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + gx + c * (ww + gx);
      const wy = y + gy + r * (wh + gy);
      const isLit = lit.some(([lc, lr]) => lc === c && lr === r);
      cv.box(wx, wy, ww, wh, isLit ? [242, 181, 68] : [12, 18, 26]);
    }
  }
  // Smoke plume and a small fire at the base (kept inside the art area).
  cv.disc(x + w - 14, y - 8, 7, SMOKE);
  cv.disc(x + w - 6, y - 16, 9, [122, 122, 122]);
  cv.disc(x + w + 2, y - 24, 11, [150, 150, 150]);
  flame(cv, x + w - 30, y + h, 1);
  cv.tri(x - 26, y + h, x + 40, y + h - 26, x + 66, y + h, [52, 52, 52]); // rubble
}

function marketBars(cv: Sheet, x: number, y: number, w: number, h: number): void {
  const values = [86, 72, 80, 60, 66, 48, 54, 38];
  const n = values.length;
  const bw = 26;
  const gap = Math.floor((w - n * bw) / (n + 1));
  const baseY = y + h - 8;
  const tops: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const bh = Math.round((values[i] / 100) * (h - 20));
    const bx = x + gap + i * (bw + gap);
    cv.box(bx, baseY - bh, bw, bh, i % 2 === 0 ? RED : RED_SOFT);
    tops.push([bx + Math.floor(bw / 2), baseY - bh]);
  }
  cv.line(x, baseY, x + w, baseY, INK, 2);
  // Falling trend line with an arrowhead.
  const pts: Array<[number, number]> = tops.map(([px, py]) => [px, py - 6] as [number, number]);
  cv.polyline(pts, RED, 3);
  const [lx, ly] = pts[pts.length - 1];
  const [px2, py2] = pts[pts.length - 2];
  const ang = Math.atan2(ly - py2, lx - px2);
  const a1 = ang + 2.6;
  const a2 = ang - 2.6;
  cv.line(lx, ly, Math.round(lx + 16 * Math.cos(a1)), Math.round(ly + 16 * Math.sin(a1)), RED, 3);
  cv.line(lx, ly, Math.round(lx + 16 * Math.cos(a2)), Math.round(ly + 16 * Math.sin(a2)), RED, 3);
}

// ------------------------------------------------------------------ content
interface Panel {
  kicker: string;
  headline: string;
  deck: string;
  art: "cop31" | "kyiv" | "libya" | "markets";
}

const PANELS: Panel[] = [
  {
    kicker: "CLIMATE \u2014 ANTALYA",
    headline: "COP31 COLLAPSES",
    deck: "Longest summit on record ends in Antalya with no climate deal.",
    art: "cop31",
  },
  {
    kicker: "UKRAINE",
    headline: "DRONE HITS FLATS NEAR KYIV",
    deck: "2 dead, 11 missing in Dymer as US pushes a wider ceasefire.",
    art: "kyiv",
  },
  {
    kicker: "LIBYA \u2014 BENGHAZI",
    headline: "RUSSIAN WARSHIP HIT IN LIBYA",
    deck: "Sea drones strike corvette at Benghazi; 10 hurt, ship capsized.",
    art: "libya",
  },
  {
    kicker: "MARKETS",
    headline: "MARKETS TUMBLE WORLDWIDE",
    deck: "US stocks plunge; Asia slides \u2014 Taiwan down 17.5% in a week.",
    art: "markets",
  },
];

function drawArt(cv: Sheet, kind: Panel["art"], x: number, y: number, w: number, h: number): void {
  if (kind === "cop31") {
    cv.band(x, y, w, 58, [
      { t: 0, c: [247, 196, 120] },
      { t: 1, c: [232, 150, 70] },
    ]);
    cv.disc(x + w - 70, y + 26, 20, [250, 228, 170]);
    cv.box(x, y + 58, w, h - 58, [146, 96, 52]);
    cv.polyline(
      [
        [x + 20, y + 66],
        [x + 70, y + 82],
        [x + 110, y + 74],
        [x + 170, y + 92],
      ],
      [90, 58, 30],
      2
    );
    cv.polyline(
      [
        [x + 300, y + 70],
        [x + 350, y + 88],
        [x + 420, y + 78],
      ],
      [90, 58, 30],
      2
    );
    cv.oval(x + 150, y + 46, 108, 36, NAVY);
    cv.oval(x + 150, y + 46, 102, 31, CREAM);
    cv.textCentered("COP31", x + 150, y + 34, 3, NAVY, { bold: true });
  } else if (kind === "kyiv") {
    cv.band(x, y, w, h, [
      { t: 0, c: [96, 108, 132] },
      { t: 1, c: [58, 64, 80] },
    ]);
    flatsBlock(cv, x + 150, y + 30, 180, 70);
  } else if (kind === "libya") {
    cv.box(x, y, w, h, [14, 30, 51]);
    cv.disc(x + 62, y + 24, 16, [232, 226, 200]);
    cv.box(x, y + 66, w, h - 66, SEA);
    // Warship silhouette.
    cv.box(x + 150, y + 52, 190, 16, [10, 20, 29]);
    cv.tri(x + 340, y + 52, x + 380, y + 60, x + 340, y + 68, [10, 20, 29]);
    cv.box(x + 200, y + 34, 60, 18, [10, 20, 29]);
    cv.box(x + 226, y + 18, 6, 16, [10, 20, 29]);
    flame(cv, x + 300, y + 52, 1);
    // Sea drones: dotted trail above the water.
    for (let i = 0; i < 4; i++) cv.disc(x + 420, y + 22 + i * 10, 3, [200, 210, 220]);
    cv.line(x + 30, y + 84, x + 90, y + 84, SEA_LINE, 2);
    cv.line(x + 380, y + 90, x + 440, y + 90, SEA_LINE, 2);
  } else {
    cv.box(x, y, w, h, CREAM);
    marketBars(cv, x + 20, y + 12, w - 40, h - 24);
    cv.text("-17.5%", x + w - 132, y + 8, 3, RED, { bold: true });
  }
}

function drawPanel(cv: Sheet, p: Panel, x: number, y: number, w: number, h: number): void {
  cv.box(x, y, w, h, CREAM);
  cv.frame(x, y, w, h, 2, CARD_LINE);
  drawArt(cv, p.art, x + 2, y + 2, w - 4, 100);
  cv.text(p.kicker, x + 14, y + 114, 2, RED, { bold: true });
  const headLines = cv.wrap(p.headline, 3, w - 28, 2);
  let hy = y + 132;
  for (const line of headLines) {
    cv.text(line, x + 14, hy, 3, NAVY, { bold: true });
    hy += 22;
  }
  const deckLines = cv.wrap(p.deck, 2, w - 28, 2);
  let dy = y + 132 + headLines.length * 22 + 4;
  for (const line of deckLines) {
    cv.text(line, x + 14, dy, 2, BODY);
    dy += 16;
  }
}

// ------------------------------------------------------------------- layout
function buildPage(): Sheet {
  const cv = new Sheet(W, H, PAPER);
  cv.frame(6, 6, W - 12, H - 12, 2, NAVY);

  // Masthead.
  cv.box(10, 10, W - 20, 110, NAVY);
  cv.textCentered("THE WORLD IN ONE DAY", W / 2, 28, 2, GOLD, { bold: true });
  cv.textCentered("MONDAY 23 NOVEMBER 2026", W / 2, 52, 6, WHITE, { bold: true });
  cv.box(10, 120, W - 20, 4, GOLD);

  // Hero scene: sunset over the strait.
  const hx = 16;
  const hy = 128;
  const hw = W - 32;
  const hh = 202;
  cv.band(hx, hy, hw, 130, [
    { t: 0, c: SKY_TOP },
    { t: 0.55, c: SKY_MID },
    { t: 1, c: SKY_LOW },
  ]);
  cv.disc(hx + 834, hy + 62, 38, SUN);
  cv.box(hx, hy + 130, hw, hh - 130, SEA);
  tanker(cv, hx + 54, hy + 158, 160, false);
  tanker(cv, hx + 404, hy + 144, 320, true);
  cv.disc(hx + 934, hy + 176, 9, HULL);
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    cv.line(
      hx + 934 + Math.round(9 * Math.cos(ang)),
      hy + 176 + Math.round(9 * Math.sin(ang)),
      hx + 934 + Math.round(17 * Math.cos(ang)),
      hy + 176 + Math.round(17 * Math.sin(ang)),
      HULL,
      2
    );
  }
  cv.line(hx + 40, hy + 178, hx + 120, hy + 178, SEA_LINE, 2);
  cv.line(hx + 700, hy + 184, hx + 800, hy + 184, SEA_LINE, 2);
  cv.line(hx + 300, hy + 192, hx + 380, hy + 192, SEA_LINE, 2);
  cv.box(hx, hy, 280, 30, RED);
  cv.text("LEAD STORY \u2022 THE GULF", hx + 12, hy + 8, 2, WHITE, { bold: true });

  // Hero headline band.
  cv.box(hx, 334, hw, 92, NAVY);
  cv.textCentered("TANKERS HIT IN THE STRAIT OF HORMUZ", W / 2, 348, 4, WHITE, { bold: true });
  cv.textCentered(
    "THREE STRUCK, TWO MORE HIT MINES \u2014 THE WORST ATTACKS SINCE THE WAR BEGAN",
    W / 2,
    390,
    2,
    OFFWHITE
  );

  // Four story panels, 2 x 2.
  const cols = [16, 524];
  const rows = [438, 662];
  const pw = 484;
  const ph = 212;
  for (let i = 0; i < 4; i++) {
    drawPanel(cv, PANELS[i], cols[i % 2], rows[Math.floor(i / 2)], pw, ph);
  }

  // Bottom strip: two more stories.
  cv.box(16, 886, 992, 60, NAVY);
  cv.box(511, 894, 2, 44, GOLD);
  flame(cv, 44, 926, 1);
  const leftLines = cv.wrap("INDONESIA: FACTORY FIRE, 3 DEAD, DOZENS MISSING", 2, 430, 2);
  let ly = 886 + Math.floor((60 - leftLines.length * 16) / 2);
  for (const line of leftLines) {
    cv.text(line, 62, ly, 2, WHITE, { bold: true });
    ly += 16;
  }
  cv.disc(548, 916, 12, [214, 178, 120]);
  cv.oval(548, 916, 20, 6, [150, 120, 80]);
  const rightLines = cv.wrap("SPACE: BEPICOLOMBO REACHES MERCURY", 2, 420, 2);
  let ry = 886 + Math.floor((60 - rightLines.length * 16) / 2);
  for (const line of rightLines) {
    cv.text(line, 578, ry, 2, WHITE, { bold: true });
    ry += 16;
  }

  // Footer.
  cv.textCentered("THE WORLD IN ONE DAY \u2014 MONDAY 23 NOVEMBER 2026", W / 2, 958, 2, MUTED);
  cv.textCentered("SOURCES: AP, REUTERS, BBC, AFP, ESA", W / 2, 980, 2, MUTED);

  return cv;
}

// --------------------------------------------------------------------- main
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  const page = buildPage();
  const png = page.toPng();
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, png);
  const hash = crypto.createHash("sha256").update(png).digest("hex");
  console.log(`wrote ${outPath} (${png.length} bytes, sha256 ${hash})`);
}

main();
