// Popups can live inside a <label>. Clicking their non-control content must
// not activate that label's trigger and accidentally toggle the popup shut.
export function protectPopupInteractions(popup) {
  popup.addEventListener('click', event => {
    event.stopPropagation();
    if (!event.target.closest('button, input, select, textarea, a')) event.preventDefault();
  });
  popup.addEventListener('pointerdown', event => {
    const range = event.target.closest('input[type="range"]');
    if (range && event.button === 0) range.setPointerCapture(event.pointerId);
  });
  popup.addEventListener('pointerup', event => {
    const range = event.target.closest('input[type="range"]');
    if (range?.hasPointerCapture(event.pointerId)) range.releasePointerCapture(event.pointerId);
  });
}
