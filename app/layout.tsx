import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <Script id="matomo" strategy="afterInteractive">{`
          var _paq = window._paq = window._paq || [];
          /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
            var u="https://matomo.np-vipanan.sahaj.ai/";
            _paq.push(['setTrackerUrl', u+'matomo.php']);
            _paq.push(['setSiteId', '2']);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
          })();
        `}</Script>
        <Script id="matomo-input-tracker" strategy="afterInteractive">{`
(function(){
  // ---- config ----
  const IDLE_THRESHOLD_MS = 1500;
  const IGNORE_SELECTOR = 'input[type="password"], input[data-matomo-ignore], textarea[data-matomo-ignore]';
  const SCAN_RETRY_MS = 500;      // how often to retry initial scans
  const SCAN_RETRY_COUNT = 8;     // how many retries (total ~ SCAN_RETRY_MS * SCAN_RETRY_COUNT)
  // -----------------

  // avoid loading twice
  if (window.__matomo_instrumentation_loaded__) {
    console.debug('matomo-instrumentation: already loaded');
    return;
  }
  window.__matomo_instrumentation_loaded__ = true;

  // safe _paq sender
  function sendEvent(category, action, name, value){
    try {
      window._paq = window._paq || [];
      if (value !== undefined) window._paq.push(['trackEvent', category, action, name, Number(value)]);
      else window._paq.push(['trackEvent', category, action, name]);
      console.debug('matomo-instrumentation: queued event', {category, action, name, value});
    } catch (err) {
      console.warn('matomo-instrumentation: _paq not available', err);
    }
  }

  function safeFieldId(el){
    return el.getAttribute('data-field-id') || el.name || el.id || (el.tagName + ':' + Math.random().toString(36).slice(2,8));
  }

  // marker to avoid double-attaching
  const ATTACHED_FLAG = '__matomo_attached__';

  function instrumentField(el){
    try {
      if (!el || el.matches(IGNORE_SELECTOR)) return false;
      if (el[ATTACHED_FLAG]) return false;
      el[ATTACHED_FLAG] = true;

      const id = safeFieldId(el);
      let focusStart = 0;
      let backspaces = 0;
      let keystrokes = 0;
      let lastKeyTs = 0;
      let idleTimer = null;

      function onFocus(){
        focusStart = Date.now();
        backspaces = 0; keystrokes = 0; lastKeyTs = Date.now();
        sendEvent('Input Field','Focus',id);
        console.debug('matomo-instrumentation: focus attached', id);
      }

      function onKeyDown(e){
        lastKeyTs = Date.now();
        if (e.key === 'Backspace') backspaces++;
        if (e.key && e.key.length === 1) keystrokes++;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(()=>{
          const idleMs = Date.now() - lastKeyTs;
          sendEvent('Input Field','Idle',id,idleMs);
          console.debug('matomo-instrumentation: idle', id, idleMs);
        }, IDLE_THRESHOLD_MS);
      }

      function onBlur(){
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        const dwell = Date.now() - focusStart;
        sendEvent('Input Field','Blur',id,dwell);
        if (backspaces > 0) sendEvent('Input Field','Backspace Count',id,backspaces);
        if (keystrokes > 0) sendEvent('Input Field','Keystrokes',id,keystrokes);
        console.debug('matomo-instrumentation: blur fired', id, {dwell, backspaces, keystrokes});
      }

      el.addEventListener('focus', onFocus, true);
      el.addEventListener('keydown', onKeyDown, true);
      el.addEventListener('blur', onBlur, true);

      return true;
    } catch (err) {
      console.error('matomo-instrumentation: instrumentField error', err);
      return false;
    }
  }

  function instrumentAll(){
    const inputs = Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea, [contenteditable="true"]'));
    let attached = 0;
    inputs.forEach(i => { if (instrumentField(i)) attached++; });
    console.debug('matomo-instrumentation: instrumentAll attached count', attached, 'total scanned', inputs.length);
    return attached;
  }

  // Observe DOM for dynamically added inputs (works with React)
  const observer = new MutationObserver(muts=>{
    muts.forEach(m=>{
      m.addedNodes && m.addedNodes.forEach(node => {
        try {
          if (node.nodeType !== 1) return;
          if (node.matches && (node.matches('input,textarea,[contenteditable="true"]') || node.querySelector('input,textarea,[contenteditable="true"]'))) {
            instrumentAll();
          }
        } catch(e){ /* ignore */ }
      });
    });
  });

  // start observer after DOM ready
  function startObserver(){
    try {
      observer.observe(document.body, { childList: true, subtree: true });
      console.debug('matomo-instrumentation: mutation observer started');
    } catch (err) {
      console.warn('matomo-instrumentation: observer failed', err);
    }
  }

  // initial periodic scans (cover case when inputs mount after DOMContentLoaded)
  let retries = 0;
  const retryInterval = setInterval(()=>{
    const added = instrumentAll();
    if (retries === 0 && added > 0) {
      // okay we found inputs early; still start observer
      startObserver();
    }
    retries++;
    if (retries >= SCAN_RETRY_COUNT) {
      clearInterval(retryInterval);
      startObserver();
      console.debug('matomo-instrumentation: initial scan attempts finished');
    }
  }, SCAN_RETRY_MS);

  // expose helpers for manual testing from console
  window.__instrumentAll = instrumentAll;
  window.__matomo_instrumentation_retry = ()=> { instrumentAll(); observer.disconnect(); startObserver(); };

  // also handle single page app route changes (Next.js); listen to pushState/replaceState
  (function(){
    const origPush = history.pushState;
    history.pushState = function(){
      origPush.apply(this, arguments);
      // run scan after a tick
      setTimeout(instrumentAll, 100);
    };
    const origReplace = history.replaceState;
    history.replaceState = function(){
      origReplace.apply(this, arguments);
      setTimeout(instrumentAll, 100);
    };
    window.addEventListener('popstate', ()=> setTimeout(instrumentAll, 100));
  })();

  console.debug('matomo-instrumentation: loaded');
})();

`}</Script>
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
