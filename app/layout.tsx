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
    const IDLE_THRESHOLD_MS = 1500;
    const IGNORE_SELECTOR = 'input[type="password"], input[data-matomo-ignore], textarea[data-matomo-ignore]';

    function sendEvent(category, action, name, value){
      try {
        window._paq = window._paq || [];
        if(value !== undefined) window._paq.push(['trackEvent', category, action, name, Number(value)]);
        else window._paq.push(['trackEvent', category, action, name]);
      } catch(e){ console.warn('Matomo not ready', e); }
    }

    function safeFieldId(el){
      return el.name || el.id || (el.tagName + ':' + Math.random().toString(36).slice(2,8));
    }

    function instrumentField(el){
      if (!el || el.matches(IGNORE_SELECTOR)) return;
      const id = safeFieldId(el);
      let focusStart=0, backspaces=0, keystrokes=0, lastKeyTs=0, idleTimer=null;

      el.addEventListener('focus', ()=> {
        focusStart = Date.now();
        backspaces = 0; keystrokes = 0; lastKeyTs = Date.now();
        sendEvent('Input Field','Focus',id);
      });

      el.addEventListener('keydown',(e)=>{
        lastKeyTs = Date.now();
        if(e.key==='Backspace') backspaces++;
        if(e.key && e.key.length===1) keystrokes++;
        if(idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(()=>{
          const idleMs = Date.now()-lastKeyTs;
          sendEvent('Input Field','Idle',id,idleMs);
        },IDLE_THRESHOLD_MS);
      });

      el.addEventListener('blur',()=>{
        if(idleTimer) clearTimeout(idleTimer);
        const dwell = Date.now()-focusStart;
        sendEvent('Input Field','Blur',id,dwell);
        if(backspaces>0) sendEvent('Input Field','Backspace Count',id,backspaces);
        if(keystrokes>0) sendEvent('Input Field','Keystrokes',id,keystrokes);
      });
    }

    function instrumentAll(){
      const inputs = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea');
      inputs.forEach(instrumentField);
    }

    document.addEventListener('DOMContentLoaded', instrumentAll);
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
