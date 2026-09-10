# Seam table extraction

Regenerates `src/lib/schedule/seamTables.ts` from the 2024AA Section 19.9 seam
tables. You should not need to run this unless the agreement changes.

The tables in the CBA are **raster images with no text layer**, so they are read
by grid detection and per-cell ink measurement rather than OCR. Every extracted
row is then checked against the tour geometry it must obey, so a misread fails
loudly instead of producing a plausible but wrong schedule.

## Requirements

- `poppler` (`brew install poppler`) for `pdftoppm` / `pdftotext`
- Python 3.7+, no third-party packages

## Pipeline

```sh
cd scripts/seam-tables
python3 build.py       # render all 40 table pages, detect grids, emit scan.json
python3 validate.py    # resolve line numbers, run semantic checks, emit resolved.json
python3 generate.py    # write src/lib/schedule/seamTables.ts
```

`extract.py` holds the shared page manifest and grid logic; it also runs
standalone (`python3 extract.py 30`) to dump one page as ASCII, which is the
quickest way to eyeball a single table.

## How line numbers are recovered

Nothing is OCR'd. The **Line To** column has values that are known from row
position (1..14 for 7&7 destinations, 2/4/6/9/11/13 for 8&6), so those cells
become labelled digit templates. The **Line From** column is then matched
against those templates. Every block resolves to one of the two lines that the
`Friday + (N - 1) mod 7` weekday mapping predicts for that table, which is a
strong independent confirmation.

## What validate.py checks

- Row counts match the variant (28 rows for 7&7 destinations, 12 for 8&6)
- The pre-seam week is identical across every row of a block, since the outgoing
  line's tail cannot depend on where the pilot is going
- Pre-seam runs start and end on weekdays consistent with the *from* line
- Post-seam runs start and end on weekdays consistent with the *to* line,
  allowing a first tour truncated by the seam
- The same from-line shares a pre-seam pattern across its variants

## Two quirks of the source document

- **Page 50** (Table B, Wednesday, 7&7) is clipped at the page edge, so its last
  row (13 -> 14) has no bottom border. The contents are intact; `extract.py`
  synthesizes the missing boundary. Read visually, that row is easy to miss.
- **Ink density depends on the background.** An `x` on the grey seam fill
  measures ~105 dark pixels while the identical glyph on white measures ~38,
  purely from anti-aliasing. A single fixed threshold silently drops the
  white-background work days, so the threshold sits well below both.
