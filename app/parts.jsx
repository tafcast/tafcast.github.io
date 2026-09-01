/* Shared visual primitives. Exports: WindDial, CatDot, MiniBars */
(function () {
  // Wind dial drawn as a standard ICAO/EASA wind barb.
  // The staff points in the direction the wind blows FROM; feathers encode speed
  // (half feather = 5 kt, full feather = 10 kt, pennant = 50 kt). No numeric value.
  function WindDial({ dir, spd, gust, size = 92, t, tone, barbOnly }) {
    const color = tone || t.text;
    const isCalm = !spd;

    // Feathers, built from the free (outer) end of the staff inward.
    // Local coords: staff is vertical, free end at y=12, station at centre y=50.
    function buildBarbs() {
      let s = Math.round((spd || 0) / 5) * 5;
      const els = [];
      const step = 6;            // spacing between feathers along the staff
      const fullLen = 17, halfLen = 9, slant = 6;
      let y = 12;
      const pennants = Math.floor(s / 50); s -= pennants * 50;
      const fulls = Math.floor(s / 10); s -= fulls * 10;
      const halves = Math.floor(s / 5);
      // a lone half feather is inset from the very tip (standard convention)
      if (pennants === 0 && fulls === 0 && halves > 0) y += step;
      let k = 0;
      for (let i = 0; i < pennants; i++) {
        els.push(<polygon key={'p' + k++} points={`50,${y} ${50 + fullLen},${y + 2} 50,${y + step}`} fill={color} />);
        y += step + 2.5;
      }
      for (let i = 0; i < fulls; i++) {
        els.push(<line key={'f' + k++} x1="50" y1={y} x2={50 + fullLen} y2={y - slant} stroke={color} strokeWidth="3.2" strokeLinecap="round" />);
        y += step;
      }
      for (let i = 0; i < halves; i++) {
        els.push(<line key={'h' + k++} x1="50" y1={y} x2={50 + halfLen} y2={y - slant * 0.55} stroke={color} strokeWidth="3.2" strokeLinecap="round" />);
        y += step;
      }
      return els;
    }

    if (barbOnly) {
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
          {isCalm
            ? <circle cx="50" cy="50" r="9" fill="none" stroke={color} strokeWidth="3.5" />
            : <g transform={`rotate(${dir} 50 50)`}>
                <line x1="50" y1="50" x2="50" y2="12" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
                {buildBarbs()}
              </g>}
        </svg>
      );
    }

    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={t.line} strokeWidth="1.5" />
        {/* cardinal ticks */}
        {[0, 90, 180, 270].map((a) => {
          const rad = (a - 90) * Math.PI / 180;
          const x1 = 50 + 41 * Math.cos(rad), y1 = 50 + 41 * Math.sin(rad);
          const x2 = 50 + 46 * Math.cos(rad), y2 = 50 + 46 * Math.sin(rad);
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.textDim} strokeWidth="1.6" strokeLinecap="round" />;
        })}
        <text x="50" y="15" textAnchor="middle" fontSize="9.5" fontFamily={t.mono} fill={t.textFaint} fontWeight="600">N</text>

        {isCalm ? (
          // Calm is shown as the station circle (ICAO convention).
          <circle cx="50" cy="50" r="7" fill="none" stroke={t.textDim} strokeWidth="2.4" />
        ) : (
          <g transform={`rotate(${dir} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="12" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
            {buildBarbs()}
          </g>
        )}
      </svg>
    );
  }

  function CatDot({ category, size = 10 }) {
    const c = window.AV.cat(category).color;
    return <span style={{ width: size, height: size, borderRadius: size, background: c,
      display: 'inline-block', boxShadow: `0 0 0 3px ${c}22` }} />;
  }

  window.WindDial = WindDial;
  window.CatDot = CatDot;
})();
