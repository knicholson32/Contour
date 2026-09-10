import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import TO_LINES, dist

SP  = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(SP,"scan.json")))

# 0=Fri .. 6=Thu, matching table column 1 = Friday
FROM_CANDS = {"Mon":(4,11), "Tue":(5,12), "Wed":(6,13), "Thu":(7,14),
              "Fri":(1,8),  "Sat":(2,9),  "Sun":(3,10)}
TOURLEN = {"77":(7,7), "86":(8,8), "86_77":(8,7), "77_86":(7,8)}

def col_dow(c):   return (c-1) % 7          # c is 1-based
def start_dow(n): return (n-1) % 7
def end_dow(n,L): return (start_dow(n)+L-1) % 7

# ---- build digit templates from the Line To column (values known by position)
tmpl = {}
for key, tab in data.items():
    variant = key.split("|")[2]
    vals = TO_LINES[variant]; n = len(vals)
    for i, r in enumerate(tab["rows"]):
        if r["lt"] is None: continue
        tmpl.setdefault(vals[i % n], []).append(r["lt"])
print(f"templates: {len(tmpl)} distinct line numbers, "
      f"{sum(len(v) for v in tmpl.values())} exemplars")

def read_num(bm, cands):
    best = None
    for c in cands:
        if c not in tmpl: continue
        d = min(dist(bm, t) for t in tmpl[c])
        if best is None or d < best[0]: best = (d, c)
    return best   # (distance, value)

def runs(row, lo, hi):
    """Maximal runs of work days within columns [lo,hi] (1-based, inclusive)."""
    out, s = [], None
    for c in range(lo, hi+1):
        if row[c-1] and s is None: s = c
        if not row[c-1] and s is not None: out.append((s, c-1)); s = None
    if s is not None: out.append((s, hi))
    return out

problems, resolved = [], {}
for key in sorted(data):
    letter, dow, variant = key.split("|")
    tab   = data[key]; rows = tab["rows"]
    fromL, toL = TOURLEN[variant]
    tos   = TO_LINES[variant]; n = len(tos)
    blocks = [rows[:n], rows[n:]]
    cands  = FROM_CANDS[dow]
    seen   = []
    for bi, blk in enumerate(blocks):
        got = read_num(blk[0]["lf"], cands)
        if got is None: problems.append(f"{key} blk{bi}: no template match"); continue
        d, fl = got
        if d > 40: problems.append(f"{key} blk{bi}: weak line-number match (d={d})")
        seen.append(fl)
        pre = blk[0]["days"][:7]
        for r in blk:
            if r["days"][:7] != pre:
                problems.append(f"{key} blk{bi}: pre-seam differs within block"); break
        # pre-seam must agree with the FROM line's tour geometry
        for (s,e) in runs(blk[0]["days"], 1, 7):
            if s > 1 and col_dow(s) != start_dow(fl):
                problems.append(f"{key} blk{bi} from={fl}: pre-seam run starts col{s} (bad DOW)")
            if e < 7 and col_dow(e) != end_dow(fl, fromL):
                problems.append(f"{key} blk{bi} from={fl}: pre-seam run ends col{e} (bad DOW)")
        # post-seam must agree with the TO line's tour geometry
        for i, r in enumerate(blk):
            tl = tos[i]
            for (s,e) in runs(r["days"], 22, 28):
                if s > 22 and col_dow(s) != start_dow(tl):
                    problems.append(f"{key} blk{bi} to={tl}: post-seam starts col{s} (bad DOW)")
                if e < 28 and col_dow(e) != end_dow(tl, toL):
                    problems.append(f"{key} blk{bi} to={tl}: post-seam ends col{e} (bad DOW)")
        resolved[f"{key}|{fl}"] = [r["days"] for r in blk]
    if len(seen)==2 and set(seen) != set(cands):
        problems.append(f"{key}: from-lines {seen}, expected {cands}")

# cross-variant: same letter+dow+from-line must share a pre-seam pattern
groups = {}
for k, rws in resolved.items():
    letter, dow, variant, fl = k.split("|")
    origin = "86" if variant in ("86","86_77") else "77"
    groups.setdefault((letter,dow,origin,fl), []).append((variant, tuple(rws[0][:7])))
for g, vals in groups.items():
    if len({v[1] for v in vals}) > 1:
        problems.append(f"cross-variant pre-seam mismatch {g}: {vals}")

print(f"resolved {len(resolved)} blocks")
print(f"problems: {len(problems)}")
for p in problems[:25]: print("  !", p)
json.dump(resolved, open(os.path.join(SP,"resolved.json"),"w"))
