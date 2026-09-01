/* Widget card (small/medium) + iOS home-screen mockup. window.WidgetCard, window.HomeWidget */
(function () {
  const { useState, useRef } = React;
  const AV = window.AV;

  // A single home-screen widget for one airport.
  function WidgetCard({ ap, mode = 'summary', size = 'small', dark = true, mono }) {
    const cat = AV.cat(ap.category);
    const m = ap.metar || ap.ipmaEma || (ap.nearestStation && ap.nearestStation.metar) || { wind: { dir: 0, spd: 0 }, temp: '—', qnh: '—', clouds: [] };
    const bg = dark ? '#15181d' : '#ffffff';
    const text = dark ? '#fff' : '#10131a';
    const dim = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
    const faint = dark ? 'rgba(235,235,245,0.32)' : 'rgba(60,60,67,0.3)';
    const wind = `${String(m.wind.dir).padStart(3, '0')}/${m.wind.spd}${m.wind.gust ? `G${m.wind.gust}` : ''}`;
    const radius = 22;

    const Head = () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 9, height: 9, borderRadius: 9, background: cat.color }} />
        <span style={{ font: `800 15px ${mono}`, color: text, letterSpacing: 0.5 }}>{ap.icao}</span>
        <span style={{ font: `700 11px ${mono}`, color: cat.color, marginLeft: 'auto', letterSpacing: 0.5 }}>{cat.label}</span>
      </div>
    );

    if (size === 'small') {
      return (
        <div style={{ width: 158, height: 158, borderRadius: radius, background: bg, padding: 15, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          <Head />
          {mode === 'taf' ? (
            <div style={{ marginTop: 12, flex: 1 }}>
              <div style={{ font: `600 10px ${mono}`, color: faint, letterSpacing: 1 }}>TAF NEXT</div>
              <div style={{ font: `600 14px ${mono}`, color: text, marginTop: 6, lineHeight: 1.3 }}>{(ap.taf && ap.taf.periods && ap.taf.periods[0] && ap.taf.periods[0].wind) || (ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.periods && ap.nearestStation.taf.periods[0] && ap.nearestStation.taf.periods[0].wind) || '—'}</div>
              <div style={{ font: `400 12px -apple-system, system-ui`, color: dim, marginTop: 6, lineHeight: 1.3, textWrap: 'pretty' }}>{(ap.taf && ap.taf.periods && ap.taf.periods[0] && ap.taf.periods[0].text) || (ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.periods && ap.nearestStation.taf.periods[0] && ap.nearestStation.taf.periods[0].text) || 'No forecast'}</div>
            </div>
          ) : (
            <div style={{ marginTop: 'auto' }}>
              <div style={{ font: `200 44px -apple-system, system-ui`, color: text, lineHeight: 1, letterSpacing: -1 }}>{m.temp}°</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, font: `600 11px ${mono}`, color: dim }}>
                <span>{wind}</span><span>Q{m.qnh}</span>
              </div>
            </div>
          )}
          <div style={{ font: `500 9px ${mono}`, color: faint, marginTop: 8, letterSpacing: 0.5 }}>UPD {AV.ago(ap.updatedMin).toUpperCase()}</div>
        </div>
      );
    }

    // medium — ALWAYS the TAF (raw or decoded) + a WIND / CEILING / QNH side panel from the
    // latest METAR, mirroring the native home-screen widget.
    const ceil = (() => {
      const cs = (m.clouds || []).filter(c => (c.cover === 'BKN' || c.cover === 'OVC') && c.base != null);
      return cs.length ? Math.min(...cs.map(c => c.base)) + "'" : 'NSC';
    })();
    const tafBody = (ap.taf && ap.taf.raw)
      ? (mode === 'decoded'
          ? (ap.taf.periods || []).map(p => `${p.label}\n  ${p.wind}${p.text ? '  ' + p.text : ''}`).join('\n')
          : ap.taf.raw)
      : (ap.syntheticTaf && ap.syntheticTaf.raw) ? ap.syntheticTaf.raw   // advisory model TAF when no official one
      : (ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.raw) ? ap.nearestStation.taf.raw
      : 'No TAF available.';
    return (
      <div style={{ width: 338, height: 158, borderRadius: radius, background: bg, padding: 15, boxSizing: 'border-box',
        display: 'flex', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Head />
          <div style={{ font: `500 11px -apple-system, system-ui`, color: dim, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ap.name}</div>
          <div style={{ marginTop: 7, flex: 1, font: `500 11.5px ${mono}`, color: dim, lineHeight: 1.35,
            whiteSpace: 'pre-wrap', overflow: 'hidden',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 6 }}>{tafBody}</div>
        </div>
        <div style={{ width: 1, background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', margin: '2px 12px' }} />
        <div style={{ width: 82, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
          {[['WIND', wind], ['CEILING', ceil], ['QNH', `${m.qnh}`]].map(([l, v]) => (
            <div key={l}>
              <div style={{ font: `600 9px ${mono}`, color: faint, letterSpacing: 1 }}>{l}</div>
              <div style={{ font: `700 13px ${mono}`, color: text, marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // App icon helper
  function AppIcon({ label, bg, glyph }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 62 }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, background: bg, display: 'grid', placeItems: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{glyph}</div>
        <span style={{ font: '500 11px -apple-system, system-ui', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{label}</span>
      </div>
    );
  }

  // Wraps a WidgetCard so it can swipe (drag) OR tap to cycle through aerodromes.
  function Swipeable({ order, startIdx = 0, mode, size, dark, mono }) {
    const [idx, setIdx] = useState(startIdx % order.length);
    const d = useRef({ x0: null, moved: false });
    const ap = AV.airports[order[idx]];
    const n = order.length;

    const down = (e) => { const p = e.touches ? e.touches[0] : e; d.current = { x0: p.clientX, moved: false }; };
    const move = (e) => { if (d.current.x0 == null) return; const p = e.touches ? e.touches[0] : e; if (Math.abs(p.clientX - d.current.x0) > 6) d.current.moved = true; };
    const up = (e) => {
      if (d.current.x0 == null) return;
      const p = e.changedTouches ? e.changedTouches[0] : e;
      const dx = p.clientX - d.current.x0;
      if (dx < -34) setIdx(i => (i + 1) % n);
      else if (dx > 34) setIdx(i => (i - 1 + n) % n);
      else if (!d.current.moved) setIdx(i => (i + 1) % n); // tap cycles forward
      d.current.x0 = null;
    };

    const dotPos = size === 'small'
      ? { bottom: 13, right: 14 }
      : { bottom: 9, left: '50%', transform: 'translateX(-50%)' };
    const ds = size === 'small' ? 4 : 5;

    return (
      <div onMouseDown={down} onMouseMove={move} onMouseUp={up}
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
        style={{ position: 'relative', cursor: 'grab', userSelect: 'none' }}>
        <WidgetCard ap={ap} mode={mode} size={size} dark={dark} mono={mono} />
        <div style={{ position: 'absolute', display: 'flex', gap: 4, ...dotPos }}>
          {order.map((_, i) => (
            <span key={i} style={{ width: ds, height: ds, borderRadius: 5,
              background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)' }} />
          ))}
        </div>
      </div>
    );
  }

  // iOS home screen — every widget (medium + smalls) swipes/taps through aerodromes
  function HomeWidget({ mono }) {
    const order = AV.saved;

    const logo = (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 13h16a3 3 0 1 1-3 3" /><path d="M3 18h8a2.5 2.5 0 1 1-2.5 2.5" />
      </svg>
    );

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(165deg, #1b2a4a 0%, #2e4063 38%, #6a5a78 72%, #b98a6e 100%)' }}>
        <div style={{ height: 58 }} />
        <div style={{ textAlign: 'center', color: '#fff', marginTop: 6 }}>
          <div style={{ font: '600 17px -apple-system, system-ui', letterSpacing: 1, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Wednesday, 4 June</div>
          <div style={{ font: '200 76px -apple-system, system-ui', lineHeight: 1, marginTop: 2, textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>15:32</div>
        </div>

        <div style={{ padding: '26px 22px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {/* swipeable medium widget */}
          <Swipeable order={order} startIdx={0} mode="summary" size="medium" dark mono={mono} />
          {/* two small widgets — each independently swipes/taps through aerodromes */}
          <div style={{ display: 'flex', gap: 18 }}>
            <Swipeable order={order} startIdx={0} mode="metar" size="small" dark mono={mono} />
            <Swipeable order={order} startIdx={1} mode="taf" size="small" dark mono={mono} />
          </div>
        </div>

        {/* dock hint */}
        <div style={{ marginTop: 'auto', padding: '0 18px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '14px 16px',
            borderRadius: 30, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            <AppIcon label="" bg="linear-gradient(160deg,#0a84ff,#0356b6)" glyph={logo} />
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.22)' }} />
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.22)' }} />
            <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.22)' }} />
          </div>
        </div>
      </div>
    );
  }

  window.WidgetCard = WidgetCard;
  window.HomeWidget = HomeWidget;
})();
