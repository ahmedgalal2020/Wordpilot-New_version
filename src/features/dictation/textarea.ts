export function revealRangeInTextarea(textarea: HTMLTextAreaElement, range: { start: number; end: number }) {
  textarea.focus({ preventScroll: true });
  textarea.setSelectionRange(range.start, range.end);
  const selectionPosition = getTextareaSelectionPosition(textarea, range.start);

  if (selectionPosition) {
    textarea.scrollTop = Math.max(0, selectionPosition.top - textarea.clientHeight / 2 + selectionPosition.height);
  }
}

export function syncOverlayScroll(textarea: HTMLTextAreaElement, overlay: HTMLDivElement | null) {
  if (!overlay) {
    return;
  }

  overlay.scrollTop = textarea.scrollTop;
  overlay.scrollLeft = textarea.scrollLeft;
}

export function getTextareaSelectionPosition(textarea: HTMLTextAreaElement, characterIndex: number) {
  const mirror = document.createElement('div');
  const computedStyle = window.getComputedStyle(textarea);

  for (const property of [
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'whiteSpace',
  ] as const) {
    mirror.style[property] = computedStyle[property];
  }

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.pointerEvents = 'none';
  mirror.style.left = '-9999px';
  mirror.style.top = '0';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';

  mirror.textContent = textarea.value.slice(0, characterIndex);

  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(characterIndex, characterIndex + 1) || ' ';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const position = {
    top: marker.offsetTop,
    left: marker.offsetLeft,
    height: marker.offsetHeight || parseFloat(computedStyle.lineHeight) || 28,
  };

  document.body.removeChild(mirror);
  return position;
}
