/* Variation A — "Briefing": weather-app DNA, soft & generous. window.CardBriefing */
(function () {
  const { useState, useEffect } = React;
  const AV = window.AV;

  /* ---- Reorderable "islands" (the aerodrome cards) ----
     A single global order, persisted in localStorage, applied to every airport.
     Unknown/new island ids are appended so nothing ever disappears after an update.
     The order + edit-mode live in a tiny shared store so a reorder on the centre
     carousel page shows up on its neighbours too (all three are mounted at once). */
  const ISLAND_IDS = ['metar', 'ipma_ema', 'taf', 'synthetic', 'nearest', 'wind', 'runways', 'notams'];
  const ISLAND_LABEL = {
    metar: 'METAR',
    ipma_ema: 'IPMA EMA',
    taf: 'TAF',
    synthetic: 'Synthetic TAF',
    nearest: 'Nearest Station',
    wind: 'Wind outlook',
    runways: 'Runways',
    notams: 'NOTAMs',
  };

  function loadIslandOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem('av_island_order') || 'null');
      if (Array.isArray(saved) && saved.length) {
        const known = saved.filter(id => ISLAND_IDS.includes(id));
        const missing = ISLAND_IDS.filter(id => !known.includes(id));
        if (known.length) return [...known, ...missing];
      }
    } catch (e) {}
    return ISLAND_IDS.slice();
  }

  const layoutStore = { order: loadIslandOrder(), editing: false, subs: new Set() };
  const emitLayout = () => layoutStore.subs.forEach(fn => fn());
  function setIslandOrder(next) {
    layoutStore.order = next;
    try { localStorage.setItem('av_island_order', JSON.stringify(next)); } catch (e) {}
    emitLayout();
  }
  function setLayoutEditing(v) { layoutStore.editing = v; emitLayout(); }
  function useLayoutStore() {
    const [, force] = useState(0);
    useEffect(() => {
      const fn = () => force(x => x + 1);
      layoutStore.subs.add(fn);
      return () => { layoutStore.subs.delete(fn); };
    }, []);
    return layoutStore;
  }

  // Swap an island with its neighbour among the currently-visible islands, but write
  // the swap into the FULL order array so hidden islands keep their relative place.
  function moveIsland(order, visibleIds, id, dir) {
    const vi = visibleIds.indexOf(id);
    const tj = vi + dir;
    if (vi < 0 || tj < 0 || tj >= visibleIds.length) return order;
    const otherId = visibleIds[tj];
    const a = order.slice();
    const i1 = a.indexOf(id), i2 = a.indexOf(otherId);
    if (i1 < 0 || i2 < 0) return order;
    const tmp = a[i1]; a[i1] = a[i2]; a[i2] = tmp;
    return a;
  }

  function RawToggle({ raw, setRaw, t }) {
    const opt = (active, label, on) => (
      <button onClick={on} style={{
        border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 999,
        font: `600 13px ${t.body}`, letterSpacing: 0.2,
        background: active ? t.surface : 'transparent',
        color: active ? t.text : t.textDim,
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', transition: 'all .18s',
      }}>{label}</button>
    );
    return (
      <div style={{ display: 'inline-flex', padding: 3, borderRadius: 999, background: t.inset, gap: 2 }}>
        {opt(!raw, 'Decoded', () => setRaw(false))}
        {opt(raw, 'Raw', () => setRaw(true))}
      </div>
    );
  }

  function Card({ t, children, style }) {
    return <div style={{ background: t.surface, borderRadius: t.radCard, padding: t.pad,
      boxShadow: t.dark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)', ...style }}>{children}</div>;
  }

  function SectionTitle({ t, badge, title, meta }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: t.inset, color: t.textDim,
          display: 'grid', placeItems: 'center', font: `700 13px ${t.mono}` }}>{badge}</span>
        <span style={{ font: `700 18px ${t.display}`, color: t.text, letterSpacing: -0.2 }}>{title}</span>
        {meta && <span style={{ marginLeft: 'auto', font: `500 13px ${t.mono}`, color: t.textDim }}>{meta}</span>}
      </div>
    );
  }

  function Metric({ t, icon, label, value, sub }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.textDim }}>
          <span style={{ display: 'grid', placeItems: 'center' }}>{window.Icon[icon]({ size: 15, color: t.textDim, stroke: 1.9 })}</span>
          <span style={{ font: `600 11px ${t.body}`, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{ font: `600 19px ${t.body}`, color: t.text }}>{value}{sub && <span style={{ font: `500 13px ${t.body}`, color: t.textDim }}> {sub}</span>}</div>
      </div>
    );
  }

  function NotamRow({ t, n, last }) {
    const [open, setOpen] = useState(false);
    const sevColor = n.sev === 'caution' ? '#f5a623' : t.textDim;
    return (
      <div style={{ borderBottom: last ? 'none' : `1px solid ${t.hair}`, padding: '13px 0' }}>
        <button onClick={() => setOpen(o => !o)} style={{ all: 'unset', cursor: 'pointer', display: 'flex',
          gap: 11, width: '100%', alignItems: 'flex-start' }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: sevColor, marginTop: 6, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ font: `700 12px ${t.mono}`, color: t.textDim }}>{n.id}</span>
              <span style={{ font: `500 12px ${t.body}`, color: t.textFaint, marginLeft: 'auto' }}>{n.from} → {n.to}</span>
            </span>
            <div style={{ font: `500 15px ${t.body}`, color: t.text, marginTop: 3, lineHeight: 1.35, textWrap: 'pretty' }}>{n.summary}</div>
            {open && <div style={{ marginTop: 9, padding: 11, borderRadius: 12, background: t.inset,
              font: `500 12px ${t.mono}`, color: t.textDim, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{n.raw}</div>}
          </span>
        </button>
      </div>
    );
  }

  function NotamCard({ ap, t }) {
    const notams = ap.notams || [];
    const [expanded, setExpanded] = useState(false);
    if (!notams.length) return null;

    // Prioritize caution/warning NOTAMs first
    const sorted = [...notams].sort((a, b) => {
      if (a.sev === 'caution' && b.sev !== 'caution') return -1;
      if (b.sev === 'caution' && a.sev !== 'caution') return 1;
      return 0;
    });

    const PREVIEW_LIMIT = 3;
    const hasMore = sorted.length > PREVIEW_LIMIT;
    const displayed = expanded ? sorted : sorted.slice(0, PREVIEW_LIMIT);
    const cautionCount = sorted.filter(n => n.sev === 'caution').length;
    const metaText = cautionCount > 0
      ? `${cautionCount} caution · ${sorted.length} active`
      : `${sorted.length} active`;

    return (
      <Card t={t}>
        <SectionTitle t={t} badge="!" title="NOTAMs" meta={metaText} />
        <div>
          {displayed.map((n, i) => (
            <NotamRow key={n.id} t={t} n={n} last={i === displayed.length - 1 && !hasMore} />
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              boxSizing: 'border-box',
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: t.inset,
              font: `600 13px ${t.body}`,
              color: t.accent,
              transition: 'background .15s',
            }}
          >
            <span>{expanded ? 'Show top 3 only' : `Show all ${sorted.length} NOTAMs (${sorted.length - PREVIEW_LIMIT} more)`}</span>
            <span style={{ display: 'inline-flex', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
              {window.Icon.chevDown({ size: 14, color: t.accent, stroke: 2.5 })}
            </span>
          </button>
        )}
      </Card>
    );
  }


  // 24-hour hourly wind outlook data (Open-Meteo via backend), cached on device.
  // Hoisted out of the card so the parent can tell whether the wind island exists
  // (needed to gate the reorder controls) before the card decides to render.
  function useWindHours(icao) {
    const [hours, setHours] = useState(() => {
      try { const c = JSON.parse(localStorage.getItem('av_forecast_cache') || '{}')[icao]; return (c && c.hours) || null; } catch (e) { return null; }
    });
    useEffect(() => {
      let alive = true;
      // Show this airport's cached hours right away — don't bleed the previous one.
      try { const c = JSON.parse(localStorage.getItem('av_forecast_cache') || '{}')[icao]; setHours((c && c.hours) || null); } catch (e) { setHours(null); }
      fetch(`${AV.apiBase()}/api/forecast/${icao}`)
        .then(r => r.json())
        .then(d => {
          if (!alive || !d || d.error || !Array.isArray(d.hours)) return;
          setHours(d.hours);
          try {
            const all = JSON.parse(localStorage.getItem('av_forecast_cache') || '{}');
            all[icao] = { ts: Date.now(), hours: d.hours };
            localStorage.setItem('av_forecast_cache', JSON.stringify(all));
          } catch (e) {}
        })
        .catch(() => {});
      return () => { alive = false; };
    }, [icao]);
    return hours;
  }

  function WindForecast({ hours, t }) {
    if (!hours || !hours.length) return null;
    const hh = (ts) => String(new Date(ts * 1000).getUTCHours()).padStart(2, '0') + 'Z';
    // Keep horizontal scrolling local — don't let it trigger the airport carousel.
    const stop = (e) => e.stopPropagation();
    return (
      <Card t={t}>
        <SectionTitle t={t} badge="W" title="Wind outlook" meta={`24h · ${AV.windUnit()}`} />
        <div onMouseDown={stop} onMouseMove={stop} onTouchStart={stop} onTouchMove={stop}
          style={{ display: 'flex', overflowX: 'auto', paddingBottom: 6, touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
          {hours.map((h, i) => (
            <div key={i} style={{ flex: '0 0 auto', width: 52, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '2px 0', borderRight: i < hours.length - 1 ? `1px solid ${t.hair}` : 'none' }}>
              <span style={{ font: `600 11px ${t.mono}`, color: t.textFaint }}>{hh(h.t)}</span>
              <span style={{ font: `600 12px ${t.mono}`, color: t.textDim }}>{String(h.dir).padStart(3, '0')}°</span>
              <span style={{ font: `700 15px ${t.body}`, color: t.text }}>{AV.convWindVal(h.spd)}</span>
              <span style={{ font: `600 10px ${t.mono}`, color: h.gust ? '#e5901a' : t.textFaint, minHeight: 12 }}>{h.gust ? `G${AV.convWindVal(h.gust)}` : '–'}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Head/cross-wind components for a runway heading (true) vs wind (true).
  // angle +ve = wind from the right; head +ve = headwind, -ve = tailwind.
  function windComponents(rwyHdg, windDir, windSpd) {
    const a = ((((windDir - rwyHdg) % 360) + 540) % 360) - 180;
    const rad = a * Math.PI / 180;
    return { head: windSpd * Math.cos(rad), cross: windSpd * Math.sin(rad), angle: a };
  }

  // Small dial: runway as a vertical bar (favoured end up) + wind arrow drawn at
  // its bearing relative to the runway.
  function RunwayGlyph({ angle, calm, t }) {
    const size = 46;
    const arrow = t.accent || '#0a84ff';
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', flexShrink: 0 }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={t.line} strokeWidth="1.5" />
        <rect x="44" y="22" width="12" height="56" rx="2" fill={t.dark ? '#2a2f37' : '#cfd4da'} />
        <line x1="50" y1="27" x2="50" y2="73" stroke={t.dark ? '#777' : '#fff'} strokeWidth="1.4" strokeDasharray="4 4" />
        {!calm && (
          <g transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="7" x2="50" y2="40" stroke={arrow} strokeWidth="3" strokeLinecap="round" />
            <path d="M50 45 L44.5 34 L55.5 34 Z" fill={arrow} />
          </g>
        )}
      </svg>
    );
  }

  // Runways card: per-runway head/cross-wind, favoured runway highlighted.
  function RunwayCard({ ap, t }) {
    const activeWind = ap.metar?.wind || ap.ipmaEma?.wind || ap.nearestStation?.metar?.wind;
    if (!activeWind || !ap.runways || !ap.runways.length) return null;
    const w = activeWind || { dir: 0, spd: 0 };
    const calm = !w.spd;
    const rows = ap.runways.map(r => {
      const rObj = typeof r === 'string' ? {
        name: r,
        ends: r.split('/').map(id => ({ id, hdg: parseInt(id.replace(/\D/g, ''), 10) * 10 }))
      } : (r && r.ends ? r : {
        ...r,
        ends: ((r && r.name) || '').split('/').map(id => ({ id, hdg: parseInt(id.replace(/\D/g, ''), 10) * 10 }))
      });
      let best = null;
      (rObj.ends || []).forEach(e => {
        const c = windComponents(e.hdg, w.dir, w.spd || 0);
        if (!best || c.head > best.head) best = { ...c, end: e };
      });
      return { r: rObj, best };
    }).filter(row => row.best);
    if (!rows.length) return null;
    let favIdx = 0;
    rows.forEach((row, i) => { if (row.best.head > rows[favIdx].best.head) favIdx = i; });

    return (
      <Card t={t}>
        <SectionTitle t={t} badge="R" title="Runways" meta={calm ? 'Calm' : AV.windText(w)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {rows.map((row, i) => {
            const head = Math.round(row.best.head);
            const cross = Math.round(row.best.cross);
            const xmag = Math.abs(cross);
            const side = cross >= 0 ? 'R' : 'L';
            const fav = i === favIdx && !calm;
            const xColor = xmag >= 25 ? '#ff453a' : xmag >= 15 ? '#e5901a' : t.text;
            return (
              <div key={row.r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 11px', borderRadius: 12,
                background: fav ? (t.dark ? 'rgba(45,178,76,0.12)' : 'rgba(45,178,76,0.10)') : t.inset,
                border: `1px solid ${fav ? 'rgba(45,178,76,0.35)' : 'transparent'}` }}>
                <RunwayGlyph angle={row.best.angle} calm={calm} t={t} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: `800 18px ${t.mono}`, color: t.text, letterSpacing: 1 }}>{row.best.end.id}</span>
                    <span style={{ font: `500 12px ${t.body}`, color: t.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.r.name}{row.r.len ? ` · ${row.r.len.toLocaleString()}ft` : ''}
                    </span>
                    {fav && <span style={{ marginLeft: 'auto', font: `700 10px ${t.body}`, color: '#2bb24c', letterSpacing: 0.5 }}>FAVOURED</span>}
                  </div>
                  {calm ? (
                    <div style={{ font: `500 13px ${t.body}`, color: t.textDim, marginTop: 3 }}>Calm — any runway</div>
                  ) : (
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <span style={{ font: `600 13px ${t.body}`, color: head < 0 ? '#e5901a' : t.text }}>
                        {head < 0 ? 'Tail' : 'Head'} {AV.convWindVal(Math.abs(head))} {AV.windUnit()}
                      </span>
                      <span style={{ font: `700 13px ${t.body}`, color: xColor }}>
                        ⊗ {AV.convWindVal(xmag)} {AV.windUnit()}{xmag > 0 ? ' ' + side : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  function getEmaData(ap) {
    if (ap.ipmaEma) return ap.ipmaEma;
    const o = ap.syntheticTaf && ap.syntheticTaf.obs;
    if (o && o.temp_c != null) {
      return {
        raw: (ap.metar && ap.metarSource === 'IPMA') ? ap.metar.raw : `${ap.icao} IPMA EMA`,
        time: o.obs_time_utc ? o.obs_time_utc.slice(-5) + 'Z' : (ap.metar ? ap.metar.time : '—'),
        stationName: o.station_name || null,
        distKm: o.distance_km != null ? Math.round(o.distance_km) : null,
        wind: { dir: o.wind_dir_deg != null ? o.wind_dir_deg : 0, spd: Math.round(o.wind_kt || 0), gust: null },
        temp: Math.round(o.temp_c),
        dew: o.dewp_c != null ? Math.round(o.dewp_c) : '—',
        qnh: o.pressure_hpa != null ? Math.round(o.pressure_hpa) : '—',
      };
    }
    if (ap.metarSource === 'IPMA' && ap.metar) {
      return {
        raw: ap.metar.raw,
        time: ap.metar.time,
        stationName: null,
        distKm: null,
        wind: ap.metar.wind || { dir: 0, spd: 0, gust: null },
        temp: ap.metar.temp,
        dew: ap.metar.dew,
        qnh: ap.metar.qnh,
      };
    }
    return null;
  }

  // IPMA EMA observation card (Portuguese aerodromes with automatic surface station).
  function IpmaEmaCard({ ap, t, raw }) {
    const ema = getEmaData(ap);
    if (!ema) return null;
    const [showNote, setShowNote] = useState(false);
    const titleMeta = ema.time && ema.time !== '—' ? `OBS ${ema.time}` : 'AUTOMATIC';
    return (
      <Card t={t} style={{ border: `1px solid ${t.dark ? 'rgba(52,199,89,0.30)' : 'rgba(52,199,89,0.40)'}` }}>
        <SectionTitle t={t} badge="⚡" title="IPMA EMA" meta={titleMeta} />
        <div style={{ font: `500 12.5px ${t.body}`, color: t.textDim, marginBottom: 12, lineHeight: 1.4 }}>
          Surface observation from IPMA automatic weather station{ema.stationName ? <> · <strong style={{ color: t.text }}>{ema.stationName}</strong></> : ''}{ema.distKm != null ? ` · ${ema.distKm} km away` : ''}
        </div>
        {raw ? (
          <div style={{ font: `500 13.5px ${t.mono}`, color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            background: t.inset, borderRadius: 12, padding: 14 }}>{ema.raw}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', rowGap: 18, columnGap: 12 }}>
            <Metric t={t} icon="wind" label="Wind" value={AV.windText(ema.wind)} />
            <Metric t={t} icon="thermo" label="Temp" value={AV.fmtTemp(ema.temp)} />
            <Metric t={t} icon="droplet" label="Dew pt" value={AV.fmtTemp(ema.dew)} />
            <Metric t={t} icon="gauge" label="QNH" value={AV.convPressVal(ema.qnh)} sub={AV.pressUnit()} />
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 6, font: `500 12px ${t.body}`, color: t.textDim, background: t.inset, padding: '7px 10px', borderRadius: 8 }}>
              <span>Automatic station (no cloud ceiling or visibility sensors).</span>
            </div>
          </div>
        )}
        <div onClick={() => setShowNote(v => !v)} role="button"
          style={{ display: 'flex', gap: 8, marginTop: 14, padding: '9px 12px', borderRadius: 12, cursor: 'pointer',
          background: t.dark ? 'rgba(52,199,89,0.12)' : 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.22)' }}>
          <span style={{ color: '#34c759', marginTop: 1 }}>{window.Icon.bell({ size: 15, stroke: 2.2 })}</span>
          <span style={{ flex: 1, font: `500 12px ${t.body}`, color: t.dark ? '#85e89d' : '#22863a', lineHeight: 1.4 }}>
            <strong>Automatic station (EMA).</strong>
            {showNote && <> Not an official aviation METAR. Surface observation provided by IPMA for general meteorological monitoring.</>}
          </span>
          <span style={{ color: '#34c759', opacity: 0.8, font: `700 11px ${t.body}`, marginTop: 1, whiteSpace: 'nowrap' }}>{showNote ? 'Less' : 'More'}</span>
        </div>
      </Card>
    );
  }


  // Nearest official reporting station (METAR + TAF).
  function NearestStationCard({ ap, t, raw }) {
    const ns = ap.nearestStation;
    if (!ns || (!ns.metar && !ns.taf)) return null;
    const nm = ns.metar;
    const ntf = ns.taf;
    const cat = AV.cat(ns.category);
    const cloudText = nm && nm.clouds ? nm.clouds.map(c => c.base ? `${c.cover} ${c.base.toLocaleString()}ft` : c.cover).join(' · ') : '';
    return (
      <Card t={t} style={{ border: `1px solid ${t.dark ? 'rgba(10,132,255,0.30)' : 'rgba(10,132,255,0.35)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: t.inset, color: t.accent,
            display: 'grid', placeItems: 'center', font: `700 13px ${t.mono}` }}>📍</span>
          <span style={{ font: `700 18px ${t.display}`, color: t.text, letterSpacing: -0.2 }}>
            Nearest Station · {ns.icao}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <window.CatDot category={ns.category} size={9} />
            <span style={{ font: `700 12px ${t.mono}`, color: cat.color }}>{cat.label}</span>
          </span>
        </div>
        <div style={{ font: `500 12.5px ${t.body}`, color: t.textDim, marginBottom: 14, lineHeight: 1.4 }}>
          Closest official reporting airport: <strong style={{ color: t.text }}>{ns.name}</strong>{ns.city ? ` (${ns.city})` : ''} · <strong style={{ color: t.accent }}>{ns.distKm} km away</strong>
        </div>

        {/* Nearest METAR */}
        {nm && (
          <div style={{ background: t.inset, borderRadius: 12, padding: '12px 14px', marginBottom: ntf ? 12 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ font: `700 13px ${t.mono}`, color: t.text }}>METAR ({ns.icao})</span>
              <span style={{ font: `500 12px ${t.mono}`, color: t.textDim }}>OBS {nm.time}</span>
            </div>
            {raw ? (
              <div style={{ font: `500 12.5px ${t.mono}`, color: t.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{nm.raw}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', rowGap: 12, columnGap: 10 }}>
                <Metric t={t} icon="wind" label="Wind" value={AV.windText(nm.wind)} />
                <Metric t={t} icon="eye" label="Visibility" value={nm.vis} />
                <Metric t={t} icon="layers" label="Cloud" value={cloudText || 'Clear'} />
                <Metric t={t} icon="thermo" label="Temp" value={AV.fmtTemp(nm.temp)} />
                <Metric t={t} icon="droplet" label="Dew pt" value={AV.fmtTemp(nm.dew)} />
                <Metric t={t} icon="gauge" label="QNH" value={AV.convPressVal(nm.qnh)} sub={AV.pressUnit()} />
              </div>
            )}
          </div>
        )}

        {/* Nearest TAF */}
        {ntf && (
          <div style={{ background: t.inset, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ font: `700 13px ${t.mono}`, color: t.text }}>TAF ({ns.icao})</span>
              <span style={{ font: `500 12px ${t.mono}`, color: t.textDim }}>ISS {ntf.issued}</span>
            </div>
            {raw ? (
              <div style={{ font: `500 12.5px ${t.mono}`, color: t.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{ntf.raw}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ font: `500 12px ${t.body}`, color: t.textDim }}>Valid {ntf.valid}</div>
                {ntf.periods && ntf.periods.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <window.CatDot category={p.cat} size={8} />
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: t.text }}>{p.label}</span>
                      <span style={{ color: t.textDim, marginLeft: 8 }}>{p.text}</span>
                      <span style={{ font: `600 11.5px ${t.mono}`, color: t.textFaint, marginLeft: 8 }}>{p.wind}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // Advisory model-generated TAF for aerodromes with no official station.
  function SyntheticTafCard({ ap, t }) {
    const s = ap.syntheticTaf;
    const [showNote, setShowNote] = useState(false);
    if (!s) return null;
    const rawTaf = s.raw || s.taf;
    if (!rawTaf) return null;
    const o = s.obs || {};
    const amber = '#e5901a';
    return (
      <Card t={t} style={{ border: `1px solid ${t.dark ? 'rgba(245,166,35,0.35)' : 'rgba(245,166,35,0.45)'}` }}>
        <SectionTitle t={t} badge="≈" title="Synthetic TAF" meta="ADVISORY" />
        <div style={{ font: `500 12.5px ${t.body}`, color: t.textDim, marginBottom: 10, lineHeight: 1.4 }}>
          Model forecast for {ap.icao}{o.station_name ? ` · neighbour obs: ${o.station_name}` : (s.station ? ` · neighbour obs: ${s.station}` : '')}.
        </div>
        <div style={{ font: `500 13.5px ${t.mono}`, color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          background: t.inset, borderRadius: 12, padding: 14 }}>{rawTaf}</div>
        <div onClick={() => setShowNote(v => !v)} role="button"
          style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
          background: t.dark ? 'rgba(245,166,35,0.16)' : 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.28)' }}>
          <span style={{ color: amber, marginTop: 1 }}>{window.Icon.bell({ size: 16, stroke: 2.2 })}</span>
          <span style={{ flex: 1, font: `500 12.5px ${t.body}`, color: t.dark ? '#f3c073' : '#9a6a12', lineHeight: 1.4 }}>
            <strong>Not for flight decisions — advisory only.</strong>
            {showNote && <> {s.advisory || 'Computer-generated model forecast for unmonitored sites.'} Always verify against official sources before flight.</>}
          </span>
          <span style={{ color: amber, opacity: 0.65, font: `700 11px ${t.body}`, marginTop: 2, whiteSpace: 'nowrap' }}>{showNote ? 'Less' : 'More'}</span>
        </div>
      </Card>
    );
  }

  // In "edit layout" mode, prepend each island with a control strip (name + up/down),
  // and make the card itself non-interactive so taps don't fire its own buttons.
  function IslandWrap({ t, editing, label, canUp, canDown, onUp, onDown, children }) {
    if (!editing) return children;
    const arrow = (up, enabled, onClick) => (
      <button onClick={enabled ? onClick : undefined} disabled={!enabled}
        style={{ all: 'unset', cursor: enabled ? 'pointer' : 'default', width: 34, height: 34, borderRadius: 10,
          display: 'grid', placeItems: 'center', background: t.surface, border: `1px solid ${t.line}`,
          opacity: enabled ? 1 : 0.35 }}>
        <span style={{ display: 'inline-flex', transform: up ? 'rotate(180deg)' : 'none' }}>
          {window.Icon.chevDown({ size: 18, color: t.text, stroke: 2.6 })}
        </span>
      </button>
    );
    return (
      <div style={{ borderRadius: t.radCard, overflow: 'hidden', border: `1.5px solid ${t.accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px 7px 12px', background: t.inset }}>
          {window.Icon.grip({ size: 17, color: t.textDim })}
          <span style={{ font: `700 12px ${t.body}`, letterSpacing: 0.4, color: t.text, textTransform: 'uppercase' }}>{label}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{arrow(true, canUp, onUp)}{arrow(false, canDown, onDown)}</span>
        </div>
        <div style={{ pointerEvents: 'none' }}>{children}</div>
      </div>
    );
  }

  function CardBriefing({ ap, t, raw, setRaw }) {
    const layout = useLayoutStore();
    const windHours = useWindHours(ap.icao);
    if (ap.error) {
      return (
        <div style={{ padding: '0 14px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderRadius: t.radCard, padding: '30px 20px', background: t.dark ? '#332222' : '#ffebeb',
            border: `1px solid ${t.dark ? '#553333' : '#ffcccc'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ marginBottom: 12 }}>{window.Icon.x({ size: 32, color: '#ff453a', stroke: 2 })}</span>
            <div style={{ font: `700 20px ${t.display}`, color: t.text, marginBottom: 6 }}>Data Unavailable</div>
            <div style={{ font: `500 15px ${t.body}`, color: t.textDim, lineHeight: 1.4 }}>
              {ap.networkError 
                ? `Could not connect to the server to fetch data for ${ap.icao}. Please check your internet connection.` 
                : `No weather data could be found for ${ap.icao}.`}
            </div>
          </div>
        </div>
      );
    }

    if (ap.isLoading) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: t.textDim, font: `500 15px ${t.body}` }}>
          Loading {ap.icao}...
        </div>
      );
    }
    
    const cat = AV.cat(ap.category);
    const emaData = getEmaData(ap);
    const activeObs = (ap.metarSource === 'OFFICIAL' && ap.metar) || emaData || ap.metar || (ap.nearestStation && ap.nearestStation.metar);
    const hasWx = !!activeObs;
    const m = activeObs || { clouds: [], wind: { dir: 0, spd: 0, gust: null }, temp: '—', dew: '—', qnh: '—', vis: '—', summary: 'No reporting station' };
    const tint = window.headerTint(ap.category, t.dark);
    const cloudText = (m.clouds || []).map(c => c.base ? `${c.cover} ${c.base.toLocaleString()}ft` : c.cover).join(' · ');

    const editing = layout.editing;
    const order = layout.order;

    const hasOfficialMetar = !!(ap.metar && ap.metarSource === 'OFFICIAL');
    const hasIpma = !!emaData;
    const hasTaf = !!ap.taf;
    const hasSynth = !!(ap.syntheticTaf && (ap.syntheticTaf.raw || ap.syntheticTaf.taf));
    const hasNearest = !!(ap.nearestStation && (ap.nearestStation.metar || ap.nearestStation.taf));

    // Which islands actually have something to show for this airport.
    const visible = {
      metar: hasOfficialMetar || (!hasIpma && !hasNearest),
      ipma_ema: hasIpma,
      taf: hasTaf,
      synthetic: hasSynth,
      nearest: hasNearest,
      wind: !!(windHours && windHours.length),
      runways: !!(hasWx && ap.runways && ap.runways.length),
      notams: !!(ap.notams && ap.notams.length),
    };
    const visibleIds = order.filter(id => visible[id]);

    const islandNode = (id) => {
      switch (id) {
        case 'metar': return (
          <Card t={t}>
            <SectionTitle t={t} badge="M" title="METAR" meta={hasOfficialMetar ? `OBS ${ap.metar.time}` : 'OFFICIAL'} />
            {!hasOfficialMetar ? (
              <div style={{ font: `500 14px ${t.body}`, color: t.textDim, lineHeight: 1.5 }}>
                No official METAR station at this aerodrome.
              </div>
            ) : raw ? (
              <div style={{ font: `500 13.5px ${t.mono}`, color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                background: t.inset, borderRadius: 12, padding: 14 }}>{ap.metar.raw}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', rowGap: 18, columnGap: 12 }}>
                <Metric t={t} icon="wind" label="Wind" value={AV.windText(ap.metar.wind)} />
                <Metric t={t} icon="eye" label="Visibility" value={ap.metar.vis} />
                <Metric t={t} icon="layers" label="Cloud" value={cloudText || 'Clear'} />
                <Metric t={t} icon="thermo" label="Temp" value={AV.fmtTemp(ap.metar.temp)} />
                <Metric t={t} icon="droplet" label="Dew pt" value={AV.fmtTemp(ap.metar.dew)} />
                <Metric t={t} icon="gauge" label="QNH" value={AV.convPressVal(ap.metar.qnh)} sub={AV.pressUnit()} />
              </div>
            )}
          </Card>
        );
        case 'ipma_ema': return <IpmaEmaCard ap={ap} t={t} raw={raw} />;

        case 'taf': return (
          <Card t={t}>
            <SectionTitle t={t} badge="T" title="TAF" meta={ap.taf ? `ISS ${ap.taf.issued}` : ''} />
            {raw ? (
              <div style={{ font: `500 13.5px ${t.mono}`, color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                background: t.inset, borderRadius: 12, padding: 14 }}>{ap.taf.raw}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ font: `500 12.5px ${t.body}`, color: t.textDim, marginBottom: 12 }}>Valid {ap.taf.valid}</div>
                {ap.taf.periods && ap.taf.periods.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 14, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <window.CatDot category={p.cat} size={9} />
                      {i < ap.taf.periods.length - 1 && <div style={{ width: 2, flex: 1, background: t.hair, marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: `700 13px ${t.body}`, color: t.text }}>{p.label}</div>
                      <div style={{ font: `500 14px ${t.body}`, color: t.textDim, marginTop: 2, textWrap: 'pretty' }}>{p.text}</div>
                      <div style={{ font: `600 12px ${t.mono}`, color: t.textFaint, marginTop: 3 }}>{p.wind}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
        case 'synthetic': return <SyntheticTafCard ap={ap} t={t} />;
        case 'nearest': return <NearestStationCard ap={ap} t={t} raw={raw} />;
        case 'wind': return <WindForecast hours={windHours} t={t} />;
        case 'runways': return <RunwayCard ap={ap} t={t} />;
        case 'notams': return <NotamCard ap={ap} t={t} />;
        default: return null;
      }
    };

    return (
      <div style={{ padding: '0 14px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Hero */}
        <div style={{ borderRadius: t.radCard, padding: '20px 20px 22px', background: tint,
          position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <window.CatDot category={ap.category} size={11} />
                <span style={{ font: `700 13px ${t.body}`, color: cat.color, letterSpacing: 0.3 }}>{cat.label} · {cat.name}</span>
              </div>
              <div style={{ font: `700 38px ${t.display}`, color: t.text, letterSpacing: -0.8, lineHeight: 1.05, marginTop: 6 }}>{ap.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span style={{ font: `700 13px ${t.mono}`, color: t.textDim, letterSpacing: 1 }}>{ap.icao}</span>
                <span style={{ font: `500 13px ${t.body}`, color: t.textDim }}>· {ap.city}</span>
              </div>
              {emaData && !hasOfficialMetar && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '3px 9px', borderRadius: 6,
                  background: t.dark ? 'rgba(52,199,89,0.20)' : 'rgba(52,199,89,0.15)', font: `700 11.5px ${t.body}`, color: t.dark ? '#85e89d' : '#22863a' }}>
                  ⚡ IPMA EMA · {emaData.stationName || 'Automatic station'}{emaData.distKm != null ? ` (${emaData.distKm} km)` : ''}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ font: `300 52px ${t.body}`, color: t.text, lineHeight: 0.9, letterSpacing: -2 }}>{typeof m.temp === 'number' ? AV.convTempVal(m.temp) : m.temp}°</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ font: `500 15px ${t.body}`, color: t.text, maxWidth: 200, textWrap: 'pretty' }}>{m.summary}</div>
            {hasWx
              ? <window.WindDial dir={m.wind.dir} spd={m.wind.spd} gust={m.wind.gust} size={84} t={t} />
              : <span style={{ font: `300 40px ${t.body}`, color: t.textFaint }}>—</span>}
          </div>
          {ap.windAlert && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 14,
              padding: '6px 11px', borderRadius: 999, background: t.dark ? 'rgba(245,166,35,0.18)' : 'rgba(245,166,35,0.16)' }}>
              {window.Icon.wind({ size: 14, color: '#e5901a', stroke: 2 })}
              <span style={{ font: `700 12px ${t.body}`, color: '#e5901a', letterSpacing: 0.2 }}>WIND ALERT · ≥ 15 kt</span>
            </div>
          )}
          
          {ap.isFallback && ap.nearestStation && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14,
              padding: '10px 12px', borderRadius: 12, background: t.dark ? 'rgba(10,132,255,0.16)' : 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.28)' }}>
              <span style={{ color: t.accent, marginTop: 1 }}>{window.Icon.bell({ size: 16, stroke: 2.2 })}</span>
              <span style={{ font: `500 13px ${t.body}`, color: t.dark ? '#70b5ff' : '#0055cc', lineHeight: 1.4 }}>
                <strong>Nearest station active.</strong> Showing {ap.nearestStation.icao} ({ap.nearestStation.name}){ap.nearestStation.distKm != null ? ` · ${ap.nearestStation.distKm} km away` : ''}.
              </span>
            </div>
          )}
        </div>

        {/* updated + toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 13px ${t.body}`, color: t.textDim }}>
            {window.Icon.refresh({ size: 13, color: t.textDim, stroke: 2 })} Updated {hasWx ? AV.ago(ap.updatedMin) : '—'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RawToggle raw={raw} setRaw={setRaw} t={t} />
            <button onClick={() => setLayoutEditing(!editing)} title="Edit layout"
              style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 30, padding: editing ? '0 12px' : '0 8px', borderRadius: 999,
                background: editing ? t.accent : t.inset, border: editing ? 'none' : `1px solid ${t.line}` }}>
              {editing ? (
                <React.Fragment>
                  {window.Icon.check({ size: 15, color: '#fff', stroke: 2.8 })}
                  <span style={{ font: `700 12px ${t.body}`, color: '#fff' }}>Done</span>
                </React.Fragment>
              ) : window.Icon.grip({ size: 18, color: t.textDim })}
            </button>
          </div>
        </div>

        {editing && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 6px' }}>
            <span style={{ marginTop: 1 }}>{window.Icon.grip({ size: 15, color: t.textDim })}</span>
            <span style={{ font: `500 12.5px ${t.body}`, color: t.textDim, lineHeight: 1.4, textWrap: 'pretty' }}>
              Reorder your cards with the arrows. The order is saved and applies to every airport.
            </span>
          </div>
        )}

        {/* Islands, in the user's saved order. Hidden ones (no data for this
            airport) are skipped; reorder controls appear in edit-layout mode. */}
        {order.map(id => {
          if (!visible[id]) return null;
          const node = islandNode(id);
          if (!node) return null;
          const vi = visibleIds.indexOf(id);
          return (
            <IslandWrap key={id} t={t} editing={editing} label={ISLAND_LABEL[id] || id}
              canUp={vi > 0} canDown={vi < visibleIds.length - 1}
              onUp={() => setIslandOrder(moveIsland(order, visibleIds, id, -1))}
              onDown={() => setIslandOrder(moveIsland(order, visibleIds, id, 1))}>
              {node}
            </IslandWrap>
          );
        })}
      </div>
    );
  }

  window.CardBriefing = CardBriefing;
})();
