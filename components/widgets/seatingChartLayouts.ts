import { FurnitureItem } from '../../types';

const DESK_W = 60;
const DESK_H = 50;

function snapToGrid(val: number, gridSize: number): number {
  return Math.round(val / gridSize) * gridSize;
}

export function generateRowsLayout(
  numStudents: number,
  numRows: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0 || numRows <= 0) return [];

  const desksPerRow = Math.ceil(numStudents / numRows);
  const margin = 40;
  const availW = canvasW - margin * 2;
  const availH = canvasH - margin * 2;

  // Inter-column and inter-row spacing between desk top-left corners.
  // The single-item fallback value (availW/2 or availH/2) is never used
  // in layout: when numRows===1 or desksPerRow===1 the x/y branches below
  // hard-code a centred position instead of referencing these variables.
  const colSpacing =
    numRows > 1 ? (availW - DESK_W) / (numRows - 1) : availW / 2;
  const rowSpacing =
    desksPerRow > 1 ? (availH - DESK_H) / (desksPerRow - 1) : availH / 2;

  const items: FurnitureItem[] = [];
  let count = 0;

  for (let col = 0; col < numRows && count < numStudents; col++) {
    const x = snapToGrid(
      numRows === 1 ? canvasW / 2 - DESK_W / 2 : margin + col * colSpacing,
      gridSize
    );
    for (let row = 0; row < desksPerRow && count < numStudents; row++) {
      const y = snapToGrid(
        desksPerRow === 1
          ? canvasH / 2 - DESK_H / 2
          : margin + row * rowSpacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x,
        y,
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
      count++;
    }
  }

  return items;
}

export function generateHorseshoeLayout(
  numStudents: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0) return [];

  const MIN_INNER_HORSESHOE_COUNT = 3;
  const HORSESHOE_GAP = 90; // pixel gap between inner and outer U walls
  const TEACHER_AREA_MARGIN = 60; // vertical space reserved at top for teacher desk

  // Inner U is ~35% of students, outer U is ~65%.
  // Capped at numStudents so outerCount never goes negative with small classes.
  const innerCount = Math.min(
    numStudents,
    Math.max(MIN_INNER_HORSESHOE_COUNT, Math.round(numStudents * 0.35))
  );
  const outerCount = numStudents - innerCount;

  // Distribute each U as left-bottom-right
  function distributeU(total: number): [number, number, number] {
    const side = Math.floor(total / 3);
    return [side, total - 2 * side, side]; // [left, bottom, right]
  }

  const [outerLeft, outerBottom, outerRight] = distributeU(outerCount);
  const [innerLeft, innerBottom, innerRight] = distributeU(innerCount);

  const margin = 30;
  const gap = HORSESHOE_GAP;
  const items: FurnitureItem[] = [];

  // Outer U — opens toward the top (teacher is at top)
  // Left arm: vertical column on left side
  // Right arm: vertical column on right side
  // Bottom: horizontal row at the bottom

  function placeVerticalArm(
    count: number,
    x: number,
    yStart: number,
    yEnd: number
  ) {
    if (count <= 0) return;
    const spacing = count > 1 ? (yEnd - yStart) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const y = snapToGrid(
        count === 1 ? (yStart + yEnd) / 2 : yStart + i * spacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x: snapToGrid(x, gridSize),
        y,
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  function placeHorizontalRow(
    count: number,
    y: number,
    xStart: number,
    xEnd: number
  ) {
    if (count <= 0) return;
    const spacing = count > 1 ? (xEnd - xStart) / (count - 1) : 0;
    for (let i = 0; i < count; i++) {
      const x = snapToGrid(
        count === 1 ? (xStart + xEnd) / 2 : xStart + i * spacing,
        gridSize
      );
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x,
        y: snapToGrid(y, gridSize),
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  // Outer U bounds
  const outerLeft_x = margin;
  const outerRight_x = canvasW - margin - DESK_W;
  const outerTop_y = margin + TEACHER_AREA_MARGIN;
  const outerBottom_y = canvasH - margin - DESK_H;

  placeVerticalArm(outerLeft, outerLeft_x, outerTop_y, outerBottom_y);
  placeVerticalArm(outerRight, outerRight_x, outerTop_y, outerBottom_y);
  placeHorizontalRow(
    outerBottom,
    outerBottom_y,
    outerLeft_x + DESK_W + 20,
    outerRight_x - 20
  );

  // Inner U bounds (inset by gap from outer)
  const innerLeft_x = outerLeft_x + DESK_W + gap;
  const innerRight_x = outerRight_x - gap;
  const innerTop_y = outerTop_y + 20;
  const innerBottom_y = outerBottom_y - gap;

  placeVerticalArm(innerLeft, innerLeft_x, innerTop_y, innerBottom_y);
  placeVerticalArm(innerRight, innerRight_x, innerTop_y, innerBottom_y);
  placeHorizontalRow(
    innerBottom,
    innerBottom_y,
    innerLeft_x + DESK_W + 20,
    innerRight_x - 20
  );

  return items;
}

export function generatePodsLayout(
  numStudents: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0) return [];

  const fullPods = Math.floor(numStudents / 4);
  const remainder = numStudents % 4;
  const numPods = fullPods + (remainder > 0 ? 1 : 0);

  // Pod is 2x2 arrangement of desks
  const podGapInner = 10; // gap between desks within pod
  const podW = DESK_W * 2 + podGapInner;
  const podH = DESK_H * 2 + podGapInner;
  const podGapOuter = 40; // gap between pods

  const margin = 30;
  const availW = canvasW - margin * 2;

  const podsPerRow = Math.max(
    1,
    Math.floor((availW + podGapOuter) / (podW + podGapOuter))
  );

  const totalGridW = podsPerRow * podW + (podsPerRow - 1) * podGapOuter;
  const startX = Math.max(margin, (canvasW - totalGridW) / 2);
  const startY = margin + 40;

  // 2x2 desk offsets: top-left, top-right, bottom-left, bottom-right
  const podDeskOffsets = [
    { dx: 0, dy: 0 },
    { dx: DESK_W + podGapInner, dy: 0 },
    { dx: 0, dy: DESK_H + podGapInner },
    { dx: DESK_W + podGapInner, dy: DESK_H + podGapInner },
  ];

  const items: FurnitureItem[] = [];

  for (let pi = 0; pi < numPods; pi++) {
    const podRow = Math.floor(pi / podsPerRow);
    const podCol = pi % podsPerRow;
    const podX = startX + podCol * (podW + podGapOuter);
    const podY = startY + podRow * (podH + podGapOuter);

    const isLast = pi === numPods - 1 && remainder > 0;
    const desksInThisPod = isLast ? remainder : 4;

    for (let di = 0; di < desksInThisPod; di++) {
      items.push({
        id: crypto.randomUUID(),
        type: 'desk',
        x: snapToGrid(podX + podDeskOffsets[di].dx, gridSize),
        y: snapToGrid(podY + podDeskOffsets[di].dy, gridSize),
        width: DESK_W,
        height: DESK_H,
        rotation: 0,
      });
    }
  }

  return items;
}
