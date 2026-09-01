/* PhoneApp — shell: toolbar, swipe carousel between airports, screen navigation.
   window.PhoneApp({ variant, initialMode }) */
(function () {
  const { useState, useRef, useLayoutEffect, useEffect } = React;
  const AV = window.AV;

  function ToolButton({ t, onClick, children }) {
    return (
      <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: t.variant === 'deck' ? t.radChip : 999,
        background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center',
        boxShadow: t.dark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>{children}</button>
    );
  }

  // Brief STATIC brand splash on every open (logo + tagline). No entrance or flight
  // animation — it just shows, then fades out into the app.
  function Splash({ t, phase }) {
    // Same white-airplane glyph as the Android launcher icon, on the icon's navy.
    const plane = "M21,16v-2l-8,-5V3.5C13,2.67 12.33,2 11.5,2S10,2.67 10,3.5V9l-8,5v2l8,-2.5V19l-2,1.5V22l3.5,-1 3.5,1v-1.5L13,19v-5.5l8,2.5z";
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 120,
        background: 'radial-gradient(125% 85% at 50% 32%, #143a57 0%, #0b1b2b 56%, #06111c 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: phase === 'out' ? 0 : 1, transition: 'opacity .35s ease', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 96, height: 96, borderRadius: 26, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(160deg, #17354f, #0b1f2f)', border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 16px 44px rgba(0,0,0,0.5)' }}>
            <svg width="52" height="52" viewBox="0 0 24 24"><path fill="#fff" d={plane} /></svg>
          </div>
          <div style={{ font: `800 23px ${t.display}`, color: '#fff', letterSpacing: -0.3 }}>TAFCast</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 30px)',
          font: `600 13px ${t.body}`, letterSpacing: 1.2, color: 'rgba(255,255,255,0.55)' }}>
          By pilots, for pilots
        </div>
      </div>
    );
  }

  function PhoneApp({ variant, initialMode = 'dark', initialIndex = 0, accent }) {
    // Initialize state from localStorage if available
    const [mode, setMode] = useState(() => {
      try { return localStorage.getItem('av_mode') || initialMode; } catch(e) { return initialMode; }
    });
    const [saved, setSaved] = useState(() => {
      try {
        const stored = localStorage.getItem('av_saved');
        return stored ? JSON.parse(stored) : [...AV.saved];
      } catch(e) { return [...AV.saved]; }
    });
    const [index, setIndex] = useState(initialIndex);
    const [raw, setRaw] = useState(() => {
      try { return localStorage.getItem('av_raw') === 'true'; } catch(e) { return false; }
    });
    // Opt-in: fall back to the nearest reporting airport when a field has no METAR.
    const [nearest, setNearest] = useState(() => {
      try { return localStorage.getItem('av_use_nearest') === 'true'; } catch(e) { return false; }
    });
    // In-app backend URL override (e.g. your deployed HTTPS server). Empty = built-in.
    const [apiOverride, setApiOverride] = useState(() => {
      try { return localStorage.getItem('av_api_base') || ''; } catch(e) { return ''; }
    });
    const [screen, setScreen] = useState(null);  // null | 'manage' | 'widget' | 'alerts'
    const [sheet, setSheet] = useState(false);
    const [legalOpen, setLegalOpen] = useState(false); // Terms/Privacy overlay (top layer)
    const [splash, setSplash] = useState('in'); // brand splash: 'in' | 'out' | 'done'
    // First-run onboarding / disclaimer. Tied to the legal version, so a future update to
    // the terms re-prompts for acceptance. Also re-openable from Settings ▸ About.
    const LEGAL_VERSION = (window.AV_LEGAL && window.AV_LEGAL.version) || '1.0';
    const [showIntro, setShowIntro] = useState(() => {
      try { return localStorage.getItem('av_legal_accepted') !== LEGAL_VERSION; } catch (e) { return true; }
    });
    const dismissIntro = () => { try { localStorage.setItem('av_legal_accepted', LEGAL_VERSION); } catch (e) {} setShowIntro(false); };
    // Fade the brand splash out shortly after open, then unmount it.
    useEffect(() => {
      const t1 = setTimeout(() => setSplash('out'), 1300); // begin fade-out
      const t2 = setTimeout(() => setSplash('done'), 1650); // unmount (~1.6s total)
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    // Hydrate last-known weather from device storage so cards show instantly / offline.
    const [apiData, setApiData] = useState(() => {
      try { return JSON.parse(localStorage.getItem('av_weather_cache')) || {}; } catch(e) { return {}; }
    });
    const [, setUnitsVer] = useState(0); // bump to re-render when units change

    // Persist successfully-fetched briefings to the device (skip errors / loading placeholders).
    useEffect(() => {
      try {
        const clean = {};
        Object.keys(apiData).forEach(k => {
          const d = apiData[k];
          if (d && !d.error && !d.isLoading) clean[k] = d;
        });
        localStorage.setItem('av_weather_cache', JSON.stringify(clean));
      } catch(e) {}
    }, [apiData]);

    const t = window.makeTheme(variant, mode);
    if (accent) t.accent = accent;
    
    // Save to localStorage when state changes
    useEffect(() => { try { localStorage.setItem('av_mode', mode); } catch(e) {} }, [mode]);
    useEffect(() => { try { localStorage.setItem('av_saved', JSON.stringify(saved)); } catch(e) {} }, [saved]);
    useEffect(() => { try { localStorage.setItem('av_raw', String(raw)); } catch(e) {} }, [raw]);
    useEffect(() => { try { localStorage.setItem('av_use_nearest', String(nearest)); } catch(e) {} }, [nearest]);
    useEffect(() => {
      try { if (apiOverride) localStorage.setItem('av_api_base', apiOverride); else localStorage.removeItem('av_api_base'); } catch(e) {}
      if (window.AV_syncWidget) window.AV_syncWidget(); // keep widget/alerts on the same backend
    }, [apiOverride]);

    useEffect(() => { if (index >= saved.length) setIndex(Math.max(0, saved.length - 1)); }, [saved, index]);

    // Publish saved airports + backend URL + widget settings to the native widget.
    useEffect(() => { if (window.AV_syncWidget) window.AV_syncWidget(); }, [saved]);
    
    // Refresh live data for saved airports on open / when the list changes.
    // Cached (already-good) data stays on screen until fresh data arrives, and a
    // failed fetch never clobbers good cached data — so the app works offline.
    useEffect(() => {
      saved.forEach(icao => {
        fetch(`${AV.apiBase()}/api/weather/${icao}?nearest=${nearest ? 1 : 0}`)
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              if (window.AV.rememberAirports) window.AV.rememberAirports([{ icao, name: data.name, city: data.city, category: data.category, country: data.country }]);
              setApiData(prev => ({ ...prev, [icao]: data }));
            } else {
              // Backend returned an explicit error object (e.g. 404/500).
              // Only surface it if we have nothing good cached for this airport.
              setApiData(prev => (prev[icao] && !prev[icao].error)
                ? prev : ({ ...prev, [icao]: { icao, error: true, name: icao } }));
            }
          })
          .catch(err => {
             console.error('Error fetching live data:', err);
             // Network error — keep cached data if we have it.
             setApiData(prev => (prev[icao] && !prev[icao].error)
               ? prev : ({ ...prev, [icao]: { icao, error: true, networkError: true, name: icao } }));
          });
      });
    }, [saved, nearest, apiOverride]);

    // ---- carousel ----
    const wrapRef = useRef(null);
    const [W, setW] = useState(402);
    const [dragX, setDragX] = useState(0);
    const [anim, setAnim] = useState(false);
    const drag = useRef({ x0: 0, y0: 0, axis: null, active: false });

    useLayoutEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const set = () => setW(el.clientWidth);
      set();
      const ro = new ResizeObserver(set); ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const n = saved.length;
    const at = (off) => {
      const icao = saved[((index + off) % n) + (((index + off) % n) < 0 ? n : 0)];
      const md = AV.meta(icao);
      // Never fall back to bundled sample weather in the shipped (native) app — only
      // live data, otherwise a loading placeholder. (Browser preview may use samples.)
      return apiData[icao] || (!window.AV_NATIVE && AV.airports[icao])
        || { icao, isLoading: true, category: 'VFR', name: md.name || 'Loading…', city: md.city || '' };
    };
    const prevAp = at(-1), curAp = at(0), nextAp = at(1);

    const onDown = (e) => {
      if (anim || n < 2) return;
      const p = e.touches ? e.touches[0] : e;
      drag.current = { x0: p.clientX, y0: p.clientY, axis: null, active: true };
    };
    const onMove = (e) => {
      const d = drag.current; if (!d.active) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - d.x0, dy = p.clientY - d.y0;
      if (!d.axis) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) d.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      }
      if (d.axis === 'h') {
        if (e.cancelable) e.preventDefault();
        setDragX(Math.max(-W, Math.min(W, dx)));
      }
    };
    const commit = (target, after) => { setAnim(true); setDragX(target); setTimeout(() => { after(); setAnim(false); setDragX(0); }, 270); };
    const onUp = () => {
      const d = drag.current; if (!d.active) return; d.active = false;
      if (d.axis !== 'h') return;
      const th = W * 0.22;
      if (dragX <= -th) commit(-W, () => setIndex(i => (i + 1) % n));
      else if (dragX >= th) commit(W, () => setIndex(i => (i - 1 + n) % n));
      else commit(0, () => {});
    };

    const Card = variant === 'deck' ? window.CardDeck : window.CardBriefing;
    const page = (ap) => (
      <div style={{ flex: `0 0 ${W}px`, width: W }}>
        <Card ap={ap} t={t} raw={raw} setRaw={setRaw} />
      </div>
    );

    return (
      <window.IOSDevice dark={mode === 'dark'}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.page,
          fontFamily: t.body, position: 'relative' }}>
          {/* toolbar */}
          <div style={{ padding: window.AV_NATIVE ? '10px 14px 10px' : 'calc(env(safe-area-inset-top, 0px) + 12px) 14px 10px', display: 'flex', alignItems: 'center',
            background: t.page, position: 'relative', zIndex: 6 }}>
            <ToolButton t={t} onClick={() => setScreen('manage')}>{window.Icon.menu({ size: 21, color: t.text, stroke: 2 })}</ToolButton>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 7 }}>
              {saved.map((c, i) => {
                const catColor = AV.cat((apiData[c] && apiData[c].category) || AV.meta(c).category).color;
                return (
                  <button key={c} onClick={() => setIndex(i)} style={{ all: 'unset', cursor: 'pointer', padding: 4 }}>
                    <span style={{ display: 'block', width: i === index ? 20 : 7, height: 7, borderRadius: 7,
                      background: i === index ? catColor : t.line, transition: 'all .2s' }} />
                  </button>
                );
              })}
            </div>
            <ToolButton t={t} onClick={() => setSheet(true)}>{window.Icon.gear({ size: 21, color: t.text, stroke: 2 })}</ToolButton>
          </div>

          {/* carousel */}
          <div ref={wrapRef} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', width: W * 3, transform: `translateX(${-W + dragX}px)`,
              transition: anim ? 'transform .27s cubic-bezier(.25,.8,.3,1)' : 'none' }}>
              {page(prevAp)}{page(curAp)}{page(nextAp)}
            </div>
          </div>

          {/* overlay screens */}
          {screen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, animation: 'screenIn .26s cubic-bezier(.2,.8,.2,1)' }}>
              {screen === 'manage' && (
                <window.Screens.ManageAirports t={t} saved={saved}
                  onAdd={(c) => setSaved(s => [...s, c])}
                  onRemove={(c) => setSaved(s => s.length > 1 ? s.filter(x => x !== c) : s)}
                  onReorder={(i, dir) => setSaved(s => { const j = i + dir; if (j < 0 || j >= s.length) return s; const a = [...s]; [a[i], a[j]] = [a[j], a[i]]; return a; })}
                  onSelect={(i) => { setIndex(i); setScreen(null); }}
                  onClose={() => setScreen(null)} />
              )}
              {screen === 'widget' && <window.Screens.WidgetConfig t={t} saved={saved} apiData={apiData} onClose={() => setScreen(null)} />}
              {screen === 'alerts' && <window.Screens.AlertsScreen t={t} onClose={() => setScreen(null)} />}
            </div>
          )}

          {/* settings sheet */}
          {sheet && (
            <window.Screens.SettingsSheet t={t} mode={mode} setMode={setMode} raw={raw} setRaw={setRaw}
              nearest={nearest} setNearest={setNearest}
              apiOverride={apiOverride} setApiOverride={setApiOverride}
              onUnitsChange={() => setUnitsVer(v => v + 1)}
              onOpenAirports={() => { setSheet(false); setScreen('manage'); }}
              onOpenWidget={() => { setSheet(false); setScreen('widget'); }}
              onOpenAlerts={() => { setSheet(false); setScreen('alerts'); }}
              onOpenAbout={() => { setSheet(false); setShowIntro(true); }}
              onOpenLegal={() => setLegalOpen(true)}
              onClose={() => setSheet(false)} />
          )}

          {/* First-run onboarding + disclaimer (tops everything) */}
          {showIntro && <window.Screens.Onboarding t={t} onDone={dismissIntro} onShowLegal={() => setLegalOpen(true)} />}

          {/* Legal (Terms / Privacy) — top layer so it works over Settings and onboarding */}
          {legalOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 100, animation: 'screenIn .26s cubic-bezier(.2,.8,.2,1)' }}>
              <window.Screens.LegalScreen t={t} onClose={() => setLegalOpen(false)} />
            </div>
          )}

          {/* Brand splash on open (tops everything) */}
          {splash !== 'done' && <Splash t={t} phase={splash} />}
        </div>
      </window.IOSDevice>
    );
  }

  window.PhoneApp = PhoneApp;
})();

