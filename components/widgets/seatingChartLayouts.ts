import { FurnitureItem } from '../../types';

const DESK_W = 80;
const DESK_H = 65;

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

// Columns layout: the teacher's "rows" input is really a column count.
// Each column is a vertical stack of desks; numColumns controls how many
// side-by-side columns are placed across the canvas.
export function generateColumnsLayout(
  numStudents: number,
  numColumns: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  if (numStudents <= 0 || numColumns <= 0) return [];

  const desksPerColumn = Math.ceil(numStudents / numColumns);
  const availW = canvasW - ROWS_MARGIN * 2;
  const availH = canvasH - ROWS_MARGIN * 2;

  // Spacing between desk top-left corners along each axis.
  // When there is only one column or one desk-per-column the spacing value
  // is unused — the branch below hard-codes a centred coordinate instead.
  const colSpacing =
    numColumns > 1 ? (availW - DESK_W) / (numColumns - 1) : availW / 2;
  const rowSpacing =
    desksPerColumn > 1 ? (availH - DESK_H) / (desksPerColumn - 1) : availH / 2;

  const items: FurnitureItem[] = [];
  let count = 0;

  // Outer loop = columns (x-axis); inner loop = desks within each column (y-axis).
  // "numColumns" therefore controls horizontal column count as teachers expect.
  for (let col = 0; col < numColumns && count < numStudents; col++) {
    const x = snapToGrid(
      numColumns === 1
        ? canvasW / 2 - DESK_W / 2
        : ROWS_MARGIN + col * colSpacing,
      gridSize
    );
    for (let row = 0; row < desksPerColumn && count < numStudents; row++) {
      const y = snapToGrid(
        desksPerColumn === 1
          ? canvasH / 2 - DESK_H / 2
          : ROWS_MARGIN + row * rowSpacing,
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

// Fixed 32-desk horseshoe: outer U = 6 left + 8 bottom + 6 right (20 desks),
// inner U = 4 left + 4 bottom + 4 right (12 desks).
// Side arms face inward (rotation 90° / 270°); bottom rows face up toward teacher (0°).
// The numStudents parameter is retained for API compatibility but is not used to
// determine desk count — teachers delete unneeded desks from the fixed layout.
export function generateHorseshoeLayout(
  _numStudents: number,
  canvasW: number,
  canvasH: number,
  gridSize: number
): FurnitureItem[] {
  // Fixed counts
  const OUTER_LEFT = 6;
  const OUTER_BOTTOM = 8;
  const OUTER_RIGHT = 6;
  const INNER_LEFT = 4;
  const INNER_BOTTOM = 4;
  const INNER_RIGHT = 4;

  const HORSESHOE_GAP = 90; // edge-to-edge gap between inner and outer U desks
  const TEACHER_AREA_MARGIN = 60; // vertical space reserved at top for teacher desk

  const items: FurnitureItem[] = [];

  // Place desks along a vertical arm, all at the same x, evenly spaced from
  // yStart to yEnd.  rotation: 90 = faces right (inward on left arm),
  //                            270 = faces left (inward on right arm).
  function placeVerticalArm(
    count: number,
    x: number,
    yStart: number,
    yEnd: number,
    rotation: number
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
        rotation,
      });
    }
  }

  // Place desks along a horizontal row, all at the same y, evenly spaced from
  // xStart to xEnd.  rotation: 0 = faces up (toward the teacher at the top).
  function placeHorizontalRow(
    count: number,
    y: number,
    xStart: number,
    xEnd: number,
    rotation: number
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
        rotation,
      });
    }
  }

  // Outer U bounds (opens upward — teacher at top)
  const outerLeft_x = HORSESHOE_MARGIN;
  const outerRight_x = canvasW - HORSESHOE_MARGIN - DESK_W;
  const outerTop_y = HORSESHOE_MARGIN + TEACHER_AREA_MARGIN;
  const outerBottom_y = canvasH - HORSESHOE_MARGIN - DESK_H;

  placeVerticalArm(OUTER_LEFT, outerLeft_x, outerTop_y, outerBottom_y, 90);
  placeVerticalArm(OUTER_RIGHT, outerRight_x, outerTop_y, outerBottom_y, 270);
  placeHorizontalRow(
    OUTER_BOTTOM,
    outerBottom_y,
    outerLeft_x + DESK_W + HORSESHOE_ARM_PADDING,
    outerRight_x - HORSESHOE_ARM_PADDING,
    0
  );

  // Inner U bounds — gap is measured edge-to-edge consistently on all sides
  const innerLeft_x = outerLeft_x + DESK_W + HORSESHOE_GAP;
  const innerRight_x = outerRight_x - DESK_W - HORSESHOE_GAP;
  const innerTop_y = outerTop_y + HORSESHOE_INNER_INSET;
  const innerBottom_y = outerBottom_y - DESK_H - HORSESHOE_GAP;

  placeVerticalArm(INNER_LEFT, innerLeft_x, innerTop_y, innerBottom_y, 90);
  placeVerticalArm(INNER_RIGHT, innerRight_x, innerTop_y, innerBottom_y, 270);
  placeHorizontalRow(
    INNER_BOTTOM,
    innerBottom_y,
    innerLeft_x + DESK_W + HORSESHOE_ARM_PADDING,
    innerRight_x - HORSESHOE_ARM_PADDING,
    0
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
