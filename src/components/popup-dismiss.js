const activePopups = new Map();

export function dismissOnPageMovement(popup) {
  const stop = () => {
    activePopups.get(popup)?.abort();
    activePopups.delete(popup);
  };
  popup.addEventListener('beforetoggle', event => {
    stop();
    if (event.newState !== 'open') return;
    const controller = new AbortController();
    activePopups.set(popup, controller);
    const dismiss = () => {
      if (popup.matches(':popover-open')) popup.hidePopover();
      stop();
    };
    // Scrolling inside a dropdown must not dismiss it.
    const outsideMovement = event => {
      if (!event.composedPath().includes(popup)) dismiss();
    };
    const options = { capture: true, passive: true, signal: controller.signal };
    document.addEventListener('scroll', outsideMovement, options);
    document.addEventListener('wheel', outsideMovement, options);
    document.addEventListener('touchmove', outsideMovement, options);
    window.addEventListener('resize', dismiss, options);
  });
}

export function closeActivePopups() {
  for (const [popup, controller] of activePopups) {
    controller.abort();
    if (popup.matches(':popover-open')) popup.hidePopover();
  }
  activePopups.clear();
}
