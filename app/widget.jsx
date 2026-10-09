/* Widget card (small/medium) + iOS home-screen mockup. window.WidgetCard, window.HomeWidget */
(function () {
  const { useState, useRef } = React;
  const AV = window.AV;

  function decodeRawTaf(raw) {
    if (!raw) return '';
    const clean = raw.replace(/=/g, '').trim();
    const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const segments = [];
    lines.forEach(line => {
      const parts = line.split(/\s+(?=(?:BECMG|TEMPO|FM\d{6}|PROB\d\d)\b)/i);
      parts.forEach(p => { if (p.trim()) segments.push(p.trim()); });
    });
    if (!segments.length) return clean;

    return segments.map((seg, i) => {
      const tokens = seg.split(/\s+/);
      let label = '', change = '', wind = '';
      const conds = [];
      let startIdx = 0;
      if (/^(BECMG|TEMPO)$/i.test(tokens[0])) {
        change = tokens[0].toUpperCase();
        startIdx = 1;
      } else if (/^PROB\d\d$/i.test(tokens[0])) {
        change = tokens[0].toUpperCase();
        startIdx = 1;
        if (tokens[1] && /^TEMPO$/i.test(tokens[1])) {
          change += ' TEMPO';
          startIdx = 2;
        }
      } else if (/^FM\d{6}$/i.test(tokens[0])) {
        const hr = tokens[0].slice(4, 6), min = tokens[0].slice(6, 8);
        label = 'From ' + hr + ':' + min + 'Z';
        startIdx = 1;
      }
      for (let j = startIdx; j < tokens.length; j++) {
        const tok = tokens[j];
        if (i === 0 && j < 4 && /^(TAF|SAO|AMD|COR|[A-Z]{4}|\d{6}Z)$/i.test(tok)) continue;
        const valMatch = tok.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/);
        if (valMatch && !label) {
          label = valMatch[2] + ':00Z \u2192 ' + valMatch[4] + ':00Z' + (change ? ' \u00b7 ' + change : '');
          continue;
        }
        const wMatch = tok.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?KT$/i);
        if (wMatch && !wind) {
          const dir = wMatch[1] === 'VRB' ? 'VRB' : wMatch[1] + '\u00b0';
          wind = dir + ' ' + parseInt(wMatch[2], 10) + (wMatch[3] ? 'G' + parseInt(wMatch[3], 10) : '') + ' kt';
          continue;
        }
        if (/^CAVOK$/i.test(tok)) { conds.push('CAVOK \u2014 ceiling & vis OK'); continue; }
        if (/^\d{4}$/.test(tok)) {
          const meters = parseInt(tok, 10);
          if (meters >= 9999) conds.push('10+ km');
          else conds.push((meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1) + ' km');
          continue;
        }
        if (/^(NSC|NCD|SKC|CLR)$/i.test(tok)) { conds.push('No significant clouds'); continue; }
        const cMatch = tok.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/i);
        if (cMatch) {
          const type = cMatch[1].toUpperCase();
          const alt = parseInt(cMatch[2], 10) * 100;
          const extra = cMatch[3] ? ' ' + cMatch[3].toUpperCase() : '';
          conds.push(type + ' ' + alt.toLocaleString() + '\'' + extra);
          continue;
        }
        const wxMap = {
          '-RA': 'Light rain', 'RA': 'Rain', '+RA': 'Heavy rain',
          '-DZ': 'Light drizzle', 'DZ': 'Drizzle', '+DZ': 'Heavy drizzle',
          '-SN': 'Light snow', 'SN': 'Snow', '+SN': 'Heavy snow',
          'TS': 'Thunderstorm', 'TSRA': 'Thunderstorm with rain', '+TSRA': 'Heavy thunderstorm with rain',
          'SHRA': 'Rain showers', '+SHRA': 'Heavy rain showers', '-SHRA': 'Light rain showers',
          'BR': 'Mist', 'FG': 'Fog', 'HZ': 'Haze', 'FU': 'Smoke', 'DU': 'Dust'
        };
        if (wxMap[tok.toUpperCase()]) { conds.push(wxMap[tok.toUpperCase()]); continue; }
      }
      if (!label) label = 'Period ' + (i + 1) + (change ? ' \u00b7 ' + change : '');
      const line2 = (wind + (conds.length ? '  ' + conds.join(' \u00b7 ') : '')).trim();
      return label + (line2 ? '\n  ' + line2 : '');
    }).join('\n');
  }

  // A single home-screen widget for one airport.
  function WidgetCard({ ap, mode = 'summary', size = 'small', dark = true, mono }) {
    const cat = AV.cat(ap.category);
    const catColor = dark ? cat.color : (ap.category === 'VFR' ? '#1b8738' : (ap.category === 'MVFR' ? '#0066cc' : (ap.category === 'IFR' ? '#d70015' : (ap.category === 'LIFR' ? '#a030a0' : cat.color))));
    const isOfficial = window.AV?.isOfficialStation ? window.AV.isOfficialStation(ap.icao) : false;
    const m = ap.metar || (!isOfficial && ap.ipmaEma) || (ap.nearestStation && ap.nearestStation.metar) || { wind: { dir: 0, spd: 0 }, temp: '—', qnh: '—', clouds: [] };
    const bg = dark ? '#15181d' : '#ffffff';
    const text = dark ? '#fff' : '#10131a';
    const dim = dark ? 'rgba(235,235,245,0.6)' : '#475569';
    const faint = dark ? 'rgba(235,235,245,0.32)' : '#64748b';
    const bodyColor = dark ? 'rgba(235,235,245,0.72)' : '#334155';
    const cardBorder = dark ? 'none' : '1px solid rgba(0,0,0,0.08)';
    const wind = `${String(m.wind.dir).padStart(3, '0')}/${m.wind.spd}${m.wind.gust ? `G${m.wind.gust}` : ''}`;
    const radius = 22;

    const Head = () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 9, height: 9, borderRadius: 9, background: catColor }} />
        <span style={{ font: `800 15px ${mono}`, color: text, letterSpacing: 0.5 }}>{ap.icao}</span>
        <span style={{ font: `700 11px ${mono}`, color: catColor, marginLeft: 'auto', letterSpacing: 0.5 }}>{cat.label}</span>
      </div>
    );

    if (size === 'small') {
      return (
        <div style={{ width: 158, height: 158, borderRadius: radius, background: bg, padding: 15, boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: cardBorder }}>
          <Head />
          {mode === 'taf' ? (
            <div style={{ marginTop: 12, flex: 1 }}>
              <div style={{ font: `600 10px ${mono}`, color: faint, letterSpacing: 1 }}>TAF NEXT</div>
              <div style={{ font: `600 14px ${mono}`, color: text, marginTop: 6, lineHeight: 1.3 }}>{(ap.taf && ap.taf.periods && ap.taf.periods[0] && ap.taf.periods[0].wind) || (ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.periods && ap.nearestStation.taf.periods[0] && ap.nearestStation.taf.periods[0].wind) || '—'}</div>
              <div style={{ font: `400 12px -apple-system, system-ui`, color: bodyColor, marginTop: 6, lineHeight: 1.3, textWrap: 'pretty' }}>{(ap.taf && ap.taf.periods && ap.taf.periods[0] && ap.taf.periods[0].text) || (ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.periods && ap.nearestStation.taf.periods[0] && ap.nearestStation.taf.periods[0].text) || 'No forecast'}</div>
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

    // medium — ALWAYS the TAF/SAO (raw or decoded) + a WIND / CEILING / QNH side panel from the
    // latest METAR, mirroring the native home-screen widget.
    const ceil = (() => {
      const cs = (m.clouds || []).filter(c => (c.cover === 'BKN' || c.cover === 'OVC') && c.base != null);
      return cs.length ? Math.min(...cs.map(c => c.base)) + "'" : 'NSC';
    })();

    const hasTaf = ap.taf && ap.taf.raw;
    const hasSynth = !isOfficial && ap.syntheticTaf && ap.syntheticTaf.raw;
    const hasNear = ap.nearestStation && ap.nearestStation.taf && ap.nearestStation.taf.raw;

    const rawTaf = hasTaf ? ap.taf.raw
      : hasSynth ? (ap.syntheticTaf.raw || '').replace(/^TAF\b/i, 'SAO')
      : hasNear ? ap.nearestStation.taf.raw
      : null;

    let tafBody;
    if (!rawTaf) {
      tafBody = 'No forecast available.';
    } else if (mode === 'raw') {
      tafBody = rawTaf;
    } else {
      // decoded
      if (hasTaf && ap.taf.periods && ap.taf.periods.length) {
        tafBody = ap.taf.periods.map(p => `${p.label}\n  ${p.wind}${p.text ? '  ' + p.text : ''}`).join('\n');
      } else {
        tafBody = decodeRawTaf(rawTaf);
      }
    }

    return (
      <div style={{ width: '100%', maxWidth: 340, minWidth: 0, height: 158, borderRadius: radius, background: bg, padding: '13px 14px', boxSizing: 'border-box',
        display: 'flex', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: cardBorder }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Head />
          <div style={{ font: `500 11px -apple-system, system-ui`, color: dim, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ap.name}</div>
          <div style={{ marginTop: 7, flex: 1, font: `500 11px ${mono}`, color: bodyColor, lineHeight: 1.35,
            whiteSpace: 'pre-wrap', overflow: 'hidden',
            display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 6 }}>{tafBody}</div>
        </div>
        <div style={{ width: 1, background: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', margin: '2px 8px', flexShrink: 0 }} />
        <div style={{ width: 74, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
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
              background: i === idx ? (dark ? '#fff' : '#10131a') : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.22)') }} />
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
