const firebaseConfig = {
  apiKey: "AIzaSyCFeZCVi3bnRYlL78M4vIAe4h-_3a0VRyU",
  authDomain: "silver-x-trader.firebaseapp.com",
  projectId: "silver-x-trader",
  storageBucket: "silver-x-trader.firebasestorage.app",
  messagingSenderId: "239715343845",
  appId: "1:239715343845:web:a72cce9be116b1d0ae230c",
  measurementId: "G-Z1D1NSRKCV"
};

// ═══════════════════════════════════════════════════════════
// FIREBASE INITIALIZATION
// ═══════════════════════════════════════════════════════════
try {
  firebase.initializeApp(firebaseConfig);
  const db   = firebase.firestore();
  const auth = firebase.auth();

  db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') console.warn('Multiple tabs — persistence limited to first tab');
    else if (err.code === 'unimplemented')   console.warn('Browser does not support offline persistence');
  });

  Object.defineProperty(window, 'db',   { value: db,   writable: false, configurable: false, enumerable: false });
  Object.defineProperty(window, 'auth', { value: auth, writable: false, configurable: false, enumerable: false });

} catch (error) {
  console.error('Firebase init failed:', error);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px;background:#F8FAFC;">
      <div style="background:#fff;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:500px;">
        <h1 style="color:#EF4444;font-size:28px;margin-bottom:16px;font-weight:800;">⚠️ Connection Error</h1>
        <p style="color:#64748B;font-size:16px;line-height:1.6;">Failed to initialize. Check your internet and refresh.</p>
        <button onclick="location.reload()" style="margin-top:24px;background:#0ea5e9;color:#fff;padding:14px 32px;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;">Refresh</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════
// SECURITY MONITORING
// ═══════════════════════════════════════════════════════════
(function () {
  'use strict';

  console.log('%c⛔ STOP!', 'color:red;font-size:60px;font-weight:bold;');
  console.log('%c⚠️ DO NOT paste any code here!', 'color:red;font-size:22px;font-weight:bold;');
  console.log('%cScammers trick you into pasting code to steal your account. All activity is logged.', 'color:orange;font-size:15px;');

  if (window.auth) Object.freeze(window.auth);

  function logSecEvent(type, data) {
    try {
      if (window.auth && window.auth.currentUser && window.db) {
        window.db.collection('security_logs').add({
          user_id:    window.auth.currentUser.uid,
          email:      window.auth.currentUser.email,
          event_type: type,
          event_data: String(data).substring(0, 200),
          timestamp:  firebase.firestore.FieldValue.serverTimestamp(),
          user_agent: navigator.userAgent.substring(0, 150)
        }).catch(() => {});
      }
    } catch (_) {}
  }

  // Suspicious console pattern detection
  const badPatterns = [/db\.collection/i, /\.update\(/i, /balance.*=/, /is_vip.*true/i, /earn_wallet/i, /firebase.*set\(/i];
  const origLog = console.log;
  console.log = function (...args) {
    const str = args.map(String).join(' ');
    if (badPatterns.some(p => p.test(str))) {
      logSecEvent('SUSPICIOUS_CONSOLE', str.substring(0, 150));
      console.warn('⚠️ Suspicious activity detected and logged.');
    }
    return origLog.apply(console, args);
  };

  // DevTools detection
  let devOpen = false;
  setInterval(() => {
    const w = window.outerWidth  - window.innerWidth  > 160;
    const h = window.outerHeight - window.innerHeight > 160;
    if ((w || h) && !devOpen) { devOpen = true;  logSecEvent('DEV_TOOLS_OPENED', 'detected'); }
    else if (!w && !h)        { devOpen = false; }
  }, 1500);

  // Right-click log
  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('input, textarea')) logSecEvent('RIGHT_CLICK', e.target.tagName);
  });

  // DOM tampering on balance elements
  if (window.MutationObserver) {
    const WATCHED = new Set(['header-bal','wallet-balance','earn-wallet-balance','sidebar-balance','sidebar-earn','ref-count']);
    const obs = new MutationObserver((muts) => {
      muts.forEach((m) => { if (m.target.id && WATCHED.has(m.target.id)) logSecEvent('DOM_TAMPER', `id:${m.target.id}`); });
    });
    document.addEventListener('DOMContentLoaded', () => {
      obs.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    });
  }

  // Script injection detection
  const TRUSTED_DOMAINS = [
    'gstatic.com','googleapis.com','firebaseapp.com','firebase.com',
    'cdn.tailwindcss.com','unpkg.com','fonts.googleapis.com','cdnjs.cloudflare.com',
    'effectivegatecpm.com','highperformanceformat.com','wa.me'
  ];
  if (window.MutationObserver) {
    const sObs = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.tagName === 'SCRIPT' && n.src && !TRUSTED_DOMAINS.some(d => n.src.includes(d)))
            logSecEvent('SCRIPT_INJECT', n.src.substring(0, 100));
        });
      });
    });
    document.addEventListener('DOMContentLoaded', () => {
      sObs.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  // Fetch monitoring
  const TRUSTED_FETCH = ['firebaseapp.com','googleapis.com','gstatic.com','firebase.com','effectivegatecpm.com','highperformanceformat.com'];
  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    if (url && url.startsWith('http') && !TRUSTED_FETCH.some(d => url.includes(d)))
      logSecEvent('EXT_FETCH', url.substring(0, 100));
    return origFetch.apply(this, args);
  };

  // Read-only security log
  const _secLog = [];
  Object.defineProperty(window, 'securityLog', {
    get: () => [..._secLog],
    set: () => logSecEvent('LOG_TAMPER', 'tried to overwrite securityLog'),
    configurable: false
  });

})();

// ═══════════════════════════════════════════════════════════
// AUTO-BOOTSTRAP — First-run platform config
// Admin emails NOT stored here (verified via admin_roles collection)
// ═══════════════════════════════════════════════════════════
(function () {
  const BOOTSTRAP_VERSION = 'v2.1';

  async function autoBootstrap() {
    try {
      const ref  = window.db.collection('config').doc('platform');
      const snap = await ref.get();
      if (!snap.exists || snap.data().bootstrap_version !== BOOTSTRAP_VERSION) {
        const ex = snap.exists ? snap.data() : {};
        await ref.set({
          vip_price:                ex.vip_price                ?? 199,
          investment_roi:           ex.investment_roi           ?? 15,
          ref_bonus_free:           ex.ref_bonus_free           ?? 1.00,
          ref_bonus_vip:            ex.ref_bonus_vip            ?? 2.00,
          referral_commission_rate: ex.referral_commission_rate ?? 0.03,
          ad_reward:                ex.ad_reward                ?? 2.00,
          ad_claim_daily_limit:     ex.ad_claim_daily_limit     ?? 3,
          earn_transfer_min:        ex.earn_transfer_min        ?? 120,
          withdrawal_min:           ex.withdrawal_min           ?? 10,
          deposit_min:              ex.deposit_min              ?? 10,
          withdrawals_frozen:       ex.withdrawals_frozen       ?? false,
          maintenance_mode:         ex.maintenance_mode         ?? false,
          wallet_binance:           ex.wallet_binance           ?? '403009858',
          wallet_trc20:             ex.wallet_trc20             ?? 'TGzsm8guzbaBsbNa9JLPR3WTRzFRy6B6FG',
          bootstrap_version:        BOOTSTRAP_VERSION,
          bootstrapped_at:          firebase.firestore.FieldValue.serverTimestamp(),
          platform_name:            'Silver X Trader',
          platform_version:         '2.1'
        }, { merge: true });
      }
    } catch (_) {}
  }

  // Verify admin via admin_roles collection (server-side) — no emails in client code
  if (window.auth) {
    window.auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const adminDoc = await window.db.collection('admin_roles').doc(user.uid).get();
        if (adminDoc.exists && adminDoc.data().is_admin === true) autoBootstrap();
      } catch (_) {}
    });
  }
})();

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const p = performance.getEntriesByType('navigation')[0];
      if (p) console.log(`⚡ Load: ${Math.round(p.loadEventEnd - p.fetchStart)}ms`);
    }, 0);
  });
}
