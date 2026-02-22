import sys

file_path = 'components/common/DraggableWindow.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_block = '''  const handleTouchStart = (e: React.TouchEvent) => {
    gestureStartRef.current = {
      y: e.touches[0].clientY,
      touches: e.touches.length,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gestureStartRef.current) return;

    // If it started as a 2-finger touch
    if (gestureStartRef.current.touches === 2 && e.changedTouches.length > 0) {
      const deltaY = e.changedTouches[0].clientY - gestureStartRef.current.y;

      // If swiped down more than 60px
      if (deltaY > 60) {
        updateWidget(widget.id, { minimized: true, flipped: false });
        setShowTools(false);
      }
    }
    gestureStartRef.current = null;
  };'''

new_block = '''  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Use average Y for 2-finger gestures to avoid sequential touch bugs
      gestureStartRef.current = {
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        touches: 2,
      };
    } else if (e.touches.length === 1) {
      gestureStartRef.current = {
        y: e.touches[0].clientY,
        touches: 1,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gestureStartRef.current) return;

    // If it started as a 2-finger touch
    if (gestureStartRef.current.touches === 2 && e.changedTouches.length > 0) {
      const deltaY = e.changedTouches[0].clientY - gestureStartRef.current.y;

      // If swiped down more than 60px
      if (deltaY > 60) {
        updateWidget(widget.id, { minimized: true, flipped: false });
        setShowTools(false);
      }
    }
    gestureStartRef.current = null;
  };'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Successfully updated DraggableWindow.tsx")
else:
    print("Could not find the exact block to replace.")
    # Fallback: try to find handleTouchStart and handleTouchEnd individually or with regex if needed.
    # For now, let's see if exact match works. The formatting might be slightly off due to prettier.
