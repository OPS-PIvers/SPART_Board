/**
 * LibraryGrid — dnd-kit `SortableContext` wrapper for the library surface.
 *
 * Presentational only: it does not own item state. Consumers pass their
 * (already-ordered) items and a `renderCard` callback, and the grid wires
 * up the `DndContext` + `SortableContext` + `DragOverlay` around them.
 *
 * Drag is auto-disabled when `dragDisabled === true`. When `reorderLocked`
 * is set (but drag isn't fully disabled), drag handles are rendered at
 * reduced opacity with an explanatory tooltip from `reorderLockedReason`
 * — this is surfaced to cards via `LibraryGridLockContext`.
 *
 * The grid renders `emptyState` in place of the list when `items.length === 0`.
 */

import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { LibraryGridProps } from './types';
import { LibraryGridLockContext } from './LibraryGridLockContext';

export function LibraryGrid<TItem>(props: LibraryGridProps<TItem>) {
  const {
    items,
    getId,
    renderCard,
    onReorder,
    dragDisabled = false,
    reorderLocked = false,
    reorderLockedReason,
    layout = 'grid',
    emptyState,
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const ids = useMemo(() => items.map(getId), [items, getId]);
  const activeItem = useMemo(
    () =>
      activeId == null
        ? null
        : (items.find((i) => getId(i) === activeId) ?? null),
    [activeId, items, getId]
  );
  const activeIndex = useMemo(
    () => (activeItem == null ? -1 : items.indexOf(activeItem)),
    [activeItem, items]
  );

  const lockState = useMemo(
    () => ({
      locked: reorderLocked,
      reason: reorderLocked ? reorderLockedReason : undefined,
      dragDisabled,
    }),
    [reorderLocked, reorderLockedReason, dragDisabled]
  );

  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!onReorder) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = [...ids];
    const [moved] = next.splice(oldIndex, 1);
    if (moved === undefined) return;
    next.splice(newIndex, 0, moved);

    void Promise.resolve(onReorder(next));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const isListLayout = layout === 'list';
  const strategy = isListLayout
    ? verticalListSortingStrategy
    : rectSortingStrategy;

  const containerClass = isListLayout
    ? 'flex flex-col gap-3'
    : 'grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <LibraryGridLockContext.Provider value={lockState}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={ids} strategy={strategy}>
          <div className={containerClass} data-testid="library-grid">
            {items.map((item, index) => renderCard(item, index))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeItem != null ? (
            <LibraryGridLockContext.Provider
              value={{ locked: false, reason: undefined, dragDisabled: true }}
            >
              {renderCard(activeItem, activeIndex)}
            </LibraryGridLockContext.Provider>
          ) : null}
        </DragOverlay>
      </DndContext>
    </LibraryGridLockContext.Provider>
  );
}
