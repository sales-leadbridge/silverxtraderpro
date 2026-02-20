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
// FIREBASE INITIALIZATION WITH ERROR HANDLING
// ═══════════════════════════════════════════════════════════
// NOTE: _serverTime collection is used for server-time accuracy.
// This is a secure pattern — no Cloud Functions needed.
// Firestore rules allow authenticated users to write to _serverTime.
try {
  firebase.initializeApp(firebaseConfig);
  
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // Configure Firestore settings for offline persistence
  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
  });
  
  // Enable offline persistence
  db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence only in first tab');
      } else if (err.code == 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence');
      }
    });
  
  // Make globally available (read-only)
  Object.defineProperty(window, 'db', {
    value: db,
    writable: false,
    configurable: false,
    enumerable: false
  });
  
  Object.defineProperty(window, 'auth', {
    value: auth,
    writable: false,
    configurable: false,
    enumerable: false
  });
  
  console.log('✅ Firebase initialized successfully');
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:20px;background:#F8FAFC;">
      <div style="background:#fff;padding:40px;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.1);max-width:500px;">
        <h1 style="color:#EF4444;font-size:28px;margin-bottom:16px;font-weight:800;">⚠️ System Error</h1>
        <p style="color:#64748B;font-size:16px;line-height:1.6;">Failed to initialize application. Please check your internet connection and refresh the page.</p>
        <button onclick="location.reload()" style="margin-top:24px;background:#0ea5e9;color:#fff;padding:14px 32px;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-size:14px;">Refresh Page</button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// ADVANCED SECURITY MONITORING SYSTEM
// ═══════════════════════════════════════════════════════════

(function() {
  'use strict';
  
  // ── PREVENT CONSOLE TAMPERING ──
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  const suspiciousPatterns = [
    /balance.*update/i,
    /increment.*balance/i,
    /db\.collection.*users.*update/i,
    /\.set\(.*balance/i,
    /firebase.*update/i,
    /firestore.*\.update/i,
    /vip.*true/i,
    /is_vip.*=.*true/i,
    /referrals.*increment/i,
    /referral.*bonus/i,
    /ref_code.*update/i,
    /\.update\(.*referrals/i,
    /processReferralBonus.*\(/i
  ];
  
  const securityLog = [];
  
  function checkSuspicious(args) {
    const str = args.join(' ');
    return suspiciousPatterns.some(pattern => pattern.test(str));
  }
  
  function logSecurityEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    securityLog.push(event);
    
    // Log to Firestore if user is authenticated
    if (window.auth && window.auth.currentUser && window.db) {
      window.db.collection('security_logs').add({
        user_id: window.auth.currentUser.uid,
        email: window.auth.currentUser.email,
        event_type: type,
        event_data: data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user_agent: navigator.userAgent,
        ip_attempt: true
      }).catch(err => console.error('Security log failed:', err));
    }
  }
  
  // Override console methods
  console.log = function(...args) {
    if (checkSuspicious(args)) {
      logSecurityEvent('SUSPICIOUS_CONSOLE', args.join(' '));
      console.warn('⚠️ SECURITY ALERT: Suspicious console activity detected and logged');
    }
    return originalConsole.log.apply(console, args);
  };
  
  // ── PREVENT FIRESTORE DIRECT MANIPULATION ──
  // NOTE: Security is enforced at the Firestore Rules level (server-side).
  // Client-side monitoring logs suspicious activity for admin review.
  // We do NOT freeze db since it breaks legitimate operations. Auth is frozen.
  
  if (window.auth) {
    Object.freeze(window.auth);
  }
  // db is intentionally NOT frozen — freezing it breaks .collection() calls
  // Server-side Firestore Rules are the real security layer
  
  // ── DEVELOPER TOOLS DETECTION ──
  let devToolsOpen = false;
  const devToolsThreshold = 160;
  
  function checkDevTools() {
    const widthThreshold = window.outerWidth - window.innerWidth > devToolsThreshold;
    const heightThreshold = window.outerHeight - window.innerHeight > devToolsThreshold;
    
    if ((widthThreshold || heightThreshold) && !devToolsOpen) {
      devToolsOpen = true;
      logSecurityEvent('DEV_TOOLS_OPENED', 'Developer tools detected');
      console.warn('%c⚠️ SECURITY NOTICE', 'color:red;font-size:20px;font-weight:bold;');
      console.warn('%cDeveloper tools detected - All actions are monitored and logged', 'color:orange;font-size:14px;');
    } else if (!widthThreshold && !heightThreshold) {
      devToolsOpen = false;
    }
  }
  
  setInterval(checkDevTools, 1000);
  
  // ── DEBUGGER DETECTION ──
  setInterval(function() {
    const start = new Date();
    debugger;
    const end = new Date();
    if (end - start > 100) {
      logSecurityEvent('DEBUGGER_DETECTED', 'Debugger breakpoint detected');
    }
  }, 3000);
  
  // ── RIGHT-CLICK PROTECTION ──
  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('input, textarea, [contenteditable="true"]')) {
      e.preventDefault();
      logSecurityEvent('RIGHT_CLICK_ATTEMPT', e.target.tagName);
    }
  });
  
  // ── COPY PROTECTION FOR SENSITIVE DATA ──
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection().toString();
    if (selection.includes('$') || selection.match(/\d+\.\d{2}/) || selection.toLowerCase().includes('balance')) {
      logSecurityEvent('SENSITIVE_DATA_COPIED', selection.substring(0, 50));
    }
  });
  
  // ── PREVENT TEXT SELECTION ON SENSITIVE ELEMENTS ──
  document.addEventListener('selectstart', (e) => {
    if (e.target.classList.contains('no-select') || 
        e.target.closest('.balance-display') || 
        e.target.closest('.vip-badge')) {
      e.preventDefault();
    }
  });
  
  // ── DETECT DOM MANIPULATION ──
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.classList && (target.classList.contains('balance-display') || 
              target.id === 'user-balance' || 
              target.classList.contains('vip-badge') ||
              target.id === 'ref-count' ||
              target.id === 'sidebar-refs' ||
              target.id === 'ref-earnings')) {
            logSecurityEvent('DOM_MANIPULATION', `Target: ${target.id || target.className}`);
            console.warn('⚠️ SECURITY: Suspicious DOM manipulation detected on:', target.id || target.className);
          }
        }
      });
    });
    
    // Start observing when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-value', 'data-balance', 'data-referrals']
      });
    });
  }
  
  // ── SCRIPT INJECTION DETECTION (log only, don't block — Firebase SDK creates scripts internally) ──
  // NOTE: We cannot override createElement because Firebase SDK itself creates script tags.
  // Instead, we use MutationObserver to detect dynamically injected script tags with suspicious src.
  const TRUSTED_SCRIPT_DOMAINS = [
    'gstatic.com', 'googleapis.com', 'firebaseapp.com', 'firebase.com',
    'cdn.tailwindcss.com', 'unpkg.com', 'fonts.googleapis.com',
    'cdnjs.cloudflare.com', 'effectivegatecpm.com', 'wa.me',
    'highperformanceformat.com', 'pl28642599.effectivegatecpm.com',
    'pl28756295.effectivegatecpm.com', 'pl28642600.effectivegatecpm.com'
  ];
  
  if (window.MutationObserver) {
    const scriptObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src) {
            const isTrusted = TRUSTED_SCRIPT_DOMAINS.some(d => node.src.includes(d));
            if (!isTrusted) {
              logSecurityEvent('SUSPICIOUS_SCRIPT_INJECTION', node.src.substring(0, 100));
            }
          }
        });
      });
    });
    document.addEventListener('DOMContentLoaded', () => {
      scriptObserver.observe(document.head || document.documentElement, { childList: true, subtree: true });
    });
  }
  
  // ── MONITOR NETWORK REQUESTS (only truly external, suspicious domains) ──
  const TRUSTED_FETCH_DOMAINS = [
    'firebaseapp.com', 'googleapis.com', 'gstatic.com',
    'firebase.com', 'effectivegatecpm.com', 'highperformanceformat.com'
  ];
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
    if (url) {
      const isTrusted = TRUSTED_FETCH_DOMAINS.some(d => url.includes(d));
      if (!isTrusted && url.startsWith('http')) {
        logSecurityEvent('EXTERNAL_FETCH_REQUEST', url.substring(0, 100));
      }
    }
    return originalFetch.apply(this, args);
  };
  
  // ── REFERRAL SYSTEM PROTECTION ──
  let referralProcessCount = 0;
  const MAX_REFERRAL_ATTEMPTS = 3;
  
  window.processReferralBonus = new Proxy(window.processReferralBonus || function(){}, {
    apply: function(target, thisArg, argumentsList) {
      referralProcessCount++;
      
      if(referralProcessCount > MAX_REFERRAL_ATTEMPTS) {
        logSecurityEvent('REFERRAL_ABUSE', `Excessive referral processing attempts: ${referralProcessCount}`);
        console.error('⚠️ SECURITY: Too many referral processing attempts detected');
        return Promise.resolve();
      }
      
      logSecurityEvent('REFERRAL_PROCESSING', `Code: ${argumentsList[0] || 'N/A'}`);
      return target.apply(thisArg, argumentsList);
    }
  });
  
  // ── EXPOSE SECURITY LOG (READ-ONLY) FOR DEBUGGING ──
  Object.defineProperty(window, 'securityLog', {
    get: () => [...securityLog],
    set: () => {
      logSecurityEvent('SECURITY_LOG_TAMPERING', 'Attempt to modify security log');
      console.error('❌ Security log is read-only');
    },
    configurable: false
  });
  
})();

// ═══════════════════════════════════════════════════════════
// USER-FRIENDLY SECURITY WARNINGS
// ═══════════════════════════════════════════════════════════

console.log('%c⛔ STOP!', 'color:red;font-size:60px;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.3);');
console.log('%c⚠️ SECURITY WARNING', 'color:red;font-size:32px;font-weight:bold;');
console.log('%cDO NOT paste any code here!', 'color:orange;font-size:20px;font-weight:bold;');
console.log('%cScammers may trick you into running malicious code to steal your account and funds.', 'color:orange;font-size:16px;');
console.log('%cIf someone told you to copy/paste something here, you are being scammed!', 'color:red;font-size:16px;font-weight:bold;');
console.log('%cAll console activity is monitored and logged.', 'color:#0ea5e9;font-size:14px;font-weight:bold;');

// ═══════════════════════════════════════════════════════════
// AUTO-BOOTSTRAP: On first launch, auto-create Firestore config
// So admin never needs to manually set anything in Firebase Console
// ═══════════════════════════════════════════════════════════
(function() {
  const BOOTSTRAP_VERSION = 'v2.0';
  
  async function autoBootstrap() {
    try {
      const configRef = window.db.collection('config').doc('platform');
      const snap = await configRef.get();
      
      // Only write if not exists OR bootstrap_version is old
      if (!snap.exists || snap.data().bootstrap_version !== BOOTSTRAP_VERSION) {
        const existingData = snap.exists ? snap.data() : {};
        await configRef.set({
          // Defaults — only set if not already customized
          vip_price:               existingData.vip_price               ?? 199,
          investment_roi:          existingData.investment_roi           ?? 15,
          ref_bonus_free:          existingData.ref_bonus_free           ?? 1.00,
          ref_bonus_vip:           existingData.ref_bonus_vip            ?? 2.00,
          referral_commission_rate:existingData.referral_commission_rate ?? 0.03,
          ad_reward:               existingData.ad_reward                ?? 2.00,
          earn_transfer_min:       existingData.earn_transfer_min        ?? 120,
          withdrawal_min:          existingData.withdrawal_min           ?? 10,
          deposit_min:             existingData.deposit_min              ?? 10,
          withdrawals_frozen:      existingData.withdrawals_frozen       ?? false,
          maintenance_mode:        existingData.maintenance_mode         ?? false,
          // Wallet addresses (admin changes these in admin panel)
          wallet_binance:          existingData.wallet_binance           ?? '403009858',
          wallet_trc20:            existingData.wallet_trc20             ?? 'TGzsm8guzbaBsbNa9JLPR3WTRzFRy6B6FG',
          // Meta
          bootstrap_version: BOOTSTRAP_VERSION,
          bootstrapped_at: firebase.firestore.FieldValue.serverTimestamp(),
          platform_name: 'Silver X Trader',
          platform_version: '2.0'
        }, { merge: true });
        console.log('✅ Platform config auto-bootstrapped');
      }
    } catch(e) {
      // Silent fail — config will use hardcoded defaults
    }
  }

  // Run after auth is ready
  if (window.auth) {
    window.auth.onAuthStateChanged(user => {
      if (user) autoBootstrap();
    });
  }
})();

// ═══════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════

if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log('⚡ Performance:', {
          loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
          domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms'
        });
      }
    }, 0);
  });
}
