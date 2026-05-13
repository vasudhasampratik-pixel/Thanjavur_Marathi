import { useEffect, useMemo, useRef, useState } from 'react';
import { FAMILY_MEMBERS, CANVAS_W, CANVAS_H } from '../../data/simpleRelations';
import type { FamilyMember } from '../../data/simpleRelations';
import { TreeNode } from './TreeNode';
import { NodeDetail } from './NodeDetail';

// ── Stroke palette ────────────────────────────────────────────────────────────
const SAF = '#ffa47a'; // saffron-300  — blood / descent
const PEA = '#72c9a5'; // peacock-300  — marriage
const SW  = 1.75;

// ── Card geometry helpers (half-height = 32) ─────────────────────────────────
// bot(y) = y + 32   top(y) = y - 32
// Gen +3 y=40:   top=8    bot=72
// Gen +2 y=85:   bot=117
// Gen +1 y=220:  top=188  bot=252
// Gen  0 y=390:  top=358  bot=422
// Gen -1 y=530:  top=498  bot=562
// Gen -2 y=660:  top=628

export function TreeCanvas() {
  const [selected, setSelected] = useState<FamilyMember | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prevMobileRef = useRef<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const update = () => {
      setContainerWidth(scrollerRef.current?.clientWidth ?? 0);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const minMobileScale = useMemo(() => {
    if (!containerWidth) return 0.24;
    return Math.max(0.22, Math.min(0.7, containerWidth / CANVAS_W));
  }, [containerWidth]);

  useEffect(() => {
    if (prevMobileRef.current === isMobile) return;
    prevMobileRef.current = isMobile;
    setZoom(isMobile ? 0.78 : 1);
  }, [isMobile]);

  const canvasScale = isMobile ? zoom : 1;
  const scaledCanvas = useMemo(
    () => ({
      width: Math.round(CANVAS_W * canvasScale),
      height: Math.round(CANVAS_H * canvasScale),
    }),
    [canvasScale],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const nextLeft = Math.max(0, (scaledCanvas.width - scroller.clientWidth) / 2);
    scroller.scrollLeft = nextLeft;
  }, [scaledCanvas.width]);

  function zoomIn() {
    setZoom((z) => Math.min(1, z + 0.12));
  }

  function zoomOut() {
    setZoom((z) => Math.max(minMobileScale, z - 0.12));
  }

  function fitTree() {
    setZoom(minMobileScale);
  }

  function toggle(m: FamilyMember) { setSelected(p => p?.id === m.id ? null : m); }

  return (
    <div className="relative">
      {isMobile && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800"
            aria-label="Zoom out family tree"
          >
            -
          </button>
          <button
            type="button"
            onClick={fitTree}
            className="rounded-full border border-saffron-300 bg-saffron-50 px-3 py-1.5 text-xs font-semibold text-saffron-800"
            aria-label="Fit entire family tree"
          >
            Fit full tree
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800"
            aria-label="Zoom in family tree"
          >
            +
          </button>
          <span className="text-[11px] font-medium text-gray-500">{Math.round(zoom * 100)}%</span>
        </div>
      )}

      <div ref={scrollerRef} className="overflow-x-auto overflow-y-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
        <div style={{ width: scaledCanvas.width, height: scaledCanvas.height, position: 'relative' }}>
          <div
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              position: 'relative',
              transform: `scale(${canvasScale})`,
              transformOrigin: 'top left',
            }}
          >

          <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
               width={CANVAS_W} height={CANVAS_H}
               viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} aria-hidden="true">

            {/* ═══════════════════════════════════════════════════════════════
                MARRIAGE LINES  (peacock green ──)
                Each couple: left card right-edge → right card left-edge
            ═══════════════════════════════════════════════════════════════ */}
            {/* Grandparents: grandpa right(560) → grandma left(610) */}
            <line x1={560} y1={85}  x2={610} y2={85}  stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Great-grandparents: g-grandpa right(410) → g-grandma left(760) */}
            <line x1={410} y1={40} x2={760} y2={40} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Parents: father right(560) → mother left(610) */}
            <line x1={560} y1={220} x2={610} y2={220} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Mama + Mami: mama right(965) → mami left(990) */}
            <line x1={965} y1={220} x2={990} y2={220} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* In-laws: FIL right(1240) → MIL left(1275) */}
            <line x1={1240} y1={220} x2={1275} y2={220} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Bhaoji + Sister: bhaoji right(110) → sister left(140) */}
            <line x1={110} y1={390} x2={140} y2={390} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Brother + Bhauja: brother right(380) → bhauja left(410) */}
            <line x1={380} y1={390} x2={410} y2={390} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Me + Spouse: me right(630) → spouse left(670) */}
            <line x1={630} y1={390} x2={670} y2={390} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Daughter-in-law + Son: DIL right(550) → son left(567) */}
            <line x1={550} y1={530} x2={567} y2={530} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>
            {/* Daughter + Son-in-law: daughter right(800) → SIL left(817) */}
            <line x1={800} y1={530} x2={817} y2={530} stroke={PEA} strokeWidth={2.5} strokeLinecap="round"/>

            {/* ═══════════════════════════════════════════════════════════════
                DESCENT LINES  (saffron orange │)
            ═══════════════════════════════════════════════════════════════ */}

            {/* ── A0. Great-grandparents → Grandparents ────────────────────
              Great-grandparent couple-centre = (360+810)/2 = 585
              Branch y = 60 (between bot-of-gen+3=72 and top-of-gen+2=53)
            */}
            <line x1={585} y1={72} x2={585} y2={60} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={510} y1={60} x2={660} y2={60} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={510} y1={60} x2={510} y2={53} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={660} y1={60} x2={660} y2={53} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── A. Grandparents → Father + Father's siblings ──────────────
                Grandparent couple-centre = (510+660)/2 = 585
                Branch y = 153  (between bot-of-gr=117 and top-of-gen1=188)
                Horizontal spans atya(130) → father(510)
                Grandparent vert: 585 is inside 130–510? No — 585 > 510.
                Use father-side midpoint: vert drops from 585 down to 153,
                then left-branch from 510 to 130, right connection to 585 on same row.
            */}
            {/* Vert from grandparent centre (585) to branch */}
            <line x1={585} y1={117} x2={585} y2={153} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            {/* Horiz: atya(130) across through father(510) to gp-centre(585) */}
            <line x1={130} y1={153} x2={585} y2={153} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            {/* Drops to atya, vadil_kaka, kaka, father */}
            <line x1={130} y1={153} x2={130} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={255} y1={153} x2={255} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={380} y1={153} x2={380} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={510} y1={153} x2={510} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            {/* Vert from grandparent centre to mother */}
            <line x1={585} y1={153} x2={585} y2={169} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={585} y1={169} x2={660} y2={169} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={660} y1={169} x2={660} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── B. Mother's siblings bracket (right side of mother) ───────
                Mother at 660 — siblings: maushi(790), mama(915)
                Branch y = 167 (just above gen+1 top=188, distinct from A's 153)
            */}
            <line x1={660} y1={188} x2={660} y2={167} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={660} y1={167} x2={915} y2={167} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={790} y1={167} x2={790} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={915} y1={167} x2={915} y2={188} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── C. Parents → Your siblings + Me ──────────────────────────
                Couple centre = (510+660)/2 = 585
                Blood children: sister(190), brother(330), me(580)
                Branch y = 308
            */}
            <line x1={585} y1={252} x2={585} y2={308} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={190} y1={308} x2={585} y2={308} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={190} y1={308} x2={190} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={330} y1={308} x2={330} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={580} y1={308} x2={580} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── D. In-laws → Spouse + Spouse's siblings ───────────────────
                In-law couple centre = (1190+1325)/2 = 1257
                Children: spouse(720), vahinak(850), nanand(965), daer(1080), vahini(1195), mevanna(1325)
                Branch y = 308
            */}
            <line x1={1257} y1={252} x2={1257} y2={308} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={720}  y1={308} x2={1325} y2={308} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={720}  y1={308} x2={720}  y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={850}  y1={308} x2={850}  y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={965}  y1={308} x2={965}  y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={1080} y1={308} x2={1080} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={1195} y1={308} x2={1195} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={1325} y1={308} x2={1325} y2={358} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── E. Me + Spouse → Son + Daughter ──────────────────────────
                Couple centre = (580+720)/2 = 650
                Branch y = 462
            */}
            <line x1={650} y1={422} x2={650} y2={462} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={617} y1={462} x2={750} y2={462} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={617} y1={462} x2={617} y2={498} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={750} y1={462} x2={750} y2={498} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── F. Son + Daughter → Grandchildren ────────────────────────
                Children midpoint = (617+750)/2 = 683
                Branch y = 598
            */}
            <line x1={683} y1={562} x2={683} y2={598} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={617} y1={598} x2={750} y2={598} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={617} y1={598} x2={617} y2={628} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>
            <line x1={750} y1={598} x2={750} y2={628} stroke={SAF} strokeWidth={SW} strokeLinecap="round"/>

            {/* ── Generation labels ─────────────────────────────────────── */}
            <text x={12} y={43}  fontSize={9} fill="#d1d5db">+3</text>
            <text x={12} y={88}  fontSize={9} fill="#d1d5db">+2</text>
            <text x={12} y={223} fontSize={9} fill="#d1d5db">+1</text>
            <text x={12} y={393} fontSize={9} fill="#d1d5db"> 0</text>
            <text x={12} y={533} fontSize={9} fill="#d1d5db">-1</text>
            <text x={12} y={663} fontSize={9} fill="#d1d5db">-2</text>
          </svg>

          {/* ── Family cards ─────────────────────────────────────── */}
          {FAMILY_MEMBERS.map((m, i) => (
            <TreeNode key={m.id} member={m} index={i}
              isSelected={selected?.id === m.id} onClick={toggle} />
          ))}
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setSelected(null)} aria-hidden="true"/>
          <NodeDetail member={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
