# The World in One Day — Monday 23 November 2026

[![make.fun](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/bangpateng/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/bangpateng/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123)

One image summing up the world news of **Monday 23 November 2026**, drawn as a
newspaper front page. The entry program (`main.ts`) draws the front page
itself (Node 22 stdlib only, no network) and writes it to `/output/entry.png`.

## The day's news in the image

- **Lead — Strait of Hormuz:** tankers hit. Three oil tankers were struck in and
  near the strait, and two more caught fire after hitting naval mines — the worst
  attacks on Gulf shipping since the war began.
- **COP31 collapses:** UN climate talks in Antalya ended with no deal — the
  longest COP on record, with no fossil-fuel phase-out in the final text.
- **Ukraine:** a Russian drone hit a five-storey flat block in Dymer, near Kyiv —
  2 dead, 11 missing — as the US pushed a wider ceasefire.
- **Libya:** suspected sea drones hit the Russian corvette Merkury at Benghazi;
  10 hurt, the ship capsized.
- **Markets tumble:** US stocks plunged and Asia slid — Taiwan down 17.5% in a week.
- **Also:** a deadly factory fire in Indonesia (3 dead, dozens missing) and
  BepiColombo reaching Mercury — only the second mission ever to orbit it.

Sources: AP, Reuters, BBC, AFP, ESA — as reported on 23 November 2026.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024×1024, under 1 MiB). It runs with no network
and is fully deterministic: both runs produce identical bytes.

Entry for the [news-image-20261123 bounty](https://make.fun/bounty/news-image-20261123)
on [make.fun](https://make.fun).
