DARK = bytes(1 if i < 128 else 0 for i in range(256))

def binarize(px): return px.translate(DARK)

def runs(idxs, gap=3):
    """Group consecutive indices into runs; return their midpoints."""
    if not idxs: return []
    out, s, p = [], idxs[0], idxs[0]
    for i in idxs[1:]:
        if i - p > gap:
            out.append((s + p) // 2); s = i
        p = i
    out.append((s + p) // 2)
    return out

def hlines(b, w, h, x0, x1, frac=0.80):
    span = x1 - x0
    hits = [y for y in range(h) if b[y*w+x0 : y*w+x1].count(1) > span*frac]
    return runs(hits)

def vlines(b, w, h, y0, y1, frac=0.80):
    span = y1 - y0
    hits = []
    for x in range(w):
        col = b[y0*w + x : y1*w : w]
        if col.count(1) > span*frac: hits.append(x)
    return runs(hits)

def bbox(b, w, h):
    """Tight bounding box of all ink."""
    rows = [y for y in range(h) if b[y*w:(y+1)*w].count(1) > 0]
    cols = [x for x in range(w) if b[x::w].count(1) > 0]
    return min(cols), min(rows), max(cols)+1, max(rows)+1

LINE = bytes(1 if i < 170 else 0 for i in range(256))   # catches red seam rules (~130)
def binarize_lines(px): return px.translate(LINE)
