"""Emit src/lib/schedule/seamTables.ts from resolved.json.

Run after validate.py. See README.md for the full pipeline.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT  = os.path.join(ROOT, "src", "lib", "schedule", "seamTables.ts")

KIND = {"77": "7to7", "86": "8to8", "86_77": "8to7", "77_86": "7to8"}
TO   = {"77": list(range(1, 15)), "86_77": list(range(1, 15)),
        "86": [2, 4, 6, 9, 11, 13], "77_86": [2, 4, 6, 9, 11, 13]}

def main():
    r = json.load(open(os.path.join(HERE, "resolved.json")))
    tree = {}
    for key, rows in r.items():
        letter, _dow, variant, fl = key.split("|")
        for i, row in enumerate(rows):
            pat = "".join("X" if v else "." for v in row)
            assert len(pat) == 28, key
            tree.setdefault(letter, {}).setdefault(KIND[variant], {}) \
                .setdefault(int(fl), {})[TO[variant][i]] = pat

    L = [
        "// GENERATED FILE - DO NOT EDIT BY HAND.",
        "// Extracted from 2024AA Section 19.9 seam tables",
        "// (library/docs/2024AA - Section 19.pdf) by scripts/seam-tables/.",
        "// Regenerate rather than editing; see src/lib/schedule/index.ts for the reader.",
        "",
        "/** Which lettered seam table governs a bid period. See `seamTableLetterFor()`. */",
        "export type SeamTableLetter = 'A' | 'B';",
        "",
        "/** The four transition matrices published for each lettered table. */",
        "export type TransitionKind = '7to7' | '8to8' | '8to7' | '7to8';",
        "",
        "/**",
        " * A 28-character work-day mask. Index 0 is seven days BEFORE the seam start,",
        " * so index 7 is the seam start itself (always a Friday) and indices 7..20 are",
        " * the fourteen seam days. 'X' is a scheduled work day, '.' a day off.",
        " */",
        "export type SeamPattern = string;",
        "",
        "/** `SEAM_TABLES[letter][kind][fromLine][toLine]` -> 28-day mask. */",
        "export const SEAM_TABLES: Record<SeamTableLetter, Record<TransitionKind, "
        "Record<number, Record<number, SeamPattern>>>> = {",
    ]
    for letter in sorted(tree):
        L.append(f"\t{letter}: {{")
        for kind in ("7to7", "8to8", "8to7", "7to8"):
            L.append(f"\t\t'{kind}': {{")
            for fl in sorted(tree[letter][kind]):
                L.append(f"\t\t\t{fl}: {{")
                for tl in sorted(tree[letter][kind][fl]):
                    L.append(f"\t\t\t\t{tl}: '{tree[letter][kind][fl][tl]}',")
                L.append("\t\t\t},")
            L.append("\t\t},")
        L.append("\t},")
    L += ["};", ""]
    open(OUT, "w").write("\n".join(L))
    n = sum(len(tree[l][k][f]) for l in tree for k in tree[l] for f in tree[l][k])
    print(f"wrote {OUT}: {n} patterns")

if __name__ == "__main__":
    main()
