import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pgm import render
from grid import binarize, binarize_lines, hlines, vlines, bbox
from extract import PDF, MANIFEST, EXPECTED_ROWS, modal_height, vline_score

TO_LINES = {"77":list(range(1,15)), "86_77":list(range(1,15)),
            "86":[2,4,6,9,11,13],  "77_86":[2,4,6,9,11,13]}
GRID = (14, 18)

def norm(bi, w, ya, yb, xa, xb):
    """Crop cell to its ink, rescale to a fixed grid -> comparable bitmap."""
    pad_y, pad_x = (yb-ya)//8, (xb-xa)//8
    ya, yb, xa, xb = ya+pad_y, yb-pad_y, xa+pad_x, xb-pad_x
    pts = [(y,x) for y in range(ya,yb) for x in range(xa,xb) if bi[y*w+x]]
    if not pts: return None
    y0,y1 = min(p[0] for p in pts), max(p[0] for p in pts)+1
    x0,x1 = min(p[1] for p in pts), max(p[1] for p in pts)+1
    gw,gh = GRID
    out=[]
    for gy in range(gh):
        for gx in range(gw):
            sy0,sy1 = y0+(y1-y0)*gy//gh, y0+(y1-y0)*(gy+1)//gh
            sx0,sx1 = x0+(x1-x0)*gx//gw, x0+(x1-x0)*(gx+1)//gw
            n = sum(bi[y*w+x] for y in range(sy0,max(sy1,sy0+1)) for x in range(sx0,max(sx1,sx0+1)))
            tot = max((sy1-sy0)*(sx1-sx0), 1)
            out.append(1 if n*2 > tot else 0)
    return out

def dist(a,b): return sum(1 for x,y in zip(a,b) if x!=y)

def scan(page):
    w,h,px = render(PDF, page, 300)
    bi, bl = binarize(px), binarize_lines(px)
    x0,y0,x1,y1 = bbox(bi,w,h)
    H = hlines(bl,w,h,x0,x1)
    V = vlines(bl,w,h,H[-6]+4,H[-1]-4,frac=0.90)
    if len(V) not in (30,31): raise ValueError(f"p{page}: {len(V)} v-lines")
    dh = modal_height([H[i+1]-H[i] for i in range(len(H)-1)])
    if y1-H[-1] > dh*0.5: H = H+[min(H[-1]+int(round(dh)), y1)]
    def ink(ya,yb,xa,xb):
        iy0,iy1=ya+(yb-ya)//4,yb-(yb-ya)//4; ix0,ix1=xa+(xb-xa)//4,xb-(xb-xa)//4
        return sum(bi[y*w+ix0:y*w+ix1].count(1) for y in range(iy0,iy1))
    def days(i): return [1 if ink(H[i],H[i+1],V[c],V[c+1])>15 else 0 for c in range(1,29)]
    rows=[]
    for i in range(len(H)-1):
        if vline_score(bl,w,V,H[i]+3,H[i+1]-3) < 27: continue
        if ink(H[i],H[i+1],V[0],V[1]) <= 15: continue
        d = days(i)
        if sum(d) >= 28: continue
        lf = norm(bi,w,H[i],H[i+1],V[0],V[1])
        lt = norm(bi,w,H[i],H[i+1],V[29],V[30]) if len(V)==31 else None
        rows.append({"days":d, "lf":lf, "lt":lt})
    return rows

if __name__ == "__main__":
    data={}
    for page in sorted(MANIFEST):
        letter,dow,variant = MANIFEST[page]
        rows = scan(page)
        assert len(rows)==EXPECTED_ROWS[variant], f"p{page}: {len(rows)} rows"
        data[f"{letter}|{dow}|{variant}"] = {"page":page,"rows":rows}
        print(f"  p{page} {letter}/{dow}/{variant}: {len(rows)} rows")
    json.dump(data, open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"scan.json"),"w"))
    print("scan.json written")
