// news-image-20261123 — entry program for @nax.
//
// The front page summing up Monday 23 November 2026 is shipped in this
// repository as entry.png (drawn for this entry: tankers hit in the Strait
// of Hormuz as the lead, COP31 collapsing, a drone strike on flats near
// Kyiv, a Russian warship hit in Libya, markets tumbling, plus Indonesia's
// factory fire and BepiColombo reaching Mercury).
//
// This program copies that image byte-for-byte to the output directory, so
// both grading runs write exactly the same bytes. It reads nothing from the
// network and needs nothing beyond the Node standard library.

import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outDir, { recursive: true });
copyFileSync(join(repoDir, "entry.png"), join(outDir, "entry.png"));
