// Visual-only: traditional Taiwan-style xiangqi board lines (grid, palace, flower marks, double border).
// Coordinates: column 0..8, row 0..9 map to cell centres of a 9x10 CSS grid.
const flowerPoints: Array<[number, number]> = [
  [1, 2], [7, 2], [1, 7], [7, 7],
  [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
  [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
];

function flower(c: number, r: number) {
  const g = 0.09, l = 0.22, parts: string[] = [];
  for (const dx of [-1, 1]) {
    if ((dx < 0 && c === 0) || (dx > 0 && c === 8)) continue;
    for (const dy of [-1, 1]) {
      const x = c + dx * g, y = r + dy * g;
      parts.push(`M${x + dx * l} ${y} L${x} ${y} L${x} ${y + dy * l}`);
    }
  }
  return parts.join(" ");
}

export function TaiwanBoardLines() {
  const lines: string[] = [];
  for (let r = 0; r <= 9; r++) lines.push(`M0 ${r} L8 ${r}`);
  lines.push("M0 0 L0 9", "M8 0 L8 9");
  for (let c = 1; c <= 7; c++) lines.push(`M${c} 0 L${c} 4`, `M${c} 5 L${c} 9`);
  lines.push("M3 0 L5 2 M5 0 L3 2 M3 7 L5 9 M5 7 L3 9");
  return (
    <svg className="tw-lines" viewBox="-0.5 -0.5 9 10" preserveAspectRatio="none" aria-hidden="true">
      <rect className="tw-outer" x="-0.2" y="-0.2" width="8.4" height="9.4" />
      <path className="tw-grid" d={lines.join(" ")} />
      <path className="tw-flower" d={flowerPoints.map(([c, r]) => flower(c, r)).join(" ")} />
    </svg>
  );
}

export function TaiwanRiver() {
  return (
    <div className="tw-river" aria-hidden="true">
      <span>楚<i /> 河</span>
      <span>漢<i /> 界</span>
    </div>
  );
}
