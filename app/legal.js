/* Canonical legal text for the app (Disclaimer, Terms of Use / EULA, Privacy Policy).
   Exposed as window.AV_LEGAL and rendered by the in-app Legal screen + onboarding.

   ⚠ KEEP IN SYNC with backend/legal/content.json, which serves the same text as the
   public web pages (/legal/*) that the app store listing links to. The two live in
   different deploy roots (app bundle vs. Render backend) so they can't share one file.

   ⚠ BEFORE LISTING PUBLICLY: replace the placeholders below — contact email and
   jurisdiction — and have the final text reviewed by a lawyer. This is a starting
   template modelled on standard aviation-app language, not legal advice. */
(function () {
  var CONTACT = 'your-contact@example.com';   // ← replace before publishing
  var JURISDICTION = '[your jurisdiction]';    // ← replace before publishing (governing law)

  window.AV_LEGAL = {
    appName: 'Aviation Widget',
    version: '1.0',
    effective: '2026-06-22',
    contact: CONTACT,
    jurisdiction: JURISDICTION,

    // Short, plain-language safety disclaimer. Shown on first run and always
    // reachable from Settings. The first sentence is the key one.
    disclaimer: {
      title: 'Safety disclaimer',
      sections: [
        { h: 'For situational awareness only', p: [
          'Aviation Widget is for situational awareness only. It is NOT for navigation or flight planning. Always verify against official sources before flight.',
          'This app is not an official meteorological or aeronautical information service. It is not approved, certified, or endorsed by any aviation authority, and it must never be the sole basis for any flight or operational decision.'
        ]},
        { h: 'Always use official sources', p: [
          'Before every flight, obtain and rely on the official AIS / MET briefing for your route — for example your national AIS, an approved self-briefing service, or an authorised flight-service station. Where this app and an official source disagree, the official source governs.'
        ]},
        { h: 'Synthetic ("ADVISORY") TAFs', p: [
          'For some aerodromes without an official weather station, the app shows a model-generated forecast clearly labelled "ADVISORY". This output is computer-generated, is NOT an official ICAO TAF, may be wrong, and must not be used for flight decisions. Treat it as illustrative only.'
        ]},
        { h: 'Data may be wrong, delayed, or missing', p: [
          'Weather, forecasts, NOTAMs, and airport/runway data come from third-party services and may be inaccurate, incomplete, out of date, or unavailable. You are solely responsible for confirming all information and for the safe conduct of every flight. The pilot in command remains responsible at all times.'
        ]}
      ]
    },

    // End-user licence agreement / terms of use.
    terms: {
      title: 'Terms of Use',
      sections: [
        { h: '1. Acceptance', p: [
          'By installing or using Aviation Widget ("the App"), you agree to these Terms of Use and to the Safety Disclaimer and Privacy Policy. If you do not agree, do not use the App.'
        ]},
        { h: '2. Licence', p: [
          'You are granted a personal, non-exclusive, non-transferable, revocable licence to use the App for your own non-commercial situational awareness. You may not sell, sublicense, or commercially redistribute the App, and you may not reverse-engineer it except to the extent that restriction is prohibited by law.'
        ]},
        { h: '3. Not for navigation or flight planning', p: [
          'The App is provided for situational awareness only. It is not for navigation or flight planning, is not an official MET/AIS source, and is not certified by any aviation authority. You must always verify against official sources before flight. The pilot in command is solely responsible for every flight and operational decision.'
        ]},
        { h: '4. No warranty', p: [
          'THE APP AND ALL DATA ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AVAILABILITY, AND NON-INFRINGEMENT. We do not warrant that the App or its data will be accurate, complete, timely, uninterrupted, or error-free.'
        ]},
        { h: '5. Limitation of liability', p: [
          'To the maximum extent permitted by law, the developer shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, or for any loss of, or damage to, life, property, profits, or data, arising out of or relating to your use of, or inability to use, the App or its data — including any reliance on weather, forecast, NOTAM, or airport information, and including any "ADVISORY" synthetic product. Your sole and exclusive remedy is to stop using the App.'
        ]},
        { h: '6. Acceptable use', p: [
          'You agree not to misuse the App or the backing service, including by attempting to overload, disrupt, scrape in bulk, or gain unauthorised access to it, or by using it in any unlawful way or in breach of any third-party data provider’s terms.'
        ]},
        { h: '7. Third-party data', p: [
          'The App relies on third-party data sources (see the Privacy Policy). Those sources have their own terms and may change or withdraw their data at any time. We are not responsible for third-party data or services.'
        ]},
        { h: '8. Changes and termination', p: [
          'We may update the App and these Terms from time to time. Material changes will update the "effective" date shown in-app; continued use after a change means you accept the updated Terms. We may suspend or discontinue the App or its backend at any time.'
        ]},
        { h: '9. Governing law', p: [
          'These Terms are governed by the laws of ' + JURISDICTION + ', without regard to its conflict-of-laws rules, and you agree to the exclusive jurisdiction of its courts, except where mandatory local consumer law provides otherwise.'
        ]},
        { h: '10. Contact', p: [
          'Questions about these Terms: ' + CONTACT + '.'
        ]}
      ]
    },

    // Privacy policy.
    privacy: {
      title: 'Privacy Policy',
      sections: [
        { h: 'Summary', p: [
          'Aviation Widget keeps your settings on your device and uses a backend only to fetch aviation data. There are no user accounts, no advertising, and no third-party analytics or tracking SDKs in the app.'
        ]},
        { h: 'Stored on your device', p: [
          'Your saved airports, units, theme, alert thresholds, an optional custom backend URL, and the most recent weather data are stored locally on your device (in app storage / browser-style local storage) so the App opens instantly and works offline. This data stays on the device; it is not sent to us except as the airport codes needed to fetch data (below). Cloud backup of this data is disabled.'
        ]},
        { h: 'What the backend receives', p: [
          'When the App fetches data, it contacts the backend server. As with any internet request, the backend necessarily receives your device’s IP address and the airport ICAO code(s) and search terms you look up, plus standard request metadata (timestamp, user-agent). These may appear in transient server logs used for operating, debugging, rate-limiting, and protecting the service from abuse. We do not use this data to build advertising or marketing profiles, and we do not sell it.'
        ]},
        { h: 'Third-party data sources', p: [
          'To answer your requests the backend queries third-party providers, which receive the relevant airport coordinates/ICAO needed to return data: NOAA Aviation Weather Center (METAR/TAF), Open-Meteo (wind forecast), autorouter.aero (NOTAMs, if enabled), IPMA (Portuguese automatic-station observations, for synthetic TAFs), and the OurAirports dataset (airport/runway catalog). These providers have their own privacy practices, which we do not control.'
        ]},
        { h: 'Notifications', p: [
          'If you enable weather alerts, the App schedules background checks on your device and posts local notifications. Notifications are generated on-device; we do not operate a push-messaging service that targets you.'
        ]},
        { h: 'Retention', p: [
          'On-device data persists until you clear it (clear app data or uninstall). Server-side request logs are kept only as long as needed to operate and protect the service and are not used to identify individuals.'
        ]},
        { h: 'Children', p: [
          'The App is a general-audience aviation utility and is not directed at children, and we do not knowingly collect personal information from children.'
        ]},
        { h: 'Your choices', p: [
          'You can clear all on-device data at any time by clearing the App’s storage or uninstalling it. You can point the App at your own backend (Settings ▸ Backend URL). For questions or requests regarding your data, contact ' + CONTACT + '.'
        ]},
        { h: 'Changes', p: [
          'We may update this Policy; the "effective" date shown in-app reflects the latest version. Material changes will be highlighted in the App.'
        ]},
        { h: 'Contact', p: [
          'Privacy questions: ' + CONTACT + '.'
        ]}
      ]
    }
  };
})();
