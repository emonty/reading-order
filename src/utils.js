export function mod(a, b) {
  return ((a % b) + b) % b;
}

export function normalizeAngle(angle) {
  return mod(angle, 360);
}

export function angleDifference(a, b) {
  return mod(b - a + 180, 360) - 180;
}

export function isInInfoBox(element) {
  // Walk up the DOM tree to check if the element is inside an info-box
  let node = element;
  while (node) {
    if (node.classList && node.classList.contains('info-box')) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}
