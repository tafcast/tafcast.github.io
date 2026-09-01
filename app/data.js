// Aviation weather sample data + decode helpers.
// European conventions: knots, °C, hPa, 24h Zulu.
// Exposed on window.AV

(function () {
  // Standard aviation flight-category colors (FAA/ICAO convention)
  const CAT = {
    VFR:  { label: 'VFR',  color: '#2bb24c', name: 'Visual'   },
    MVFR: { label: 'MVFR', color: '#3a86ff', name: 'Marginal' },
    IFR:  { label: 'IFR',  color: '#ff453a', name: 'Instrument' },
    LIFR: { label: 'LIFR', color: '#d65bd6', name: 'Low IFR'  },
  };

  const airports = {
    LPBJ: {
      icao: 'LPBJ', name: 'Beja', city: 'Beja', country: 'Portugal',
      lat: '38°04′N', lon: '07°56′W', elev: 636,
      runways: ['01/19'],
      category: 'VFR',
      updatedMin: 3,
      windAlert: false,
      metar: {
        raw: 'LPBJ 041530Z 32008KT 9999 FEW040 25/11 Q1019',
        time: '15:30Z',
        wind: { dir: 320, spd: 8, gust: null },
        visM: 9999, vis: '10+ km',
        clouds: [{ cover: 'FEW', base: 4000 }],
        temp: 25, dew: 11, qnh: 1019,
        summary: 'Clear, light NW breeze',
      },
      taf: {
        raw: 'LPBJ 041100Z 0412/0512 32010KT CAVOK\n      BECMG 0418/0420 31006KT',
        issued: '11:00Z', valid: '04 12:00Z → 05 12:00Z',
        periods: [
          { label: 'Now → 18:00Z', wind: '320° 10 kt', text: 'CAVOK — ceiling & visibility OK', cat: 'VFR' },
          { label: '18:00 → 20:00Z', wind: '310° 6 kt', text: 'Becoming lighter, backing NW', cat: 'VFR' },
        ],
      },
      notams: [],   // sample airports carry no demo NOTAMs — live NOTAMs come from the backend
    },

    LPCS: {
      icao: 'LPCS', name: 'Cascais', city: 'Cascais · Tires', country: 'Portugal',
      lat: '38°43′N', lon: '09°21′W', elev: 326,
      runways: ['17/35'],
      category: 'MVFR',
      updatedMin: 6,
      windAlert: true,
      metar: {
        raw: 'LPCS 041530Z 29014G24KT 9999 SCT012 BKN025 19/15 Q1016',
        time: '15:30Z',
        wind: { dir: 290, spd: 14, gust: 24 },
        visM: 9999, vis: '10+ km',
        clouds: [{ cover: 'SCT', base: 1200 }, { cover: 'BKN', base: 2500 }],
        temp: 19, dew: 15, qnh: 1016,
        summary: 'Windy, broken cloud at 2500 ft',
      },
      taf: {
        raw: 'LPCS 041130Z 0412/0512 29013KT 9999 BKN025\n      TEMPO 0414/0418 30018G28KT',
        issued: '11:30Z', valid: '04 12:00Z → 05 12:00Z',
        periods: [
          { label: 'Now → 14:00Z', wind: '290° 13 kt', text: 'Broken cloud 2500 ft', cat: 'MVFR' },
          { label: '14:00 → 18:00Z · TEMPO', wind: '300° 18 kt G28', text: 'Gusty westerly, temporary', cat: 'MVFR' },
        ],
      },
      notams: [],
    },

    LPEV: {
      icao: 'LPEV', name: 'Évora', city: 'Évora', country: 'Portugal',
      lat: '38°32′N', lon: '07°53′W', elev: 807,
      runways: ['01/19', '07/25'],
      category: 'VFR',
      updatedMin: 11,
      windAlert: false,
      metar: {
        raw: 'LPEV 041500Z 01006KT 9999 SKC 26/09 Q1019',
        time: '15:00Z',
        wind: { dir: 10, spd: 6, gust: null },
        visM: 9999, vis: '10+ km',
        clouds: [{ cover: 'SKC', base: null }],
        temp: 26, dew: 9, qnh: 1019,
        summary: 'Sky clear, calm',
      },
      taf: {
        raw: 'LPEV 041100Z 0412/0512 36006KT CAVOK',
        issued: '11:00Z', valid: '04 12:00Z → 05 12:00Z',
        periods: [
          { label: 'Now → 12:00Z (+1)', wind: '360° 6 kt', text: 'CAVOK — ceiling & visibility OK', cat: 'VFR' },
        ],
      },
      notams: [],
    },
  };

  // Airports available to add (search results)
  const directory = [
    { icao: 'LPPT', name: 'Lisboa', city: 'Lisbon', category: 'VFR' },
    { icao: 'LPPR', name: 'Porto', city: 'Porto · Sá Carneiro', category: 'MVFR' },
    { icao: 'LPFR', name: 'Faro', city: 'Faro', category: 'VFR' },
    { icao: 'LPPM', name: 'Portimão', city: 'Portimão', category: 'VFR' },
    { icao: 'LPMR', name: 'Monte Real', city: 'Monte Real AB', category: 'IFR' },
    { icao: 'LPVR', name: 'Vila Real', city: 'Vila Real', category: 'MVFR' },
  ];

  function cat(c) { return CAT[c] || CAT.VFR; }

  // Map an ICAO code to a country name via its prefix, so airports group tidily
  // by country as more are added. Falls back to 'Other' for unknown prefixes.
  const ICAO_COUNTRIES = {
    LP: 'Portugal', LE: 'Spain', GC: 'Spain', GE: 'Spain', LF: 'France',
    EG: 'United Kingdom', EI: 'Ireland', ED: 'Germany', ET: 'Germany',
    LI: 'Italy', LS: 'Switzerland', LO: 'Austria', EB: 'Belgium', EL: 'Luxembourg',
    EH: 'Netherlands', EK: 'Denmark', ES: 'Sweden', EN: 'Norway', EF: 'Finland',
    EP: 'Poland', LK: 'Czechia', LZ: 'Slovakia', LH: 'Hungary', LR: 'Romania',
    LB: 'Bulgaria', LD: 'Croatia', LJ: 'Slovenia', LG: 'Greece', LM: 'Malta',
    LC: 'Cyprus', LT: 'Turkey', UK: 'Ukraine', GM: 'Morocco', DA: 'Algeria',
    DT: 'Tunisia', LL: 'Israel', K: 'United States', C: 'Canada',
  };
  function country(icao) {
    if (!icao) return 'Other';
    const p2 = icao.slice(0, 2).toUpperCase();
    if (ICAO_COUNTRIES[p2]) return ICAO_COUNTRIES[p2];
    const p1 = icao.slice(0, 1).toUpperCase();
    return ICAO_COUNTRIES[p1] || 'Other';
  }

  // On-device cache of airport metadata for airports the user has added/searched,
  // so names/countries are available offline (the full catalog lives on the backend).
  let metaCache = {};
  try { metaCache = JSON.parse(localStorage.getItem('av_airport_meta')) || {}; } catch (e) {}

  // Normalise a backend URL: drop trailing slashes and upgrade http://→https:// for
  // real hosts. The native widget fetches with HttpURLConnection, which refuses to
  // follow an http→https redirect (and release builds block cleartext outright), so a
  // stored "http://…" URL fails 100% of the time even when the server is healthy.
  // Keep http only for local dev hosts (localhost / LAN / the emulator's 10.0.2.2).
  function normalizeBase(u) {
    u = (u || '').trim().replace(/\/+$/, '');
    if (/^http:\/\//i.test(u)) {
      const host = u.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2'
        || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
      if (!isLocal) u = u.replace(/^http:\/\//i, 'https://');
    }
    return u;
  }

  // Effective backend URL: an in-app override (Settings) wins, then the value
  // baked in at build time, then the emulator default.
  function apiBase() {
    try { const o = (localStorage.getItem('av_api_base') || '').trim(); if (o) return normalizeBase(o); } catch (e) {}
    return normalizeBase(window.AV_API_BASE || (window.location.protocol === 'file:' ? 'http://10.0.2.2:3000' : ''));
  }

  function rememberAirports(list) {
    let changed = false;
    (list || []).forEach(a => {
      if (a && a.icao) {
        metaCache[a.icao] = {
          icao: a.icao, name: a.name || a.icao, city: a.city || '',
          category: a.category || 'VFR', country: a.country || '',
        };
        changed = true;
      }
    });
    if (changed) { try { localStorage.setItem('av_airport_meta', JSON.stringify(metaCache)); } catch (e) {} }
  }

  // Safe metadata lookup for ANY icao. Always returns an object, so callers never
  // crash on an unknown code.
  function meta(icao) {
    return airports[icao] || metaCache[icao]
      || (directory || []).find(d => d.icao === icao)
      || { icao, name: icao, city: '', category: 'VFR' };
  }

  // Compass point from degrees
  function compass(deg) {
    const pts = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return pts[Math.round(deg / 22.5) % 16];
  }

  // ---- Units (user-selectable; data arrives in kt / °C / hPa) ----
  const units = (() => {
    try {
      return {
        temp: localStorage.getItem('av_unit_temp') || 'C',    // C | F
        wind: localStorage.getItem('av_unit_wind') || 'kt',   // kt | kmh | mph
        press: localStorage.getItem('av_unit_press') || 'hPa', // hPa | inHg
      };
    } catch (e) { return { temp: 'C', wind: 'kt', press: 'hPa' }; }
  })();
  function setUnit(k, v) { units[k] = v; try { localStorage.setItem('av_unit_' + k, v); } catch (e) {} }

  function convTempVal(c) { if (typeof c !== 'number') return c; return units.temp === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c); }
  function tempUnit() { return units.temp === 'F' ? '°F' : '°C'; }
  function fmtTemp(c) { return typeof c === 'number' ? convTempVal(c) + tempUnit() : (c || '—'); }

  function convWindVal(kt) { if (typeof kt !== 'number') return kt; if (units.wind === 'kmh') return Math.round(kt * 1.852); if (units.wind === 'mph') return Math.round(kt * 1.151); return Math.round(kt); }
  function windUnit() { return units.wind === 'kmh' ? 'km/h' : units.wind === 'mph' ? 'mph' : 'kt'; }

  function convPressVal(hpa) { if (typeof hpa !== 'number') return hpa; return units.press === 'inHg' ? (hpa * 0.02953).toFixed(2) : Math.round(hpa); }
  function pressUnit() { return units.press === 'inHg' ? 'inHg' : 'hPa'; }
  function fmtPress(hpa) { return (typeof hpa === 'number' ? convPressVal(hpa) : (hpa || '—')) + ' ' + pressUnit(); }

  function windText(w) {
    if (!w || w.spd === 0) return 'Calm';
    let s = `${String(w.dir).padStart(3, '0')}° ${compass(w.dir)} · ${convWindVal(w.spd)} ${windUnit()}`;
    if (w.gust) s += ` G${convWindVal(w.gust)}`;
    return s;
  }

  function ago(min) {
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    return `${h}h ago`;
  }

  window.AV = {
    CAT, cat, meta, rememberAirports, apiBase, country, airports, directory,
    compass, windText, ago,
    // units
    units, setUnit, convTempVal, tempUnit, fmtTemp, convWindVal, windUnit, convPressVal, pressUnit, fmtPress,
    // default saved order for the app
    saved: ['LPBJ', 'LPCS', 'LPEV'],
  };

  // Push saved airports + backend URL + widget settings to the native
  // home-screen widget (no-op in a plain browser). Reads the current values
  // from localStorage so any screen can call it after changing settings.
  window.AV_syncWidget = function () {
    try {
      if (!(window.AndroidWidget && window.AndroidWidget.sync)) return;
      const saved = JSON.parse(localStorage.getItem('av_saved') || 'null') || window.AV.saved;
      const base = apiBase();
      const cfg = {
        icao: localStorage.getItem('av_widget_icao') || saved[0] || '',
        mode: localStorage.getItem('av_widget_mode') || 'summary',
        dark: localStorage.getItem('av_widget_dark') !== 'false',
        alerts: {
          windOn: localStorage.getItem('av_alert_windOn') !== 'false',
          windKt: parseInt(localStorage.getItem('av_alert_windKt'), 10) || 15,
          gust: localStorage.getItem('av_alert_gust') !== 'false',
          catChg: localStorage.getItem('av_alert_catChg') !== 'false',
          notam: localStorage.getItem('av_alert_notam') === 'true',
        },
      };
      window.AndroidWidget.sync(JSON.stringify(saved), base, JSON.stringify(cfg));
    } catch (e) {}
  };
})();
