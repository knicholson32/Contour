import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pgm import render
from grid import binarize, binarize_lines, hlines, vlines, bbox

PDF = "/Users/keenannicholson/Development/Projects/Coding/Contour/library/docs/2024AA - Section 19.pdf"
DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

# page -> (letter, dow, variant). variant: 77, 86, 86_77, 77_86
MANIFEST = {}
def _fill(base, letter):
    order = [("Mon",["77","86","86_77","77_86"]), ("Tue",["77","77_86"]),
             ("Wed",["77","86","86_77","77_86"]), ("Thu",["77","77_86"]),
             ("Fri",["77","77_86"]), ("Sat",["77","86","86_77","77_86"]),
             ("Sun",["77","77_86"])]
    p = base
    for dow, variants in order:
        for v in variants:
            MANIFEST[p] = (letter, dow, v); p += 1
    return p
_fill(24, "A"); _fill(44, "B")

EXPECTED_ROWS = {"77": 28, "86": 12, "86_77": 28, "77_86": 12}

def modal_height(gaps):
    """Height of the dominant (data-row) cluster."""
    best, bestn = None, 0
    for g in gaps:
        grp = [x for x in gaps if abs(x - g) <= 5]
        if len(grp) > bestn: best, bestn = sum(grp)/len(grp), len(grp)
    return best

def vline_score(bl, w, V, ya, yb):
    """How many internal vertical lines are present across this row band."""
    span = yb - ya
    n = 0
    for x in V[1:-1]:
        seg = bl[ya*w + x : yb*w : w]
        if seg.count(1) > span*0.85: n += 1
    return n

def extract(page, dpi=300):
    w,h,px = render(PDF, page, dpi)
    bi, bl = binarize(px), binarize_lines(px)
    x0,y0,x1,y1 = bbox(bi,w,h)
    H = hlines(bl,w,h,x0,x1)
    # the last few intervals are always data rows -> safe band for finding columns
    V = vlines(bl,w,h,H[-6]+4,H[-1]-4,frac=0.90)
    # 31 lines = LineFrom + 28 days + LineTo; 30 = same but the outer right
    # border went undetected. Either way the day columns are V[1]..V[29].
    if len(V) not in (30, 31):
        raise ValueError(f"p{page}: {len(V)} v-lines, expected 30 or 31")
    dayw = [V[i+1]-V[i] for i in range(1, 29)]
    if max(dayw) > 2 * min(dayw):
        raise ValueError(f"p{page}: irregular day columns {dayw}")
    # Some table images are clipped at the bottom of the page, losing the final
    # row's closing border. Synthesize it when ink continues past the last line.
    dh = modal_height([H[i+1]-H[i] for i in range(len(H)-1)])
    if y1 - H[-1] > dh * 0.5:
        H = H + [min(H[-1] + int(round(dh)), y1)]
    # a data row has full column structure (excludes the merged title band)
    def cell_ink(ya,yb,xa,xb):
        iy0,iy1 = ya+(yb-ya)//4, yb-(yb-ya)//4
        ix0,ix1 = xa+(xb-xa)//4, xb-(xb-xa)//4
        return sum(bi[y*w+ix0:y*w+ix1].count(1) for y in range(iy0,iy1))
    # A data row has full column structure AND carries line numbers in the
    # outer Line From / Line To cells; the day-of-week header rows leave those blank.
    def day_cells(i):
        return [1 if cell_ink(H[i],H[i+1],V[c],V[c+1]) > 40 else 0 for c in range(1,29)]
    # A data row has full column structure and a line number in the Line From
    # cell. The day-of-week header row leaves Line From blank and, unlike any
    # real schedule, carries a letter in all 28 day columns.
    data = [i for i in range(len(H)-1)
            if vline_score(bl,w,V,H[i]+3,H[i+1]-3) >= 27
            and cell_ink(H[i],H[i+1],V[0],V[1]) > 40
            and sum(day_cells(i)) < 28]
    return [day_cells(r) for r in data]

if __name__ == "__main__":
    result, bad = {}, []
    for page in sorted(MANIFEST):
        letter, dow, variant = MANIFEST[page]
        try:
            rows = extract(page)
        except Exception as e:
            bad.append(f"p{page} {letter}/{dow}/{variant}: {e}"); continue
        exp = EXPECTED_ROWS[variant]
        tag = "ok " if len(rows)==exp else "BAD"
        if len(rows)!=exp: bad.append(f"p{page} {letter}/{dow}/{variant}: {len(rows)} rows, expected {exp}")
        print(f"{tag} p{page:>2} {letter} {dow:<4} {variant:<6} rows={len(rows):>2}/{exp}")
        result[f"{letter}|{dow}|{variant}"] = rows
    json.dump(result, open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"raw.json"),"w"))
    print()
    print(f"{len(result)} tables extracted; {len(bad)} problems")
    for b in bad: print("  !", b)
