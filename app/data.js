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
    LPPT: {
      icao: 'LPPT', name: 'Lisboa', city: 'Lisbon', country: 'Portugal',
      lat: '38°46′N', lon: '09°08′W', elev: 374,
      runways: ['02/20'],
      category: 'VFR',
      updatedMin: 2,
      windAlert: false,
      metarSource: 'OFFICIAL',
      ipmaEma: null,
      syntheticTaf: null,
      metar: {
        raw: 'LPPT 091100Z 36009KT 9999 FEW030 22/13 Q1022',
        time: '11:00Z',
        wind: { dir: 360, spd: 9, gust: null },
        visM: 9999, vis: '10+ km',
        clouds: [{ cover: 'FEW', base: 3000 }],
        temp: 22, dew: 13, qnh: 1022,
        summary: 'Clear, light N breeze',
      },
      taf: {
        raw: 'LPPT 091100Z 0912/1018 36012KT CAVOK BECMG 0920/0922 01006KT',
        issued: '11:00Z', valid: '09 12:00Z → 10 18:00Z',
        periods: [
          { label: 'Now → 20:00Z', wind: '360° 12 kt', text: 'CAVOK — ceiling & visibility OK', cat: 'VFR' },
          { label: '20:00 → 22:00Z', wind: '010° 6 kt', text: 'Light north-northeasterly', cat: 'VFR' },
        ],
      },
      notams: [
        {
          id: 'A3402/26',
          sev: 'caution',
          summary: 'TWY A1 CENTRE LINE LIGHTS U/S DUE TO WIP',
          raw: 'A3402/26 NOTAMR A3384/26\nQ) LPPC/QLXAS/IV/M  /A /000/999/3846N00908W005\nA) LPPT B) 2606081011 C) 2612312359EST\nE) TWY A1 CENTRE LINE LIGHTS U/S DUE TO WIP.',
          from: '08 Jun 10:11Z',
          to: '31 Dec 23:59Z',
        },
        {
          id: 'A3942/26',
          sev: 'info',
          summary: 'EXTENSIONS OF APRON 10 AND NEW APRON 23. TWY M1 RENAMED R1. TWY K CLOSED.',
          raw: 'A3942/26 NOTAMN\nQ) LPPC/QFAHW/IV/BO /A /000/999/3846N00908W005\nA) LPPT B) 2606290954 C) 2612312359EST\nE) REF AIP SUP 083/2024 LPPT AD - MAJOR WORKS - EXTENSIONS OF APRON 10 AND NEW APRON 23.\nTWY M1 RENAMED R1.\nTWY M2, BTN T1 AND Q1 RENAMED R2.\nTWY M2, BTN Q1 AND M3 RENAMED R3.\nTHE CURRENT TEMPORARY PARKING AREA 351 CLOSED.\nTWY K CLOSED.',
          from: '29 Jun 09:54Z',
          to: '31 Dec 23:59Z',
        },
        {
          id: 'A4314/26',
          sev: 'info',
          summary: 'LISBOA IAC RNP Z RWY20 (AR) PLAN VIEW CHANGE: WAYPOINT PT502 RNP 0.3',
          raw: 'A4314/26 NOTAMN\nQ) LPPC/QPICH/I /NBO/A /000/999/3846N00908W005\nA) LPPT B) 2608060000 C) PERM\nE) LISBOA IAC RNP Z RWY20 (AR) PLAN VIEW CHANGE AS FOLLOW:\nPATH TERMINATOR: TF\nWAYPOINT IDENTIFIER: PT502\nCHANGE RNP VALUE TO: RNP 0.3.',
          from: '06 Aug 00:00Z',
          to: 'PERM',
        },
      ],
    },

    LPBJ: {
      icao: 'LPBJ', name: 'Beja', city: 'Beja', country: 'Portugal',
      lat: '38°04′N', lon: '07°56′W', elev: 636,
      runways: ['01/19'],
      category: 'VFR',
      updatedMin: 3,
      windAlert: false,
      metarSource: 'OFFICIAL',
      ipmaEma: null,
      syntheticTaf: null,
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
      notams: [
        {
          id: 'M1310/26',
          sev: 'caution',
          summary: 'RWY 01R/19L PHYSICAL CHARACTERISTICS: RWY SLIPPERY WHEN WET',
          raw: 'M1310/26 NOTAMN\nQ) LPPC/QMRLC/IV/NBO/A /000/999/3804N00756W005\nA) LPBJ B) 2609010800 C) 2611302359\nE) RWY 01R/19L PHYSICAL CHARACTERISTICS, ADD, RWY SLIPPERY WHEN WET.\nREF MIL AIP PAGE AD-2.LPBJ-8.',
          from: '01 Sep 08:00Z',
          to: '30 Nov 23:59Z',
        },
        {
          id: 'M1205/26',
          sev: 'info',
          summary: 'AERODROME OPERATIONAL HOURS MON-FRI 0800-1700 UTC',
          raw: 'M1205/26 NOTAMN\nQ) LPPC/QFAAH/IV/NBO/A /000/999/3804N00756W005\nA) LPBJ B) 2608150800 C) 2612311700\nE) AERODROME OPERATIONAL HOURS MON-FRI 0800-1700 UTC.',
          from: '15 Aug 08:00Z',
          to: '31 Dec 17:00Z',
        },
      ],
    },

    LPCS: {
      icao: 'LPCS', name: 'Cascais', city: 'Cascais · Tires', country: 'Portugal',
      lat: '38°43′N', lon: '09°21′W', elev: 326,
      runways: ['17/35'],
      category: 'VFR',
      updatedMin: 6,
      windAlert: true,
      metarSource: 'OFFICIAL',
      ipmaEma: null,
      syntheticTaf: null,
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
      notams: [
        {
          id: 'A4795/26',
          sev: 'caution',
          summary: 'RNP RWY 35: LPV MINIMA VALUES DA(H) AND OCH CHANGED TO 820(533) AND 533',
          raw: 'A4795/26 NOTAMN\nQ) LPPC/QPIAU/I /NBO/A /000/999/3843N00921W005\nA) LPCS B) 2608151200 C) PERM\nE) RNP RWY 35: LPV MINIMA VALUES DA(H) AND OCH CHANGED TO, RESPECTIVELY, 820(533) AND 533.',
          from: '15 Aug 12:00Z',
          to: 'PERM',
        },
        {
          id: 'A4210/26',
          sev: 'info',
          summary: 'CASCAIS AFIS / INFORMATION SERVICE HOURS 0600-2000 UTC DAILY',
          raw: 'A4210/26 NOTAMN\nQ) LPPC/QFAAH/IV/BO /A /000/999/3843N00921W005\nA) LPCS B) 2607010600 C) 2612312000\nE) CASCAIS AFIS HOURS OF SERVICE 0600-2000 UTC DAILY.',
          from: '01 Jul 06:00Z',
          to: '31 Dec 20:00Z',
        },
      ],
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
      notams: [
        {
          id: 'A5011/26',
          sev: 'caution',
          summary: 'LOCATOR EVR FREQ 425 KHZ U/S',
          raw: 'A5011/26 NOTAMN\nQ) LPPC/QNLAS/IV/M  /A /000/999/3832N00753W005\nA) LPEV B) 2609100800 C) 2612312359\nE) LOCATOR EVR FREQ 425 KHZ U/S.',
          from: '10 Sep 08:00Z',
          to: '31 Dec 23:59Z',
        },
      ],
    },
  };

  // Airports available to add (search results)
  const directory = [
    { icao: 'LPPT', name: 'Lisboa', city: 'Lisbon' },
    { icao: 'LPPR', name: 'Porto', city: 'Porto · Sá Carneiro' },
    { icao: 'LPFR', name: 'Faro', city: 'Faro' },
    { icao: 'LPPM', name: 'Portimão', city: 'Portimão' },
    { icao: 'LPMR', name: 'Monte Real', city: 'Monte Real AB' },
    { icao: 'LPVR', name: 'Vila Real', city: 'Vila Real' },
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
  // baked in at build time, then the production Cloud Run host.
  function apiBase() {
    try { const o = (localStorage.getItem('av_api_base') || '').trim(); if (o) return normalizeBase(o); } catch (e) {}
    return normalizeBase(window.AV_API_BASE || 'https://aviation-widget-backend-475753506973.europe-southwest1.run.app');
  }

  function rememberAirports(list) {
    let changed = false;
    (list || []).forEach(a => {
      if (a && a.icao) {
        const prev = metaCache[a.icao] || {};
        metaCache[a.icao] = {
          icao: a.icao,
          name: a.name || prev.name || a.icao,
          city: a.city || prev.city || '',
          category: a.category || prev.category || null,
          country: a.country || prev.country || '',
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

  // Certified Portuguese aeronautical meteorological stations (IPMA / FAP).
  // These stations possess certified aeronautical meteorological infrastructure (METAR/SPECI and/or TAF).
  // They must NEVER be treated as unmonitored airfields, and must NEVER receive IPMA EMA or Synthetic Airfield Outlook (SAO).
  const PT_OFFICIAL_METEO_STATIONS = new Set([
    'LPAR', 'LPAZ', 'LPBJ', 'LPCR', 'LPCS', 'LPFL', 'LPFR', 'LPGR',
    'LPHR', 'LPLA', 'LPMA', 'LPMR', 'LPMT', 'LPOV', 'LPPD', 'LPPI',
    'LPPR', 'LPPS', 'LPPT', 'LPSJ', 'LPST', 'LPTN',
  ]);

  function isOfficialStation(icao) {
    if (!icao) return false;
    const up = icao.toUpperCase();
    if (PT_OFFICIAL_METEO_STATIONS.has(up)) return true;
    // Any international airport outside Portugal is an official reporting aerodrome if tracked
    if (!up.startsWith('LP')) return true;
    return false;
  }

  window.AV = {
    CAT, cat, meta, rememberAirports, apiBase, country, airports, directory,
    compass, windText, ago,
    PT_OFFICIAL_METEO_STATIONS, isOfficialStation,
    // units
    units, setUnit, convTempVal, tempUnit, fmtTemp, convWindVal, windUnit, convPressVal, pressUnit, fmtPress,
    // default saved order for the app
    saved: ['LPPT'],
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
