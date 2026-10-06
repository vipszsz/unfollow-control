// Apply the saved theme before first paint so there is no flash.
try { const t = localStorage.getItem('uc.theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t } catch {}
