// Theme tokens for the two visual variations × light/dark.
// window.makeTheme(variant, mode) -> token object
(function () {
  function makeTheme(variant, mode) {
    const dark = mode === 'dark';

    if (variant === 'deck') {
      // "Flight Deck" — instrument-panel, dense, mono-forward, hairlines
      const t = dark ? {
        page:    '#070a0d',
        surface: '#10151b',
        surface2:'#161d25',
        inset:   '#0b1014',
        text:    '#e9eef3',
        textDim: '#8c98a5',
        textFaint:'#5a6571',
        line:    'rgba(255,255,255,0.09)',
        hair:    'rgba(255,255,255,0.055)',
        accent:  '#6fd0ff',
        chrome:  '#0b0f13',
      } : {
        page:    '#e6e9ec',
        surface: '#fbfcfd',
        surface2:'#f0f2f5',
        inset:   '#eef1f4',
        text:    '#0e1419',
        textDim: '#5a6671',
        textFaint:'#8b97a3',
        line:    'rgba(0,0,0,0.1)',
        hair:    'rgba(0,0,0,0.06)',
        accent:  '#0a6fb0',
        chrome:  '#f4f6f8',
      };
      return Object.assign(t, {
        variant: 'deck', dark,
        display: '"Saira", -apple-system, system-ui, sans-serif',
        body:    '-apple-system, system-ui, sans-serif',
        mono:    '"JetBrains Mono", ui-monospace, monospace',
        radCard: 12, radChip: 6, radInner: 8,
        pad: 16, gap: 12,
        uppercaseLabels: true,
      });
    }

    // "Briefing" — weather-app DNA, soft, generous, rounded
    const t = dark ? {
      page:    '#000000',
      surface: '#1c1c1e',
      surface2:'#2c2c2e',
      inset:   '#2c2c2e',
      text:    '#ffffff',
      textDim: 'rgba(235,235,245,0.62)',
      textFaint:'rgba(235,235,245,0.32)',
      line:    'rgba(120,120,128,0.36)',
      hair:    'rgba(120,120,128,0.2)',
      accent:  '#0a84ff',
      chrome:  '#000000',
    } : {
      page:    '#eef0f4',
      surface: '#ffffff',
      surface2:'#f5f6f9',
      inset:   '#f1f3f6',
      text:    '#0d1117',
      textDim: 'rgba(60,60,67,0.6)',
      textFaint:'rgba(60,60,67,0.32)',
      line:    'rgba(60,60,67,0.13)',
      hair:    'rgba(60,60,67,0.08)',
      accent:  '#007aff',
      chrome:  '#eef0f4',
    };
    return Object.assign(t, {
      variant: 'briefing', dark,
      display: '-apple-system, system-ui, sans-serif',
      body:    '-apple-system, system-ui, sans-serif',
      mono:    '"JetBrains Mono", ui-monospace, monospace',
      radCard: 24, radChip: 14, radInner: 18,
      pad: 18, gap: 14,
      uppercaseLabels: false,
    });
  }

  // Soft condition-tint gradient for the Briefing header, by category + mode
  function headerTint(category, dark) {
    const map = {
      VFR:  dark ? ['#0b2a18', '#06140d'] : ['#d6f3df', '#eef0f4'],
      MVFR: dark ? ['#0c1f38', '#06101c'] : ['#d6e6ff', '#eef0f4'],
      IFR:  dark ? ['#30121a', '#160a0e'] : ['#ffdfe0', '#eef0f4'],
      LIFR: dark ? ['#2a1030', '#140816'] : ['#f6dcff', '#eef0f4'],
    };
    const [a, b] = map[category] || map.VFR;
    return `linear-gradient(180deg, ${a} 0%, ${b} 100%)`;
  }

  window.makeTheme = makeTheme;
  window.headerTint = headerTint;
})();
