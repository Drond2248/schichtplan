// holidays-brandenburg.js
// Enthält gesetzliche Feiertage für Brandenburg und Hilfsfunktionen.

window.BrandenburgHolidays = (function () {
  function easterSunday(year) {
    // Anonymous Gregorian algorithm
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    return d;
  }

  function formatDate(d) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getHolidaysForYear(year) {
    const list = [];

    // Fixed holidays
    const fixed = [
      { month: 1, day: 1, name: "Neujahr" },
      { month: 5, day: 1, name: "Tag der Arbeit" },
      { month: 10, day: 3, name: "Tag der Deutschen Einheit" },
      { month: 10, day: 31, name: "Reformationstag" },
      { month: 12, day: 25, name: "1. Weihnachtsfeiertag" },
      { month: 12, day: 26, name: "2. Weihnachtsfeiertag" }
    ];
    fixed.forEach(f => {
      const d = new Date(Date.UTC(year, f.month - 1, f.day));
      list.push({ date: formatDate(d), name: f.name });
    });

    // Movable feasts based on Easter
    const easter = easterSunday(year);
    const goodFriday = addDays(easter, -2);
    const easterMonday = addDays(easter, 1);
    const ascension = addDays(easter, 39);
    const pentecostSunday = addDays(easter, 49); // Brandenburg: Sonntag ist offizieller Feiertag
    const pentecostMonday = addDays(easter, 50);

    [
      { d: goodFriday, name: "Karfreitag" },
      { d: easter, name: "Ostersonntag" },
      { d: easterMonday, name: "Ostermontag" },
      { d: ascension, name: "Christi Himmelfahrt" },
      { d: pentecostSunday, name: "Pfingstsonntag" },
      { d: pentecostMonday, name: "Pfingstmontag" }
    ].forEach(h => {
      list.push({ date: formatDate(h.d), name: h.name });
    });

    return list;
  }

  function getHolidayMap(year) {
    const map = {};
    getHolidaysForYear(year).forEach(h => {
      map[h.date] = h.name;
    });
    return map;
  }

  return {
    getHolidaysForYear,
    getHolidayMap
  };
})();
