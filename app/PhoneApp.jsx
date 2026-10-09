/* PhoneApp — shell: toolbar, swipe carousel between airports, screen navigation.
   window.PhoneApp({ variant, initialMode }) */
(function () {
  const { useState, useRef, useLayoutEffect, useEffect } = React;
  const AV = window.AV;

  function ToolButton({ t, onClick, children }) {
    const [pressed, setPressed] = useState(false);
    return (
      <button onClick={onClick}
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerCancel={() => setPressed(false)}
        style={{ all: 'unset', cursor: 'pointer', width: 40, height: 40, borderRadius: t.variant === 'deck' ? t.radChip : 999,
        WebkitTapHighlightColor: 'transparent',
        background: pressed ? (t.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : t.surface,
        transform: pressed ? 'scale(0.92)' : 'none',
        transition: 'transform 0.12s ease, background 0.12s ease',
        border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center',
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
          <img src="./icon-192.png" width="96" height="96" alt="TAFCast" style={{ borderRadius: 26, boxShadow: '0 16px 44px rgba(0,0,0,0.5)', display: 'block' }} />
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
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 3 && parsed[0] === 'LPBJ' && parsed[1] === 'LPCS' && parsed[2] === 'LPEV') {
            return ['LPPT'];
          }
          return parsed;
        }
        return [...AV.saved];
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
    const dismissIntro = () => {
      try { localStorage.setItem('av_legal_accepted', LEGAL_VERSION); } catch (e) {}
      setShowIntro(false);
    };
    const closeScreen = () => {
      setScreen(null);
    };
    // Handle Android system swipe-back / back button identically to the in-app < Back button.
    useEffect(() => {
      window.AV_handleBack = () => {
        if (legalOpen) {
          setLegalOpen(false);
          return true;
        }
        if (showIntro) {
          dismissIntro();
          return true;
        }
        if (screen) {
          closeScreen();
          return true;
        }
        if (sheet) {
          setSheet(false);
          return true;
        }
        return false;
      };
      return () => { delete window.AV_handleBack; };
    });
    // Fade the brand splash out shortly after open, then unmount it.
    useEffect(() => {
      const t1 = setTimeout(() => setSplash('out'), 1300); // begin fade-out
      const t2 = setTimeout(() => setSplash('done'), 1650); // unmount (~1.6s total)
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    // Hydrate last-known weather from device storage so cards show instantly / offline.
    const [apiData, setApiData] = useState(() => {
      try {
        const rawCache = JSON.parse(localStorage.getItem('av_weather_cache')) || {};
        // Sanitize cache: guarantee official stations never retain corrupted ipmaEma / syntheticTaf
        Object.keys(rawCache).forEach(k => {
          if (AV.isOfficialStation && AV.isOfficialStation(k) && rawCache[k]) {
            rawCache[k].ipmaEma = null;
            rawCache[k].syntheticTaf = null;
            if (rawCache[k].metarSource === 'IPMA') rawCache[k].metarSource = 'OFFICIAL';
          }
        });
        return rawCache;
      } catch(e) { return {}; }
    });
    const [, setUnitsVer] = useState(0); // bump to re-render when units change

    // Persist successfully-fetched briefings to the device (skip errors / loading placeholders).
    useEffect(() => {
      try {
        const clean = {};
        Object.keys(apiData).forEach(k => {
          const d = apiData[k];
          if (d && !d.error && !d.isLoading) {
            const item = { ...d };
            if (AV.isOfficialStation && AV.isOfficialStation(k)) {
              item.ipmaEma = null;
              item.syntheticTaf = null;
              if (item.metarSource === 'IPMA') item.metarSource = 'OFFICIAL';
            }
            clean[k] = item;
          }
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
              if (AV.isOfficialStation && AV.isOfficialStation(icao)) {
                data.ipmaEma = null;
                data.syntheticTaf = null;
                if (data.metarSource === 'IPMA') data.metarSource = 'OFFICIAL';
              }
              if (window.AV.rememberAirports) window.AV.rememberAirports([{ icao, name: data.name, city: data.city, category: data.category, country: data.country }]);
              setApiData(prev => {
                if (!data.notams || !data.notams.length) {
                  const existing = (prev[icao] && prev[icao].notams && prev[icao].notams.length)
                    ? prev[icao].notams
                    : (AV.airports[icao] && AV.airports[icao].notams);
                  if (existing && existing.length) data.notams = existing;
                }
                return { ...prev, [icao]: data };
              });
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
    const trackRef = useRef(null);
    const pillRef = useRef(null);
    const slot0Ref = useRef(null);
    const slot1Ref = useRef(null);
    const slot2Ref = useRef(null);
    const scrollPositions = useRef({});
    const [W, setW] = useState(() => (typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 402));
    const drag = useRef({ x0: 0, y0: 0, t0: 0, lastX: 0, lastT: 0, vx: 0, dx: 0, axis: null, active: false });
    const isTransitioning = useRef(false);

    useLayoutEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const set = () => {
        const width = el.clientWidth;
        setW(width);
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translate3d(${-width}px, 0, 0)`;
        }
      };
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

    const getCatColor = (icao) => {
      if (!icao) return '#34c759';
      return AV.cat((apiData[icao] && apiData[icao].category) || (AV.meta(icao) && AV.meta(icao).category) || 'VFR').color;
    };
    const curIcao = saved[index] || saved[0];
    const curCatColor = getCatColor(curIcao);

    useLayoutEffect(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform = `translate3d(${-W}px, 0, 0)`;
      }
      if (pillRef.current) {
        pillRef.current.style.transition = 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.24s ease';
        pillRef.current.style.transform = `translate3d(${index * 22}px, 0, 0)`;
        pillRef.current.style.background = curCatColor;
      }
      if (slot1Ref.current && curAp) {
        slot1Ref.current.scrollTop = scrollPositions.current[curAp.icao] || 0;
      }
      if (slot0Ref.current && prevAp) {
        slot0Ref.current.scrollTop = scrollPositions.current[prevAp.icao] || 0;
      }
      if (slot2Ref.current && nextAp) {
        slot2Ref.current.scrollTop = scrollPositions.current[nextAp.icao] || 0;
      }
      isTransitioning.current = false;
    }, [index, W, curCatColor]);

    const onDown = (e) => {
      if (isTransitioning.current || n < 2) return;
      const p = e.touches ? e.touches[0] : e;
      const now = Date.now();
      drag.current = {
        x0: p.clientX,
        y0: p.clientY,
        t0: now,
        lastX: p.clientX,
        lastT: now,
        vx: 0,
        dx: 0,
        axis: null,
        active: true
      };
      if (trackRef.current) {
        trackRef.current.style.transition = 'none';
      }
      if (pillRef.current) {
        pillRef.current.style.transition = 'none';
      }
      if (slot0Ref.current && prevAp) {
        slot0Ref.current.scrollTop = scrollPositions.current[prevAp.icao] || 0;
      }
      if (slot2Ref.current && nextAp) {
        slot2Ref.current.scrollTop = scrollPositions.current[nextAp.icao] || 0;
      }
    };

    const onMove = (e) => {
      const d = drag.current;
      if (!d.active) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - d.x0;
      const dy = p.clientY - d.y0;
      if (!d.axis) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          d.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        }
      }
      if (d.axis === 'h') {
        if (e.cancelable) e.preventDefault();
        const now = Date.now();
        const dt = now - d.lastT;
        if (dt > 10) {
          d.vx = (p.clientX - d.lastX) / dt;
          d.lastX = p.clientX;
          d.lastT = now;
        }
        d.dx = dx;
        const curDx = Math.max(-W, Math.min(W, dx));
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-W + curDx}px, 0, 0)`;
        }
        if (pillRef.current && n > 1) {
          pillRef.current.style.transition = 'none';
          const progress = -curDx / W; // dragging left advances towards next dot
          let pillPos = index + progress;
          if (pillPos < 0) pillPos = pillPos * 0.25;
          else if (pillPos > n - 1) pillPos = (n - 1) + (pillPos - (n - 1)) * 0.25;
          pillRef.current.style.transform = `translate3d(${pillPos * 22}px, 0, 0)`;
        }
      }
    };

    const onUp = () => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      if (d.axis !== 'h') return;

      const dx = d.dx;
      const vx = d.vx;
      const isFlick = Math.abs(vx) > 0.30 && Math.abs(dx) > 20;
      let target = 0;
      let nextIndex = index;

      if ((isFlick && vx < 0) || (!isFlick && dx <= -W * 0.22)) {
        target = -W;
        nextIndex = (index + 1) % n;
      } else if ((isFlick && vx > 0) || (!isFlick && dx >= W * 0.22)) {
        target = W;
        nextIndex = (index - 1 + n) % n;
      } else {
        target = 0;
      }

      if (trackRef.current) {
        isTransitioning.current = true;
        trackRef.current.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
        trackRef.current.style.transform = `translate3d(${-W + target}px, 0, 0)`;

        if (pillRef.current) {
          const targetColor = getCatColor(saved[nextIndex]);
          pillRef.current.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.22s ease';
          pillRef.current.style.transform = `translate3d(${nextIndex * 22}px, 0, 0)`;
          pillRef.current.style.background = targetColor;
        }

        setTimeout(() => {
          if (target !== 0) {
            setIndex(nextIndex);
          } else {
            if (trackRef.current) {
              trackRef.current.style.transition = 'none';
              trackRef.current.style.transform = `translate3d(${-W}px, 0, 0)`;
            }
            isTransitioning.current = false;
          }
        }, 220);
      }
    };

    const Card = variant === 'deck' ? window.CardDeck : window.CardBriefing;
    const page = (ap, slotRef) => (
      <div
        ref={slotRef}
        onScroll={(e) => {
          if (ap && ap.icao) scrollPositions.current[ap.icao] = e.target.scrollTop;
        }}
        style={{
          flex: `0 0 ${W}px`,
          width: W,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch'
        }}
      >
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
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 24 }}>
                {saved.map((c, i) => (
                  <button key={c} onClick={() => { if (!isTransitioning.current && i !== index) setIndex(i); }}
                    style={{ all: 'unset', cursor: 'pointer', width: 22, height: 24, display: 'grid', placeItems: 'center',
                      WebkitTapHighlightColor: 'transparent' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: t.line }} />
                  </button>
                ))}
                {/* Fluid sliding active indicator pill */}
                <div ref={pillRef} style={{
                  position: 'absolute',
                  left: 1,
                  top: '50%',
                  marginTop: -3.5,
                  width: 20,
                  height: 7,
                  borderRadius: 7,
                  background: curCatColor,
                  pointerEvents: 'none',
                  transform: `translate3d(${index * 22}px, 0, 0)`,
                  transition: 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.24s ease',
                  boxShadow: t.dark ? '0 1px 4px rgba(0,0,0,0.35)' : '0 1px 3px rgba(0,0,0,0.12)'
                }} />
              </div>
            </div>
            <ToolButton t={t} onClick={() => setSheet(true)}>{window.Icon.gear({ size: 21, color: t.text, stroke: 2 })}</ToolButton>
          </div>

          {/* carousel */}
          <div ref={wrapRef} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} onTouchCancel={onUp}
            style={{ flex: 1, overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}>
            <div ref={trackRef} style={{ display: 'flex', width: W * 3, height: '100%', transform: `translate3d(${-W}px, 0, 0)`,
              willChange: 'transform' }}>
              {page(prevAp, slot0Ref)}
              {page(curAp, slot1Ref)}
              {page(nextAp, slot2Ref)}
            </div>
          </div>

          {/* settings sheet */}
          {sheet && (
            <window.Screens.SettingsSheet t={t} mode={mode} setMode={setMode} raw={raw} setRaw={setRaw}
              nearest={nearest} setNearest={setNearest}
              apiOverride={apiOverride} setApiOverride={setApiOverride}
              onUnitsChange={() => setUnitsVer(v => v + 1)}
              onOpenAirports={() => setScreen('manage')}
              onOpenWidget={() => setScreen('widget')}
              onOpenAlerts={() => setScreen('alerts')}
              onOpenAbout={() => setShowIntro(true)}
              onOpenLegal={() => setLegalOpen(true)}
              onClose={() => setSheet(false)} />
          )}

          {/* overlay screens (layered above settings sheet for seamless navigation) */}
          {screen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 90, willChange: 'transform, opacity', animation: 'screenIn .20s cubic-bezier(.16,1,.3,1)' }}>
              {screen === 'manage' && (
                <window.Screens.ManageAirports t={t} saved={saved} apiData={apiData}
                  onAdd={(c) => setSaved(s => [...s, c])}
                  onRemove={(c) => setSaved(s => s.length > 1 ? s.filter(x => x !== c) : s)}
                  onReorder={(i, dir) => setSaved(s => { const j = i + dir; if (j < 0 || j >= s.length) return s; const a = [...s]; [a[i], a[j]] = [a[j], a[i]]; return a; })}
                  onSelect={(i) => { setIndex(i); setScreen(null); setSheet(false); }}
                  onClose={closeScreen} />
              )}
              {screen === 'widget' && <window.Screens.WidgetConfig t={t} saved={saved} apiData={apiData} onClose={closeScreen} />}
              {screen === 'alerts' && <window.Screens.AlertsScreen t={t} onClose={closeScreen} />}
            </div>
          )}

          {/* First-run onboarding + disclaimer (tops settings) */}
          {showIntro && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 95, willChange: 'transform, opacity', animation: 'screenIn .20s cubic-bezier(.16,1,.3,1)' }}>
              <window.Screens.Onboarding t={t} onDone={dismissIntro}
                onClose={dismissIntro}
                isAbout={sheet}
                onShowLegal={() => setLegalOpen(true)} />
            </div>
          )}

          {/* Legal (Terms / Privacy) — top layer so it works over Settings and onboarding */}
          {legalOpen && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 100, willChange: 'transform, opacity', animation: 'screenIn .20s cubic-bezier(.16,1,.3,1)' }}>
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

