import subprocess, os

SP = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(SP, "render")
os.makedirs(WORK, exist_ok=True)

def render(pdf, page, dpi=300):
    """Render one PDF page to grayscale PGM; return (w, h, pixels)."""
    root = os.path.join(WORK, "pg")
    for f in os.listdir(WORK):
        os.remove(os.path.join(WORK, f))
    subprocess.run(["pdftoppm","-gray","-r",str(dpi),"-f",str(page),"-l",str(page),
                    pdf, root], check=True, capture_output=True)
    f = [x for x in os.listdir(WORK) if x.endswith(".pgm")][0]
    return parse(open(os.path.join(WORK,f),"rb").read())

def parse(d):
    parts, i = [], 2
    while len(parts) < 3:
        while i < len(d) and d[i:i+1].isspace(): i += 1
        if d[i:i+1] == b"#":
            while d[i:i+1] != b"\n": i += 1
            continue
        s = i
        while i < len(d) and not d[i:i+1].isspace(): i += 1
        parts.append(int(d[s:i]))
    return parts[0], parts[1], d[i+1:]
