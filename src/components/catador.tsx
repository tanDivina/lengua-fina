import type { SVGProps } from "react";

// The Catador: Lengua Fina's face. A professional taster — lengua is the
// tongue you speak with and the tongue you taste with, and the catador does
// both jobs this product does: he samples the copy and judges whether it
// lands in each market. Filled-ink illustration in the house palette: solid
// ink jacket, leaf neckerchief, waist apron, tasting spoon, the market
// notebook over his forearm, the verdict seal served in the bowl of the
// spoon. Drawn by hand; keep every stroke deliberate.

type CatadorProps = SVGProps<SVGSVGElement> & {
  pose?: "greet" | "taste" | "serve";
  verdict?: "lands" | "wontland";
};

const INK = "var(--ink)";
const SKIN = "#E8C49A";
const CARD = "var(--card)";
const LEAF = "var(--leaf)";
const WARN = "var(--warn)";
const SEAL =
  "M12 4.4Q14.43 2.92 15.8 5.42Q18.65 5.35 18.58 8.2Q21.08 9.57 19.6 12Q21.08 14.43 18.58 15.8Q18.65 18.65 15.8 18.58Q14.43 21.08 12 19.6Q9.57 21.08 8.2 18.58Q5.35 18.65 5.42 15.8Q2.92 14.43 4.4 12Q2.92 9.57 5.42 8.2Q5.35 5.35 8.2 5.42Q9.57 2.92 12 4.4Z";

export function Catador({ pose = "greet", verdict = "lands", ...props }: CatadorProps) {
  const happy = pose !== "serve" || verdict === "lands";
  const tasting = pose === "taste";
  const sealColor = verdict === "lands" ? LEAF : WARN;
  return (
    <svg viewBox="28 8 116 160" fill="none" aria-hidden="true" {...props}>
      {/* right arm, per pose (drawn first so the body overlaps the shoulder) */}
      {pose === "greet" && (
        <>
          <path d="M92 66 Q104 65 111 57" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M111 52 L107.8 38" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx="106.8" cy="33" rx="4.2" ry="5.8" transform="rotate(-12 106.8 33)" fill={CARD} stroke={INK} strokeWidth={2} />
          <circle cx="112.5" cy="55.5" r="5.2" fill={SKIN} stroke={INK} strokeWidth={2} />
        </>
      )}
      {pose === "taste" && (
        <>
          <path d="M92 66 Q102 62 94 53" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M81.5 47 L89.5 50" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx="76.5" cy="46.8" rx="5.2" ry="3.6" transform="rotate(-8 76.5 46.8)" fill={CARD} stroke={INK} strokeWidth={2} />
          <path d="M73.5 39.5 q1.5 -3 0 -6 M78.5 39.5 q1.5 -3 0 -6" stroke={LEAF} strokeWidth={1.6} strokeLinecap="round" />
          <circle cx="91" cy="50.5" r="5.2" fill={SKIN} stroke={INK} strokeWidth={2} />
        </>
      )}
      {pose === "serve" && (
        <>
          <path d="M92 66 Q108 60 116 48" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M117 43 L117 38.5" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx="117" cy="30" r="8.6" fill={CARD} stroke={INK} strokeWidth={2} />
          <g transform="translate(117 30) scale(0.88) translate(-12 -12)">
            <path d={SEAL} fill={sealColor} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            {verdict === "lands" ? (
              <path d="M8.9 12.2 L11 14.3 L15.2 9.8" stroke={CARD} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M9.4 9.4 L14.6 14.6 M14.6 9.4 L9.4 14.6" stroke={CARD} strokeWidth={1.8} strokeLinecap="round" />
            )}
          </g>
          <circle cx="117" cy="45" r="5.2" fill={SKIN} stroke={INK} strokeWidth={2} />
        </>
      )}

      {/* head, wavy hair with a forehead curl, no moustache */}
      <circle cx="70" cy="34" r="17" fill={SKIN} stroke={INK} strokeWidth={2.5} />
      <path d="M53.6 29.5 A17 17 0 0 1 86.4 29.5 Q82 26.5 77 28 Q72 24.5 66 27.5 Q59 25.5 53.6 29.5 Z" fill={INK} />
      <path d="M66 27.5 q3.5 -4.5 7.5 -2.2" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M57.5 31 Q61.5 29.3 65 30.8" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M73 30.3 Q76.8 28.7 80.5 30.4" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      {/* eyes: closed while tasting */}
      {tasting ? (
        <path d="M59.5 35.5 Q61.5 37.6 63.5 35.5 M74.5 35.5 Q76.5 37.6 78.5 35.5" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      ) : (
        <>
          <circle cx="61.5" cy="35.5" r="1.8" fill={INK} />
          <circle cx="76.5" cy="35.5" r="1.8" fill={INK} />
        </>
      )}
      <path d="M69.5 33 Q68.5 37 69.8 39.5" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      {/* mouth: hidden behind the spoon while tasting; pressed when it won't land */}
      {!tasting &&
        (happy ? (
          <path d="M64.5 46 Q70 49.6 75.5 46" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        ) : (
          <path d="M65.5 47 L74.5 47" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        ))}

      {/* jacket, shirt, leaf neckerchief, waist apron with pocket */}
      <path
        d="M70 52.5 L87 59.5 Q94.5 62.5 95 71.5 L96.8 111 Q97.2 119.5 88.5 119.5 L51.5 119.5 Q42.8 119.5 43.2 111 L45 71.5 Q45.5 62.5 53 59.5 Z"
        fill={INK}
      />
      <path d="M62 57.5 L70 79 L78 57.5 Q74 54 70 53.5 Q66 54 62 57.5 Z" fill={CARD} />
      <path d="M61.5 56 L78.5 56 L70 69.5 Z" fill={LEAF} stroke={CARD} strokeWidth={2} strokeLinejoin="round" />
      <path d="M61.5 56 Q70 59.8 78.5 56" stroke={CARD} strokeWidth={1.6} />
      <path d="M55 97 L85 97 L84 119.5 L56 119.5 Z" fill={CARD} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M65 104 L65 110 Q65 112 67 112 L73 112 Q75 112 75 110 L75 104" stroke={INK} strokeWidth={1.4} />

      {/* left arm, always with the market notebook folded over the forearm */}
      <path d="M48 66 Q37 76 38.5 90 Q40 99.5 50 100.5" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M33.5 95.5 L33.5 119 L52.5 119 L52.5 95.5 Z" fill={CARD} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M33.5 100.5 L52.5 100.5" stroke={INK} strokeWidth={1.4} />
      <path d="M38 106 L48 106 M38 110 L46 110" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M38 114.5 c2 -3 3 -3 4 0 c1 2.4 2 2.2 3.6 0" stroke={LEAF} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="51" cy="100.5" r="5.2" fill={SKIN} stroke={INK} strokeWidth={2} />

      {/* trousers, shoes */}
      <path d="M57.5 119.5 L56.5 156 L66 156 L68 127 L72 127 L74 156 L83.5 156 L82.5 119.5 Z" fill={INK} />
      <path d="M56.5 156 Q53 162 59.5 162 L67 162 L66.6 156 Z" fill={INK} />
      <path d="M83.5 156 Q87 162 80.5 162 L73 162 L73.4 156 Z" fill={INK} />
    </svg>
  );
}
