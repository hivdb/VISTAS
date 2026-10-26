export default function showAlertOverlay(message) {
  if (typeof document === 'undefined') {
    return;
  }

  const text = message == null ? '' : String(message);
  const existing = document.getElementById('genbank-alert-overlay');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.id = 'genbank-alert-overlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0, 0, 0, 0.55)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '24px';
  overlay.style.zIndex = '9999';

  const panel = document.createElement('div');
  panel.style.background = '#fff';
  panel.style.color = '#111';
  panel.style.maxWidth = '720px';
  panel.style.width = '100%';
  panel.style.borderRadius = '6px';
  panel.style.padding = '16px 18px';
  panel.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';

  const body = document.createElement('div');
  body.textContent = text;
  body.style.whiteSpace = 'pre-wrap';
  body.style.fontSize = '1rem';
  body.style.lineHeight = '1.5';

  const hint = document.createElement('div');
  hint.textContent = 'Click anywhere to close.';
  hint.style.marginTop = '12px';
  hint.style.fontSize = '0.9rem';
  hint.style.color = '#555';

  panel.appendChild(body);
  panel.appendChild(hint);
  overlay.appendChild(panel);

  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}
