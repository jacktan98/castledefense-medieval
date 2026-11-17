# Makes the game's digit fonts (vendor/fonts/Digits*.woff2): the title font's and the body font's own old-style figures, only the
# digits, each one moved up or down so its middle sits where the middle of 0, 1 and 2 is. Old-style figures rise (6, 8) or drop
# (3, 4, 5, 7, 9) from the line, so a number in a badge or ring sat off its middle by whatever digits it had (Jack: keep the
# old-style figures, only line them up). The page lists these first for U+0030-0039 (`DispNum`, `BodyNum` in style.css).
#   pip install fonttools brotli; python3 tools/digits.py
import os
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options
from fontTools.pens.boundsPen import BoundsPen
D = os.path.join(os.path.dirname(__file__), '..', 'vendor', 'fonts')
NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
def make(src, out, variants):
    t = TTFont(os.path.join(D, src))
    o = Options(); o.layout_features = ['*']; o.glyph_names = True; o.flavor = 'woff2'; o.name_IDs = ['*']; o.notdef_outline = True
    s = Subsetter(o); s.populate(unicodes=range(0x30, 0x3A)); s.subset(t)
    gs, glyf, order = t.getGlyphSet(), t['glyf'], t.getGlyphOrder()
    def mid(g): bp = BoundsPen(gs); gs[g].draw(bp); b = bp.bounds; return (b[1] + b[3]) / 2
    for suf in variants:
        names = [n + suf for n in NAMES]
        if not all(n in order for n in names): continue
        target = sum(mid(n) for n in names[:3]) / 3
        for n in names:
            dy = round(target - mid(n)); g = glyf[n]
            if g.isComposite():
                for c in g.components: c.y += dy
            else:
                g.coordinates.translate((0, dy))
            g.recalcBounds(glyf)
    t.flavor = 'woff2'; t.save(os.path.join(D, out)); print(out, os.path.getsize(os.path.join(D, out)), 'bytes')
make('IMFellEnglishSC-400-latin.woff2', 'DigitsFell-400.woff2', [''])
for w in (400, 500, 700): make(f'AlegreyaSans-{w}-latin.woff2', f'DigitsAlegreya-{w}.woff2', ['', '.tosf'])
