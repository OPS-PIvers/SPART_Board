// Centralized Z-Index Registry
// Defines the vertical stacking order of the application.
// Used in tailwind.config.js for utility classes and in components for inline styles.

export const Z_INDEX = {
  // Base layers
  base: 0,
  decorator: 10,
  content: 20,
  controls: 30,

  // Widget layers
  widget: 100, // Standard widget level (DraggableWindow uses this as base + widget.z)
  widgetDrag: 500, // Widget being dragged
  maximized: 900, // Maximized widget

  // System UI layers
  dock: 1000, // Dock bar
  sidebar: 1100, // Sidebar
  header: 1200, // Top navigation/header

  // Overlay layers
  backdrop: 9900, // Dimmed backgrounds
  modal: 10000, // Standard Modals (e.g. Settings, Reports)
  modalContent: 10001, // Content within modals (dropdowns etc)

  // Floating/Pop-up layers
  popover: 11000, // Popovers, Menus attached to elements
  toolMenu: 12000, // DraggableWindow specific tool menu
  tooltip: 13000, // Tooltips
  toast: 14000, // Toast notifications

  // Critical layers
  critical: 20000, // Overlays that must block everything (e.g. Dock expanded, Critical Errors)
  cursor: 21000, // Custom cursors
};
