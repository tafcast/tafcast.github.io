/* Minimal stroke icons. window.Icon.<name>({size,color,stroke}) */
(function () {
  const S = (props, children) => {
    const { size = 22, color = 'currentColor', stroke = 2, fill = 'none', vb = 24 } = props;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill}
        stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    );
  };

  const Icon = {
    menu: (p) => S(p, <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="19" x2="21" y2="19"/></>),
    gear: (p) => S(p, <><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7L17 17M7 7 5.3 5.3"/></>),
    plus: (p) => S(p, <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
    search: (p) => S(p, <><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></>),
    chevR: (p) => S(p, <polyline points="9 5 16 12 9 19"/>),
    chevL: (p) => S(p, <polyline points="15 5 8 12 15 19"/>),
    chevDown: (p) => S(p, <polyline points="5 9 12 16 19 9"/>),
    x: (p) => S(p, <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>),
    check: (p) => S(p, <polyline points="4 12 10 18 20 6"/>),
    wind: (p) => S(p, <><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 13h16a3 3 0 1 1-3 3"/><path d="M3 18h8a2.5 2.5 0 1 1-2.5 2.5"/></>),
    droplet: (p) => S(p, <path d="M12 3.2 6.5 10a6.5 6.5 0 1 0 11 0L12 3.2Z"/>),
    gauge: (p) => S(p, <><path d="M4 18a8 8 0 1 1 16 0"/><line x1="12" y1="18" x2="15.5" y2="11.5"/></>),
    thermo: (p) => S(p, <><path d="M14 14.8V5a2.5 2.5 0 0 0-5 0v9.8a4 4 0 1 0 5 0Z"/></>),
    eye: (p) => S(p, <><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.6"/></>),
    bell: (p) => S(p, <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></>),
    layers: (p) => S(p, <><polygon points="12 3 21 8 12 13 3 8 12 3"/><polyline points="3 13 12 18 21 13"/></>),
    star: (p) => S(p, <polygon points="12 3 14.6 9 21 9.5 16 13.8 17.7 20 12 16.4 6.3 20 8 13.8 3 9.5 9.4 9 12 3"/>),
    pin: (p) => S(p, <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></>),
    grip: (p) => S({ ...p, fill: p.color || 'currentColor', stroke: 'none' }, <><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></>),
    trash: (p) => S(p, <><polyline points="4 7 20 7"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6 7l1 13h10l1-13"/></>),
    refresh: (p) => S(p, <><path d="M21 12a9 9 0 1 1-2.6-6.3"/><polyline points="21 4 21 9 16 9"/></>),
    doc: (p) => S(p, <><path d="M7 3h7l5 5v13H7Z"/><polyline points="14 3 14 8 19 8"/></>),
  };

  window.Icon = Icon;
})();
