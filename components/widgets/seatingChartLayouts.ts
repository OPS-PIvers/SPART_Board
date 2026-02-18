import { FurnitureItem } from '../../types';

const DESK_W = 60;
const DESK_H = 50;

// Named layout constants — keeps geometry calculations self-documenting
// and ensures a single place to adjust spacing if desk sizes change.
const ROWS_MARGIN = 40; // canvas edge margin for rows layout
const HORSESHOE_MARGIN = 30; // canvas edge margin for horseshoe layout
const HORSESHOE_ARM_PADDING = 20; // padding between vertical arm ends and horizontal row
const HORSESHOE_INNER_INSET = 20; // how far inner U top is below outer U top
const PODS_MARGIN = 30; // canvas edge margin for pods layout
const PODS_HEADER_OFFSET = 40; // extra top offset so pods don't crowd the top edge

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
  const availW = canvasW - ROWS_MARGIN * 2;
  const availH = canvasH - ROWS_MARGIN * 2;

  // Spacing between desk top-left corners along each axis.
  // When there is only one row or one column the spacing value is unused —
  // the position branches below hard-code a centred coordinate instead.
  const colSpacing =
    desksPerRow > 1 ? (availW - DESK_W) / (desksPerRow - 1) : availW / 2;
  const rowSpacing =
    numRows > 1 ? (availH - DESK_H) / (numRows - 1) : availH / 2;

  const items: FurnitureItem[] = [];
  let count = 0;

  // Outer loop = rows (y-axis); inner loop = desks within each row (x-axis).
  // "numRows" therefore controls vertical row count as teachers expect.
  for (let row = 0; row < numRows && count < numStudents; row++) {
    const y = snapToGrid(
      numRows === 1 ? canvasH / 2 - DESK_H / 2 : ROWS_MARGIN + row * rowSpacing,
      gridSize
    );
    for (let col = 0; col < desksPerRow && count < numStudents; col++) {
      const x = snapToGrid(
        desksPerRow === 1
          ? canvasW / 2 - DESK_W / 2
          : ROWS_MARGIN + col * colSpacing,
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
  const HORSESHOE_GAP = 90; // edge-to-edge gap between inner and outer U desks
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

  const items: FurnitureItem[] = [];

  // Outer U — opens toward the top (teacher is at top)
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
  const outerLeft_x = HORSESHOE_MARGIN;
  const outerRight_x = canvasW - HORSESHOE_MARGIN - DESK_W;
  const outerTop_y = HORSESHOE_MARGIN + TEACHER_AREA_MARGIN;
  const outerBottom_y = canvasH - HORSESHOE_MARGIN - DESK_H;

  placeVerticalArm(outerLeft, outerLeft_x, outerTop_y, outerBottom_y);
  placeVerticalArm(outerRight, outerRight_x, outerTop_y, outerBottom_y);
  placeHorizontalRow(
    outerBottom,
    outerBottom_y,
    outerLeft_x + DESK_W + HORSESHOE_ARM_PADDING,
    outerRight_x - HORSESHOE_ARM_PADDING
  );

  // Inner U bounds — gap is measured edge-to-edge consistently on all sides:
  //   innerLeft_x  + DESK_W + HORSESHOE_GAP = outerLeft_x  (left edge of outer left arm)  ← left
  //   innerRight_x + DESK_W + HORSESHOE_GAP = outerRight_x (right edge → left edge gap)    ← right
  //   innerBottom_y + DESK_H + HORSESHOE_GAP = outerBottom_y                               ← bottom
  const innerLeft_x = outerLeft_x + DESK_W + HORSESHOE_GAP;
  const innerRight_x = outerRight_x - DESK_W - HORSESHOE_GAP;
  const innerTop_y = outerTop_y + HORSESHOE_INNER_INSET;
  const innerBottom_y = outerBottom_y - DESK_H - HORSESHOE_GAP;

  placeVerticalArm(innerLeft, innerLeft_x, innerTop_y, innerBottom_y);
  placeVerticalArm(innerRight, innerRight_x, innerTop_y, innerBottom_y);
  placeHorizontalRow(
    innerBottom,
    innerBottom_y,
    innerLeft_x + DESK_W + HORSESHOE_ARM_PADDING,
    innerRight_x - HORSESHOE_ARM_PADDING
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
  const podGapInner = 10; // gap between desks within a pod
  const podW = DESK_W * 2 + podGapInner;
  const podH = DESK_H * 2 + podGapInner;
  const podGapOuter = 40; // gap between pods

  const availW = canvasW - PODS_MARGIN * 2;

  const podsPerRow = Math.max(
    1,
    Math.floor((availW + podGapOuter) / (podW + podGapOuter))
  );

  const totalGridW = podsPerRow * podW + (podsPerRow - 1) * podGapOuter;
  const startX = Math.max(PODS_MARGIN, (canvasW - totalGridW) / 2);
  const startY = PODS_MARGIN + PODS_HEADER_OFFSET;

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
