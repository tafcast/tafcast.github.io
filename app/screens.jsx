/* Secondary screens: ManageAirports, WidgetConfig, AlertsScreen, SettingsSheet.
   window.Screens.* */
(function () {
  const { useState, useEffect } = React;
  const AV = window.AV;

  /* ---- shared themed controls ---- */
  function Switch({ on, onChange, t }) {
    return (
      <button onClick={() => onChange(!on)} style={{ all: 'unset', cursor: 'pointer', width: 51, height: 31,
        borderRadius: 31, background: on ? '#34c759' : (t.dark ? '#39393d' : '#e9e9ea'), position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: 27,
          background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
      </button>
    );
  }

  function Seg({ value, options, onChange, t }) {
    return (
      <div style={{ display: 'inline-flex', padding: 3, borderRadius: t.variant === 'deck' ? t.radChip : 999,
        background: t.inset, gap: 2, border: t.variant === 'deck' ? `1px solid ${t.line}` : 'none' }}>
        {options.map(o => {
          const active = o.v === value;
          return (
            <button key={o.v} onClick={() => onChange(o.v)} style={{ border: 'none', cursor: 'pointer',
              padding: '6px 13px', borderRadius: t.variant === 'deck' ? t.radChip - 2 : 999,
              font: t.variant === 'deck' ? `600 12px ${t.mono}` : `600 13px ${t.body}`,
              letterSpacing: t.variant === 'deck' ? 0.5 : 0.1, textTransform: t.variant === 'deck' ? 'uppercase' : 'none',
              background: active ? t.surface : 'transparent', color: active ? t.text : t.textDim,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', transition: 'all .15s' }}>{o.l}</button>
          );
        })}
      </div>
    );
  }

  function Stepper({ value, onChange, min = 1, max = 99, suffix, t }) {
    const btn = (label, fn) => (
      <button onClick={fn} style={{ all: 'unset', cursor: 'pointer', width: 34, height: 32, display: 'grid', placeItems: 'center',
        font: `500 20px ${t.body}`, color: t.text }}>{label}</button>
    );
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: t.inset, borderRadius: 9,
        border: t.variant === 'deck' ? `1px solid ${t.line}` : 'none' }}>
        {btn('–', () => onChange(Math.max(min, value - 1)))}
        <span style={{ minWidth: 52, textAlign: 'center', font: `700 15px ${t.mono}`, color: t.text }}>{value}{suffix}</span>
        {btn('+', () => onChange(Math.min(max, value + 1)))}
      </div>
    );
  }

  function Header({ t, title, onClose, action }) {
    return (
      <div style={{ padding: window.AV_NATIVE ? '12px 16px 12px' : 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 12px', display: 'flex', alignItems: 'center', gap: 8,
        background: t.chrome, borderBottom: `1px solid ${t.hair}`, position: 'sticky', top: 0, zIndex: 5 }}>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: t.accent }}>
          {window.Icon.chevL({ size: 22, color: t.accent, stroke: 2.4 })}
          <span style={{ font: `500 17px ${t.body}` }}>Back</span>
        </button>
        <span style={{ font: `700 18px ${t.display}`, color: t.text, position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          letterSpacing: t.variant === 'deck' ? 1 : -0.2, textTransform: t.variant === 'deck' ? 'uppercase' : 'none' }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}>{action}</span>
      </div>
    );
  }

  function GroupLabel({ t, children }) {
    return <div style={{ font: t.variant === 'deck' ? `600 11px ${t.mono}` : `600 12px ${t.body}`, color: t.textDim,
      letterSpacing: t.variant === 'deck' ? 1 : 0.3, textTransform: 'uppercase', padding: '20px 6px 9px' }}>{children}</div>;
  }

  function Group({ t, children }) {
    return <div style={{ background: t.surface, borderRadius: t.variant === 'deck' ? t.radCard : 16, overflow: 'hidden',
      border: t.variant === 'deck' ? `1px solid ${t.line}` : 'none' }}>{children}</div>;
  }

  function Row({ t, children, last, onClick, style }) {
    return <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', minHeight: 30,
      borderBottom: last ? 'none' : `1px solid ${t.hair}`, cursor: onClick ? 'pointer' : 'default', ...style }}>{children}</div>;
  }

  /* ---- Manage airports ---- */
  function ManageAirports({ t, saved, onAdd, onRemove, onReorder, onSelect, onClose }) {
    const [q, setQ] = useState('');
    const [collapsed, setCollapsed] = useState({}); // country -> hidden?
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Server-side search — the full catalog (Europe + US + Brazil) lives on the backend.
    useEffect(() => {
      const query = q.trim();
      if (!query) { setResults([]); setSearching(false); return; }
      setSearching(true);
      const id = setTimeout(() => {
        fetch(`${AV.apiBase()}/api/airports?q=${encodeURIComponent(query)}&limit=80`)
          .then(r => r.json())
          .then(list => {
            const arr = Array.isArray(list) ? list.filter(d => !saved.includes(d.icao)) : [];
            AV.rememberAirports(arr);
            setResults(arr);
            setSearching(false);
          })
          .catch(() => { setResults([]); setSearching(false); });
      }, 250);
      return () => clearTimeout(id);
    }, [q, saved]);

    // Group results by country (from the backend result).
    const byCountry = {};
    results.forEach(d => { const k = d.country || AV.country(d.icao); (byCountry[k] = byCountry[k] || []).push(d); });
    const countries = Object.keys(byCountry).sort();
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: t.page }}>
        <Header t={t} title="Airports" onClose={onClose} />
        <div style={{ padding: '4px 16px 40px' }}>
          {/* search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.inset, borderRadius: t.variant === 'deck' ? t.radChip : 12,
            padding: '10px 13px', marginTop: 14, border: t.variant === 'deck' ? `1px solid ${t.line}` : 'none' }}>
            {window.Icon.search({ size: 18, color: t.textDim, stroke: 2 })}
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ICAO, name or city"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: `500 16px ${t.body}`, color: t.text }} />
          </div>

          <GroupLabel t={t}>Saved · {saved.length}</GroupLabel>
          <Group t={t}>
            {saved.map((code, i) => {
              const a = AV.meta(code); const c = AV.cat(a.category);
              return (
                <Row key={code} t={t} last={i === saved.length - 1}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => onReorder(i, -1)} disabled={i === 0} style={{ all: 'unset', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.25 : 0.6, lineHeight: 0 }}>{window.Icon.chevDown({ size: 14, color: t.textDim, stroke: 2.5 })}</button>
                  </span>
                  <span style={{ width: 9, height: 9, borderRadius: 9, background: c.color }} />
                  <span onClick={() => onSelect(i)} style={{ flex: 1, cursor: 'pointer' }}>
                    <span style={{ font: `700 16px ${t.mono}`, color: t.text, letterSpacing: 0.5 }}>{a.icao}</span>
                    <span style={{ font: `500 15px ${t.body}`, color: t.textDim, marginLeft: 9 }}>{a.name}</span>
                  </span>
                  <span style={{ font: `700 11px ${t.mono}`, color: c.color, letterSpacing: 0.5 }}>{c.label}</span>
                  <button onClick={() => onRemove(code)} style={{ all: 'unset', cursor: 'pointer', lineHeight: 0, padding: 4 }}>
                    {window.Icon.trash({ size: 17, color: '#ff453a', stroke: 2 })}
                  </button>
                </Row>
              );
            })}
          </Group>

          {!q.trim() ? (
            <React.Fragment>
              <GroupLabel t={t}>Add airport</GroupLabel>
              <Group t={t}><Row t={t} last><span style={{ font: `500 14px ${t.body}`, color: t.textDim, lineHeight: 1.4 }}>Search by ICAO, name or city to add airports from Europe, the US and Brazil.</span></Row></Group>
            </React.Fragment>
          ) : results.length === 0 ? (
            <React.Fragment>
              <GroupLabel t={t}>Results</GroupLabel>
              <Group t={t}><Row t={t} last><span style={{ font: `500 15px ${t.body}`, color: t.textDim }}>{searching ? 'Searching…' : 'No matches'}</span></Row></Group>
            </React.Fragment>
          ) : (
            countries.map(cn => {
              const hidden = !!collapsed[cn];
              return (
                <React.Fragment key={cn}>
                  <div onClick={() => setCollapsed(c => ({ ...c, [cn]: !c[cn] }))}
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '20px 6px 9px' }}>
                    <span style={{ font: `600 12px ${t.body}`, color: t.textDim, letterSpacing: 0.3, textTransform: 'uppercase', flex: 1 }}>
                      {cn} · {byCountry[cn].length}
                    </span>
                    <span style={{ display: 'inline-flex', lineHeight: 0, transform: hidden ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}>
                      {window.Icon.chevDown({ size: 16, color: t.textDim, stroke: 2.5 })}
                    </span>
                  </div>
                  {!hidden && (
                    <Group t={t}>
                      {byCountry[cn].map((d, i) => {
                        const c = AV.cat(d.category);
                        return (
                          <Row key={d.icao} t={t} last={i === byCountry[cn].length - 1} onClick={() => { AV.rememberAirports([d]); onAdd(d.icao); }}>
                            <span style={{ width: 9, height: 9, borderRadius: 9, background: c.color }} />
                            <span style={{ flex: 1 }}>
                              <span style={{ font: `700 16px ${t.mono}`, color: t.text, letterSpacing: 0.5 }}>{d.icao}</span>
                              <span style={{ font: `500 15px ${t.body}`, color: t.textDim, marginLeft: 9 }}>{d.name}</span>
                            </span>
                            {window.Icon.plus({ size: 20, color: t.accent, stroke: 2.4 })}
                          </Row>
                        );
                      })}
                    </Group>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    );
  }

  /* ---- Widget config (drives the native home-screen widget) ---- */
  function WidgetConfig({ t, saved, apiData, onClose }) {
    const order = (saved && saved.length) ? saved : AV.saved;
    apiData = apiData || {};

    const [mode, setMode] = useState(() => {
      try { const m = localStorage.getItem('av_widget_mode'); return (m === 'decoded' || m === 'raw') ? m : 'raw'; }
      catch(e) { return 'raw'; }
    });
    const [wdark, setWdark] = useState(() => { try { return localStorage.getItem('av_widget_dark') !== 'false'; } catch(e) { return true; } });

    // Persist each setting and push it to the native widget.
    useEffect(() => { try { localStorage.setItem('av_widget_mode', mode); } catch(e) {} if (window.AV_syncWidget) window.AV_syncWidget(); }, [mode]);
    useEffect(() => { try { localStorage.setItem('av_widget_dark', String(wdark)); } catch(e) {} if (window.AV_syncWidget) window.AV_syncWidget(); }, [wdark]);

    // The widget cycles through all saved airports; preview the first one.
    const icao = order[0];
    const ap = apiData[icao] || AV.airports[icao];
    const canPreview = ap && ((ap.taf && ap.taf.raw) || (ap.syntheticTaf && ap.syntheticTaf.raw));

    return (
      <div style={{ height: '100%', overflowY: 'auto', background: t.page }}>
        <Header t={t} title="Widget" onClose={onClose} />
        <div style={{ padding: '4px 16px 40px' }}>
          {/* preview */}
          <div style={{ borderRadius: 22, marginTop: 16, padding: '30px 16px', display: 'grid', placeItems: 'center',
            background: 'linear-gradient(165deg,#243456,#5b4f6b 70%,#a8806a)', minHeight: 200 }}>
            {canPreview
              ? <window.WidgetCard ap={ap} mode={mode} size="medium" dark={wdark} mono={t.mono} />
              : <div style={{ color: '#fff', font: `500 14px ${t.body}`, opacity: 0.9 }}>Loading {icao}…</div>}
          </div>

          <GroupLabel t={t}>TAF format</GroupLabel>
          <Seg value={mode} onChange={setMode} t={t} options={[{ v: 'decoded', l: 'Decoded' }, { v: 'raw', l: 'Raw' }]} />

          <GroupLabel t={t}>Appearance</GroupLabel>
          <Seg value={wdark ? 'd' : 'l'} onChange={v => setWdark(v === 'd')} t={t} options={[{ v: 'l', l: 'Light' }, { v: 'd', l: 'Dark' }]} />

          <div style={{ font: `500 12.5px ${t.body}`, color: t.textDim, padding: '18px 6px 0', lineHeight: 1.5, textWrap: 'pretty' }}>
            The widget always shows the TAF, with wind, ceiling and QNH from the latest METAR alongside. It cycles through your saved airports (manage them under Airports). On the Home Screen, TAP the ‹ › buttons to switch airport — home-screen widgets can't be swiped — and tap elsewhere on the card to open the app. Add it from your phone's widget picker, then drag its handles to resize.
          </div>
        </div>
      </div>
    );
  }

  /* ---- Alerts ---- */
  function AlertsScreen({ t, onClose }) {
    const { useEffect } = React;
    const [windOn, setWindOn] = useState(() => { try { return localStorage.getItem('av_alert_windOn') !== 'false'; } catch(e) { return true; } });
    const [windKt, setWindKt] = useState(() => { try { return parseInt(localStorage.getItem('av_alert_windKt')) || 15; } catch(e) { return 15; } });
    const [gust, setGust] = useState(() => { try { return localStorage.getItem('av_alert_gust') !== 'false'; } catch(e) { return true; } });
    const [catChg, setCatChg] = useState(() => { try { return localStorage.getItem('av_alert_catChg') !== 'false'; } catch(e) { return true; } });
    const [notam, setNotam] = useState(() => { try { return localStorage.getItem('av_alert_notam') === 'true'; } catch(e) { return false; } });

    const pushAlerts = () => { if (window.AV_syncWidget) window.AV_syncWidget(); };
    useEffect(() => { try { localStorage.setItem('av_alert_windOn', String(windOn)); } catch(e) {} pushAlerts(); }, [windOn]);
    useEffect(() => { try { localStorage.setItem('av_alert_windKt', String(windKt)); } catch(e) {} pushAlerts(); }, [windKt]);
    useEffect(() => { try { localStorage.setItem('av_alert_gust', String(gust)); } catch(e) {} pushAlerts(); }, [gust]);
    useEffect(() => { try { localStorage.setItem('av_alert_catChg', String(catChg)); } catch(e) {} pushAlerts(); }, [catChg]);
    useEffect(() => { try { localStorage.setItem('av_alert_notam', String(notam)); } catch(e) {} pushAlerts(); }, [notam]);

    return (
      <div style={{ height: '100%', overflowY: 'auto', background: t.page }}>
        <Header t={t} title="Alerts" onClose={onClose} />
        <div style={{ padding: '4px 16px 40px' }}>
          <GroupLabel t={t}>Wind</GroupLabel>
          <Group t={t}>
            <Row t={t}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Wind speed alert</span>
              <Switch on={windOn} onChange={setWindOn} t={t} />
            </Row>
            <Row t={t} last style={{ opacity: windOn ? 1 : 0.4 }}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Notify above</span>
              <Stepper value={windKt} onChange={setWindKt} min={5} max={50} suffix=" kt" t={t} />
            </Row>
          </Group>
          <Group t={t} style={{ marginTop: 0 }}><div style={{ height: 12 }} /></Group>
          <Group t={t}>
            <Row t={t}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Gust alert</span>
              <Switch on={gust} onChange={setGust} t={t} />
            </Row>
            <Row t={t} last>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Includes gusts in threshold</span>
              <span style={{ font: `500 14px ${t.body}`, color: t.textDim }}>{gust ? 'On' : 'Off'}</span>
            </Row>
          </Group>

          <GroupLabel t={t}>Conditions</GroupLabel>
          <Group t={t}>
            <Row t={t}>
              <span style={{ flex: 1 }}>
                <div style={{ font: `500 16px ${t.body}`, color: t.text }}>Flight category change</div>
                <div style={{ font: `400 13px ${t.body}`, color: t.textDim, marginTop: 1 }}>e.g. VFR → IFR</div>
              </span>
              <Switch on={catChg} onChange={setCatChg} t={t} />
            </Row>
            <Row t={t} last>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>New NOTAM published</span>
              <Switch on={notam} onChange={setNotam} t={t} />
            </Row>
          </Group>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '16px 6px 0', padding: '8px 12px',
            borderRadius: 999, background: windOn ? (t.dark ? 'rgba(245,166,35,0.14)' : 'rgba(245,166,35,0.16)') : t.inset }}>
            {window.Icon.bell({ size: 15, color: windOn ? '#e5901a' : t.textDim, stroke: 2 })}
            <span style={{ font: `600 12.5px ${t.body}`, color: windOn ? '#e5901a' : t.textDim }}>
              {windOn ? `Alerting when wind exceeds ${windKt} kt` : 'Wind alerts off'}</span>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Settings bottom sheet ---- */
  function SettingsSheet({ t, mode, setMode, raw, setRaw, nearest, setNearest, apiOverride, setApiOverride, onUnitsChange, onOpenWidget, onOpenAlerts, onOpenAirports, onOpenAbout, onOpenLegal, onClose }) {
    const [u, setU] = useState(() => ({ ...AV.units }));
    const pick = (k, v) => { AV.setUnit(k, v); setU(p => ({ ...p, [k]: v })); if (onUnitsChange) onUnitsChange(); };
    const [urlDraft, setUrlDraft] = useState(apiOverride || '');
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
        <div style={{ position: 'relative', background: t.page, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: '0 16px 28px', maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)', animation: 'sheetUp .28s cubic-bezier(.2,.8,.2,1)' }}>
          {/* sticky header so the close button is always reachable */}
          <div style={{ position: 'sticky', top: 0, zIndex: 3, background: t.page, margin: '0 -16px', padding: '10px 16px 8px' }}>
            <div style={{ width: 38, height: 5, borderRadius: 5, background: t.line, margin: '0 auto 6px' }} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 2px' }}>
              <span style={{ font: `700 22px ${t.display}`, color: t.text, letterSpacing: t.variant === 'deck' ? 1 : -0.3,
                textTransform: t.variant === 'deck' ? 'uppercase' : 'none' }}>Settings</span>
              <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto', width: 32, height: 32, borderRadius: 32,
                background: t.inset, display: 'grid', placeItems: 'center' }}>{window.Icon.x({ size: 17, color: t.text, stroke: 2.6 })}</button>
            </div>
          </div>

          <GroupLabel t={t}>Appearance</GroupLabel>
          <Group t={t}>
            <Row t={t}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Theme</span>
              <Seg value={mode} onChange={setMode} t={t} options={[{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }]} />
            </Row>
            <Row t={t} last>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Raw data by default</span>
              <Switch on={raw} onChange={setRaw} t={t} />
            </Row>
          </Group>

          <GroupLabel t={t}>General</GroupLabel>
          <Group t={t}>
            <Row t={t} onClick={onOpenAirports}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#0a84ff', display: 'grid', placeItems: 'center' }}>{window.Icon.pin({ size: 16, color: '#fff', stroke: 2 })}</span>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Airports</span>
              {window.Icon.chevR({ size: 16, color: t.textFaint, stroke: 2.4 })}
            </Row>
            <Row t={t} onClick={onOpenWidget}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#34c759', display: 'grid', placeItems: 'center' }}>{window.Icon.layers({ size: 16, color: '#fff', stroke: 2 })}</span>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Widgets</span>
              {window.Icon.chevR({ size: 16, color: t.textFaint, stroke: 2.4 })}
            </Row>
            <Row t={t} onClick={onOpenAlerts}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#f5a623', display: 'grid', placeItems: 'center' }}>{window.Icon.bell({ size: 16, color: '#fff', stroke: 2 })}</span>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Alerts</span>
              {window.Icon.chevR({ size: 16, color: t.textFaint, stroke: 2.4 })}
            </Row>
            <Row t={t} onClick={onOpenAbout}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#8e8e93', display: 'grid', placeItems: 'center' }}>{(window.Icon.info || window.Icon.bell)({ size: 16, color: '#fff', stroke: 2 })}</span>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>About &amp; disclaimer</span>
              {window.Icon.chevR({ size: 16, color: t.textFaint, stroke: 2.4 })}
            </Row>
            <Row t={t} last onClick={onOpenLegal}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: '#636366', display: 'grid', placeItems: 'center' }}>{(window.Icon.doc || window.Icon.bell)({ size: 16, color: '#fff', stroke: 2 })}</span>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Terms &amp; privacy</span>
              {window.Icon.chevR({ size: 16, color: t.textFaint, stroke: 2.4 })}
            </Row>
          </Group>

          <GroupLabel t={t}>Data</GroupLabel>
          <Group t={t}>
            <Row t={t} onClick={() => setNearest(!nearest)}>
              <span style={{ flex: 1 }}>
                <div style={{ font: `500 16px ${t.body}`, color: t.text }}>Nearest-station estimate</div>
                <div style={{ font: `400 13px ${t.body}`, color: t.textDim, marginTop: 1, lineHeight: 1.35 }}>For fields with no weather station, show the closest reporting airport's METAR and TAF alongside IPMA EMA and Synthetic TAF</div>
              </span>
              <Switch on={!!nearest} onChange={setNearest} t={t} />
            </Row>
            <Row t={t} last style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ font: `500 16px ${t.body}`, color: t.text }}>Backend URL</span>
                {urlDraft !== (apiOverride || '') && (
                  <button onClick={() => setApiOverride(urlDraft.trim())} style={{
                    all: 'unset', cursor: 'pointer', padding: '4px 10px', borderRadius: 8,
                    background: t.accent, color: '#fff', font: `700 12px ${t.body}` }}>Save</button>
                )}
              </div>
              <input value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
                placeholder="Default (Cloud Run)"
                style={{ border: `1px solid ${t.line}`, background: t.inset, borderRadius: 8, padding: '8px 10px',
                  font: `500 13px ${t.mono}`, color: t.text, outline: 'none' }} />
            </Row>
          </Group>

          <GroupLabel t={t}>Units</GroupLabel>
          <Group t={t}>
            <Row t={t}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Temperature</span>
              <Seg value={u.temp} onChange={v => pick('temp', v)} t={t} options={[{ v: 'C', l: '°C' }, { v: 'F', l: '°F' }]} />
            </Row>
            <Row t={t}>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Wind</span>
              <Seg value={u.wind} onChange={v => pick('wind', v)} t={t} options={[{ v: 'kt', l: 'kt' }, { v: 'kmh', l: 'km/h' }, { v: 'mph', l: 'mph' }]} />
            </Row>
            <Row t={t} last>
              <span style={{ flex: 1, font: `500 16px ${t.body}`, color: t.text }}>Pressure</span>
              <Seg value={u.press} onChange={v => pick('press', v)} t={t} options={[{ v: 'hPa', l: 'hPa' }, { v: 'inHg', l: 'inHg' }]} />
            </Row>
          </Group>

          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center',
            marginTop: 22, padding: '14px', borderRadius: 14, background: t.accent, color: '#fff', font: `700 16px ${t.body}` }}>Done</button>
        </div>
      </div>
    );
  }

  /* ---- First-run onboarding + disclaimer (also reachable via Settings ▸ About) ---- */
  function Onboarding({ t, onDone, onShowLegal }) {
    const bullet = (icon, title, body) => (
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: t.inset, display: 'grid', placeItems: 'center' }}>
          {(window.Icon[icon] || window.Icon.bell)({ size: 18, color: t.accent, stroke: 2 })}
        </span>
        <span>
          <div style={{ font: `700 15px ${t.body}`, color: t.text }}>{title}</div>
          <div style={{ font: `500 13.5px ${t.body}`, color: t.textDim, marginTop: 2, lineHeight: 1.45, textWrap: 'pretty' }}>{body}</div>
        </span>
      </div>
    );
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: t.page, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: window.AV_NATIVE ? '20px 22px 20px' : 'calc(env(safe-area-inset-top, 0px) + 20px) 22px 20px' }}>
          <div style={{ font: `800 30px ${t.display}`, color: t.text, letterSpacing: -0.5 }}>TAFCast</div>
          <div style={{ font: `500 15px ${t.body}`, color: t.textDim, margin: '6px 0 26px', lineHeight: 1.45, textWrap: 'pretty' }}>
            A quick pre-flight picture for your airports — METAR, TAF, wind, runways and NOTAMs in one place.
          </div>
          {bullet('refresh', 'Live, free data', 'METAR/TAF from NOAA, wind from Open-Meteo, NOTAMs from autorouter. The last-seen data is cached on your device so the app opens instantly, even offline.')}
          {bullet('layers', 'Fields with no station', 'For Portuguese aerodromes with no official weather station, the app shows the nearest IPMA automatic-station observation and a model-generated, clearly-labelled ADVISORY TAF — illustrative only, never for flight decisions.')}
          {bullet('x', 'For situational awareness only', 'Not for navigation or flight planning. Always verify against official sources before flight. This app is not an official MET/AIS service, is not certified by any aviation authority, and must never be the sole basis for any flight decision — the pilot in command is always responsible.')}
          <div style={{ marginTop: 6, padding: '12px 14px', borderRadius: 12, background: t.inset, font: `500 12.5px ${t.body}`, color: t.textDim, lineHeight: 1.5 }}>
            By tapping “I agree”, you accept the <button onClick={onShowLegal} style={{ all: 'unset', cursor: 'pointer', color: t.accent, fontWeight: 700 }}>Terms of Use &amp; Privacy Policy</button>. Data is provided “as is”, with no warranty; the app is supplied without liability for any flight or operational decision.
          </div>
        </div>
        <div style={{ padding: '12px 22px 28px', borderTop: `1px solid ${t.hair}` }}>
          <button onClick={onDone} style={{ all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center', width: '100%',
            boxSizing: 'border-box', padding: '15px', borderRadius: 14, background: t.accent, color: '#fff', font: `700 16px ${t.body}` }}>
            I agree
          </button>
          <button onClick={onShowLegal} style={{ all: 'unset', cursor: 'pointer', display: 'block', textAlign: 'center', width: '100%',
            marginTop: 10, font: `600 13px ${t.body}`, color: t.textDim }}>
            Read Terms &amp; Privacy
          </button>
        </div>
      </div>
    );
  }

  /* ---- Legal: Disclaimer · Terms of Use · Privacy Policy ---- */
  function LegalScreen({ t, onClose, initial = 'disclaimer' }) {
    // Canonical text is bundled as window.AV_LEGAL (app/legal.js). In the browser
    // preview it may be absent — fall back to fetching the hosted /legal/content.json.
    const [data, setData] = useState(() => window.AV_LEGAL || null);
    const [tab, setTab] = useState(initial);
    useEffect(() => {
      if (data) return;
      let alive = true;
      fetch(`${AV.apiBase()}/legal/content.json`)
        .then(r => r.json())
        .then(d => { if (alive && d && d.privacy) setData(d); })
        .catch(() => {});
      return () => { alive = false; };
    }, [data]);

    const doc = data && data[tab];
    const hosted = (AV.apiBase() || '') + '/legal';

    return (
      <div style={{ height: '100%', overflowY: 'auto', background: t.page }}>
        <Header t={t} title="Legal" onClose={onClose} />
        <div style={{ padding: '4px 16px 48px' }}>
          <div style={{ marginTop: 14 }}>
            <Seg value={tab} onChange={setTab} t={t} options={[
              { v: 'disclaimer', l: 'Disclaimer' }, { v: 'terms', l: 'Terms' }, { v: 'privacy', l: 'Privacy' },
            ]} />
          </div>

          {!doc ? (
            <div style={{ font: `500 14px ${t.body}`, color: t.textDim, padding: '24px 4px', lineHeight: 1.5 }}>
              {data ? 'Not available.' : `Couldn’t load the documents. Read them online at ${hosted}.`}
            </div>
          ) : (
            <React.Fragment>
              <div style={{ font: `800 24px ${t.display}`, color: t.text, letterSpacing: -0.4, margin: '20px 2px 2px' }}>{doc.title}</div>
              <div style={{ font: `500 12px ${t.mono}`, color: t.textFaint, margin: '0 2px 8px' }}>
                {data.appName} · v{data.version} · effective {data.effective}
              </div>
              {doc.sections.map((s, i) => (
                <div key={i} style={{ marginTop: 16 }}>
                  <div style={{ font: `700 15px ${t.body}`, color: t.text, marginBottom: 4 }}>{s.h}</div>
                  {s.p.map((para, j) => (
                    <div key={j} style={{ font: `500 13.5px ${t.body}`, color: t.textDim, lineHeight: 1.55, marginBottom: 6, textWrap: 'pretty' }}>{para}</div>
                  ))}
                </div>
              ))}
              <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 12, background: t.inset,
                font: `500 12px ${t.body}`, color: t.textDim, lineHeight: 1.5 }}>
                Also published online at <span style={{ font: `600 12px ${t.mono}`, color: t.textDim, wordBreak: 'break-all' }}>{hosted}</span>.
              </div>
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }

  window.Screens = { ManageAirports, WidgetConfig, AlertsScreen, SettingsSheet, Onboarding, LegalScreen };
})();
