// model.js
// Enthält Datenmodell, Persistenz und Regel-Logik.

window.BusplanModel = (function () {
  const state = {
    drivers: [],
    shiftTypes: [],
    templates: [],
    shifts: [],
    // Konfigurierbare Zielbesetzungen für Früh/Spät:
    // default = Standard für alle Tage, byDate = abweichende Werte pro Datum (YYYY-MM-DD)
    staffingTargets: {
      default: { early: 4, late: 4 },
      byDate: {}
    },
    ruleConfig: {
      maxHoursPerDay: 10,      // maximale tägliche Arbeitszeit in Stunden
      maxHoursPerWeek: 48,     // maximale Wochenarbeitszeit in Stunden
      minRestHours: 11,        // Mindest-Ruhezeit zwischen zwei Arbeitstagen in Stunden
      maxConsecutiveDays: 6    // maximale Arbeitstage am Stück
    }
  };

      function load() {
    try {
      const parsed = BusplanDb.loadState();
      if (!parsed) {
        // Keine gespeicherten Daten vorhanden: mit Standarddaten initialisieren.
        seedDemoData();
        save();
        return;
      }
      Object.assign(state, parsed);
    } catch (e) {
      console.error("Fehler beim Laden der Daten, Standarddaten werden verwendet", e);
      // Hinweis: UI-Fehlermeldung wird außerhalb des Models gehandhabt (kein alert hier).

      seedDemoData();
      save();
    }
  }



      function save() {
    BusplanDb.saveState(state);
  }



    function seedDemoDrivers() {
    state.drivers = [

        ];
  }

  function seedDemoShiftTypes() {
    state.shiftTypes = [
          { id: "early", name: "Frühschicht", colorClass: "shift-type-work", countsAsWork: true },
          { id: "late", name: "Spätschicht", colorClass: "shift-type-work-late", countsAsWork: true },
          { id: "night", name: "Nachtschicht", colorClass: "shift-type-night", countsAsWork: true },
          { id: "vacation", name: "Urlaub", colorClass: "shift-type-vacation", countsAsWork: false },
          { id: "sick", name: "Krank", colorClass: "shift-type-sick", countsAsWork: false },
          { id: "off", name: "Frei", colorClass: "shift-type-off", countsAsWork: false },
          { id: "holiday", name: "Feiertag", colorClass: "shift-type-holiday", countsAsWork: false },
          { id: "jumper_early", name: "Jumper Früh", colorClass: "shift-type-jumper-early", countsAsWork: true },
          { id: "jumper_late", name: "Jumper Spät", colorClass: "shift-type-jumper-late", countsAsWork: true }
        ];
  }

  function seedDemoTemplates() {
    state.templates = [
          { id: "t1", name: "Früh G1", typeId: "early", start: "06:00", end: "14:00", lineCode: "G1", defaultNote: "Frühschicht G1" },
          { id: "t2", name: "Früh G2", typeId: "early", start: "06:00", end: "14:00", lineCode: "G2", defaultNote: "Frühschicht G2" },
          { id: "t3", name: "Früh R1", typeId: "early", start: "06:00", end: "14:00", lineCode: "R1", defaultNote: "Frühschicht R1" },
          { id: "t4", name: "Früh R2", typeId: "early", start: "06:00", end: "14:00", lineCode: "R2", defaultNote: "Frühschicht R2" },
          { id: "t5", name: "Spät G1", typeId: "late", start: "14:00", end: "23:00", lineCode: "G1", defaultNote: "Spätschicht G1" },
          { id: "t6", name: "Spät G2", typeId: "late", start: "14:00", end: "23:00", lineCode: "G2", defaultNote: "Spätschicht G2" },
          { id: "t7", name: "Spät R1", typeId: "late", start: "14:00", end: "23:00", lineCode: "R1", defaultNote: "Spätschicht R1" },
          { id: "t8", name: "Spät R2", typeId: "late", start: "14:00", end: "23:00", lineCode: "R2", defaultNote: "Spätschicht R2" },
          { id: "t9", name: "Urlaub", typeId: "vacation", start: null, end: null, lineCode: null, defaultNote: "Urlaub" },
          { id: "t10", name: "Krank", typeId: "sick", start: null, end: null, lineCode: null, defaultNote: "Krank" },
          { id: "t11", name: "Frei", typeId: "off", start: null, end: null, lineCode: null, defaultNote: "Frei" },
          { id: "t12", name: "Feiertag", typeId: "holiday", start: null, end: null, lineCode: null, defaultNote: "Feiertag" },
          { id: "t13", name: "Jumper Früh", typeId: "jumper_early", start: "06:00", end: "14:00", lineCode: null, defaultNote: "Jumper Früh" },
          { id: "t14", name: "Jumper Spät", typeId: "jumper_late", start: "14:00", end: "23:00", lineCode: null, defaultNote: "Jumper Spät" }
        ];
  }

  function seedDemoData() {
    seedDemoDrivers();
    seedDemoShiftTypes();
    seedDemoTemplates();
    state.shifts = [];
  }


  function getState() {
    return state;
  }

  function getDriverById(id) {
    return state.drivers.find(d => d.id === id) || null;
  }

  function getDrivers() {
    return state.drivers;
  }

  function generateDriverId() {
    let index = 1;
    while (true) {
      const id = "d" + index;
      if (!state.drivers.some(d => d.id === id)) {
        return id;
      }
      index++;
    }
  }

  function addDriver({ name, color, employeeId = "", role = "", licenseClass = "", birthDate = "", address = "", phone = "", email = "" }) {
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      throw new Error("Name darf nicht leer sein.");
    }

    const driver = {
      id: generateDriverId(),
      name: trimmedName,
      color: color || "#111827",
      employeeId: employeeId || "",
      role: role || "",
      licenseClass: licenseClass || "",
      birthDate: birthDate || "",
      address: address || "",
      phone: phone || "",
      email: email || ""
    };

    state.drivers.push(driver);
    save();
    return driver;
  }

  function updateDriver(id, { name, color, employeeId, role, licenseClass, birthDate, address, phone, email }) {
    const driver = getDriverById(id);
    if (!driver) {
      throw new Error("Fahrer nicht gefunden.");
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Name darf nicht leer sein.");
      }
      driver.name = trimmedName;
    }

    if (typeof color === "string" && color) {
      driver.color = color;
    }

    if (typeof employeeId === "string") {
      driver.employeeId = employeeId.trim();
    }

    if (typeof role === "string") {
      driver.role = role.trim();
    }

    if (typeof licenseClass === "string") {
      driver.licenseClass = licenseClass.trim();
    }

    if (typeof birthDate === "string") {
      driver.birthDate = birthDate;
    }

    if (typeof address === "string") {
      driver.address = address.trim();
    }

    if (typeof phone === "string") {
      driver.phone = phone.trim();
    }

    if (typeof email === "string") {
      driver.email = email.trim();
    }

    save();
    return driver;
  }

  function deleteDriver(id) {
    const index = state.drivers.findIndex(d => d.id === id);
    if (index === -1) return;

    // Fahrer entfernen
    state.drivers.splice(index, 1);

    // Alle Schichten dieses Fahrers mitlöschen
    state.shifts = state.shifts.filter(s => s.driverId !== id);

    save();
  }

  function getShiftTypeById(id) {
    return state.shiftTypes.find(t => t.id === id) || null;
  }

  function getTemplateById(id) {
    return state.templates.find(t => t.id === id) || null;
  }

  function getTemplates() {
    return state.templates;
  }

  function generateTemplateId() {
    let index = 1;
    while (true) {
      const id = "t" + index;
      if (!state.templates.some(t => t.id === id)) {
        return id;
      }
      index++;
    }
  }

  function addTemplate({ name, typeId, start, end, lineCode, defaultNote }) {
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      throw new Error("Name darf nicht leer sein.");
    }

    if (!typeId) {
      throw new Error("Bitte einen Schicht-Typ wählen.");
    }

    const shiftType = getShiftTypeById(typeId);
    if (!shiftType) {
      throw new Error("Ungültiger Schicht-Typ.");
    }

    const template = {
      id: generateTemplateId(),
      name: trimmedName,
      typeId,
      start: start || null,
      end: end || null,
      lineCode: (lineCode || "").trim() || null,
      defaultNote: (defaultNote || "").trim() || null
    };

    state.templates.push(template);
    save();
    return template;
  }

  function updateTemplate(id, { name, typeId, start, end, lineCode, defaultNote }) {
    const template = getTemplateById(id);
    if (!template) {
      throw new Error("Template nicht gefunden.");
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Name darf nicht leer sein.");
      }
      template.name = trimmedName;
    }

    if (typeof typeId === "string" && typeId) {
      const shiftType = getShiftTypeById(typeId);
      if (!shiftType) {
        throw new Error("Ungültiger Schicht-Typ.");
      }
      template.typeId = typeId;
    }

    if (typeof start === "string") {
      template.start = start.trim() || null;
    }

    if (typeof end === "string") {
      template.end = end.trim() || null;
    }

    if (typeof lineCode === "string") {
      template.lineCode = lineCode.trim() || null;
    }

    if (typeof defaultNote === "string") {
      template.defaultNote = defaultNote.trim() || null;
    }

    save();
    return template;
  }

  function deleteTemplate(id) {
    const index = state.templates.findIndex(t => t.id === id);
    if (index === -1) return;
    state.templates.splice(index, 1);
    save();
  }

  function generateShiftId() {
    return "S-" + Math.random().toString(36).substring(2, 8);
  }

  function addShiftFromTemplate(driverId, dateStr, templateId) {
    const template = getTemplateById(templateId);
    if (!template) return null;
    const shiftType = getShiftTypeById(template.typeId);
    if (!shiftType) return null;

    // Absence types: Volltag ohne Zeiten
    const isAllDay = !template.start || !template.end;

    const shift = {
      id: generateShiftId(),
      driverId,
      date: dateStr,
      typeId: template.typeId,
      lineCode: template.lineCode,
      note: template.defaultNote,
      plannedStart: isAllDay ? null : template.start,
      plannedEnd: isAllDay ? null : template.end,
      actualStart: null,
      actualEnd: null,
      supervisorComment: "",
      errorList: [],
      approved: false
    };

    // Regel-Check (Überschneidung etc.)
    const errors = checkRulesForNewShift(shift);
    shift.errorList = errors;
    state.shifts.push(shift);
    save();
    return shift;
  }

  function getShiftsForDriverAndDate(driverId, dateStr) {
    return state.shifts.filter(s => s.driverId === driverId && s.date === dateStr);
  }

  function deleteShift(shiftId) {
    const idx = state.shifts.findIndex(s => s.id === shiftId);
    if (idx >= 0) {
      state.shifts.splice(idx, 1);
      save();
    }
  }

  function updateShift(shiftId, changes) {
    const s = state.shifts.find(s => s.id === shiftId);
    if (!s) return;
    Object.assign(s, changes);
    // Re-Check rules
    s.errorList = checkRulesForNewShift(s, true);
    save();
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    // Zeiten als "HH:MM". Null bedeutet ganztägig → wir lassen ganztägige Abwesenheiten nicht mit Work-Shifts kollidieren.
    if (!aStart || !aEnd || !bStart || !bEnd) {
      return false;
    }
    const toMin = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const a1 = toMin(aStart);
    const a2 = toMin(aEnd);
    const b1 = toMin(bStart);
    const b2 = toMin(bEnd);
    // Überlappung, aber End=Start ist erlaubt
    return a1 < b2 && b1 < a2;
  }

  // --- Regel-Engine Hilfsfunktionen (Arbeitszeit / Arbeitsschutz) ---

  function shiftCountsAsWork(shift) {
    const type = getShiftTypeById(shift.typeId);
    return !!(type && type.countsAsWork);
  }

  function getShiftDurationMinutes(shift) {
    if (!shiftCountsAsWork(shift)) return 0;
    const start = shift.plannedStart;
    const end = shift.plannedEnd;
    if (!start || !end) return 0;

    const toMin = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    let mins = toMin(end) - toMin(start);
    if (mins < 0) mins += 24 * 60; // Über-Nacht-Schichten
    return mins;
  }

  
  // Linien-Rotationslogik für Frühschichten (Mo–Fr)
  // Jede innere Liste entspricht einer Woche (Mo–Fr),
  // Index 0 = Montag, 1 = Dienstag, ..., 4 = Freitag.
  // Der Wert an Position 0 (Montag) entscheidet, welches Pattern gewählt wird.
  const EARLY_LINE_ROTATION = [
    ["R1", "G1", "R2", "G2", "R1"], // Pattern 1
    ["R2", "G2", "R1", "G1", "R2"], // Pattern 2
    ["G1", "R2", "G2", "R1", "G1"], // Pattern 3
    ["G2", "R1", "G1", "R2", "G2"]  // Pattern 4
  ];

  /**
   * Liefert das Rotations-Pattern (Array mit 5 Line-Codes Mo–Fr)
   * für eine gegebene Start-Linie (Montag), z. B. "R1" oder "G2".
   * Wenn die Startlinie nicht konfiguriert ist → null (keine Auto-Befüllung).
   */
  function getEarlyLinePatternForStart(startLineCode) {
    const code = (startLineCode || "").toUpperCase();
    return EARLY_LINE_ROTATION.find(pattern => pattern[0] === code) || null;
  }

  /**
   * Optionaler Helfer: Liefert eine strukturierte Zuordnung für Mo–Fr.
   * Kann z. B. in Reporting / Debugging genutzt werden.
   */
  function getEarlyLineAssignmentsForWeek(startLineCode) {
    const pattern = getEarlyLinePatternForStart(startLineCode);
    if (!pattern) return null;

    // dayIndex: 0=Mo, 1=Di, ..., 4=Fr
    return pattern.map((lineCode, dayIndex) => ({
      dayIndex,
      lineCode
    }));
  }

  /**
   * Auto-Fill für eine Fahrer-Woche (Mo–Fr) im Frühdienst.
   *
   * - mondayDateISO: Datum des Montags der Woche (YYYY-MM-DD)
   * - startLineCode: Linie am Montag, z. B. "R1"
   * - options.overwriteExisting:
   *      false (Default): vorhandene Schichten werden NICHT überschrieben
   *      true: vorhandene Schichten werden ersetzt (aktuell nicht genutzt)
   *
   * Es werden automatisch Frühschichten für Di–Fr erzeugt, wenn:
   * - es ein konfiguriertes Pattern gibt
   * - die Zelle für den Tag noch keine Schicht hat
   * - ein passendes Frühschicht-Template für die jeweilige Line existiert
   */
  function autoFillEarlyWeekForDriver(driverId, mondayDateISO, startLineCode, options = {}) {
    const pattern = getEarlyLinePatternForStart(startLineCode);
    if (!pattern) return; // Startlinie nicht konfiguriert → nichts tun

    const cfg = Object.assign({ overwriteExisting: false }, options);

    // Wir starten bei Di (Offset 1) bis Fr (Offset 4).
    for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
      const dateStr = addDaysISO(mondayDateISO, dayOffset);

      // Prüfen, ob schon Schicht(en) für diesen Fahrer/Tag existieren.
      const existing = getShiftsForDriverAndDate(driverId, dateStr);
      if (!cfg.overwriteExisting && existing && existing.length > 0) {
        continue; // Zelle ist belegt → nichts tun
      }

      const lineCode = pattern[dayOffset];
      if (!lineCode) continue;

      // Passendes Frühschicht-Template für diese Linie finden.
      const earlyTemplate = state.templates.find(
        t => t.typeId === "early" && t.lineCode === lineCode
      );

      if (!earlyTemplate) {
        // Keine passende Vorlage → nichts anlegen
        continue;
      }

      // Bestehende Funktion nutzen, damit alle Regeln & Persistenz greifen.
      addShiftFromTemplate(driverId, dateStr, earlyTemplate.id);
    }
  }



const LATE_LINE_ROTATION = [
    ["R1", "G1", "R2", "G2", "R1"], // Pattern 1
    ["R2", "G2", "R1", "G1", "R2"], // Pattern 2
    ["G1", "R2", "G2", "R1", "G1"], // Pattern 3
    ["G2", "R1", "G1", "R2", "G2"]  // Pattern 4
  ];

  /**
   * Liefert das Rotations-Pattern (Array mit 5 Line-Codes Mo–Fr)
   * für eine gegebene Start-Linie (Montag), z. B. "R1" oder "G2".
   * Wenn die Startlinie nicht konfiguriert ist → null (keine Auto-Befüllung).
   */
  function getLateLinePatternForStart(startLineCode) {
    const code = (startLineCode || "").toUpperCase();
    return LATE_LINE_ROTATION.find(pattern => pattern[0] === code) || null;
  }

  /**
   * Optionaler Helfer: Liefert eine strukturierte Zuordnung für Mo–Fr.
   * Kann z. B. in Reporting / Debugging genutzt werden.
   */
  function getLateLineAssignmentsForWeek(startLineCode) {
    const pattern = getLateLinePatternForStart(startLineCode);
    if (!pattern) return null;

    // dayIndex: 0=Mo, 1=Di, ..., 4=Fr
    return pattern.map((lineCode, dayIndex) => ({
      dayIndex,
      lineCode
    }));
  }

  /**
   * Auto-Fill für eine Fahrer-Woche (Mo–Fr) im Spätdienst.
   *
   * - mondayDateISO: Datum des Montags der Woche (YYYY-MM-DD)
   * - startLineCode: Linie am Montag, z. B. "R1"
   * - options.overwriteExisting:
   *      false (Default): vorhandene Schichten werden NICHT überschrieben
   *      true: vorhandene Schichten werden ersetzt (aktuell nicht genutzt)
   *
   * Es werden automatisch Spätschichten für Di–Fr erzeugt, wenn:
   * - es ein konfiguriertes Pattern gibt
   * - die Zelle für den Tag noch keine Schicht hat
   * - ein passendes Frühschicht-Template für die jeweilige Line existiert
   */
  function autoFillLateWeekForDriver(driverId, mondayDateISO, startLineCode, options = {}) {
    const pattern = getLateLinePatternForStart(startLineCode);
    if (!pattern) return; // Startlinie nicht konfiguriert → nichts tun

    const cfg = Object.assign({ overwriteExisting: false }, options);

    // Wir starten bei Di (Offset 1) bis Fr (Offset 4).
    for (let dayOffset = 1; dayOffset <= 4; dayOffset++) {
      const dateStr = addDaysISO(mondayDateISO, dayOffset);

      // Prüfen, ob schon Schicht(en) für diesen Fahrer/Tag existieren.
      const existing = getShiftsForDriverAndDate(driverId, dateStr);
      if (!cfg.overwriteExisting && existing && existing.length > 0) {
        continue; // Zelle ist belegt → nichts tun
      }

      const lineCode = pattern[dayOffset];
      if (!lineCode) continue;

      // Passendes Frühschicht-Template für diese Linie finden.
      const lateTemplate = state.templates.find(
        t => t.typeId === "late" && t.lineCode === lineCode
      );

      if (!lateTemplate) {
        // Keine passende Vorlage → nichts anlegen
        continue;
      }

      // Bestehende Funktion nutzen, damit alle Regeln & Persistenz greifen.
      addShiftFromTemplate(driverId, dateStr, lateTemplate.id);
    }
  }




  /**
   * Setzt für alle Fahrer an Wochenenden (Sa/So) standardmäßig Frei-Schichten,
   * überschreibt aber keine bestehenden Einträge.
   *
   * weekDates: Array von Date-Objekten (Mo–So) der aktuellen Woche.
   */
  function autoFillWeekendOffForWeek(weekDates) {
    if (!WEEKENDS_ARE_OFF || !Array.isArray(weekDates) || weekDates.length === 0) return;

    const drivers = state.drivers || [];
    if (!drivers.length) return;

    // Passendes Frei-Template suchen:
    // Bevorzugt ein Template/Schichttyp mit Namen, der "Frei" enthält,
    // sonst fallback auf das erste nicht-arbeitszeit-Template (Urlaub/Krank/etc.).
    const offTemplates = (state.templates || []).filter(t => {
      const type = state.shiftTypes.find(st => st.id === t.typeId);
      return type && !type.countsAsWork; // z.B. Urlaub, Frei, Krank etc.
    });

    if (offTemplates.length === 0) {
      // Keine Off-Templates vorhanden → nur Zielbesetzung 0, aber keine Frei-Schichten.
      return;
    }

    function normalize(str) {
      return (str || "").toLowerCase();
    }

    // Zuerst nach explizitem "Frei" im Template- oder Schichttyp-Namen suchen.
    let defaultOffTemplate = offTemplates.find(t => {
      const type = state.shiftTypes.find(st => st.id === t.typeId);
      const tName = normalize(t.name);
      const typeName = type ? normalize(type.name) : "";
      return tName.includes("frei") || typeName.includes("frei");
    });

    // Wenn kein explizites "Frei" gefunden wird, nimm das erste Off-Template (z.B. Urlaub).
    if (!defaultOffTemplate) {
      defaultOffTemplate = offTemplates[0];
    }

    weekDates.forEach(d => {
      const dateISO = formatDateISO(d);
      if (!isWeekend(dateISO)) return;

      drivers.forEach(driver => {
        const existing = getShiftsForDriverAndDate(driver.id, dateISO);
        if (existing && existing.length > 0) {
          // Bereits eine Schicht eingetragen → nichts überschreiben.
          return;
        }

        // Frei-Schicht für dieses Wochenende anlegen.
        addShiftFromTemplate(driver.id, dateISO, defaultOffTemplate.id);
      });
    });
  }

function addDaysISO(dateStr, delta) {
    const d = parseDate(dateStr);
    d.setUTCDate(d.getUTCDate() + delta);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getWeekRangeISO(dateStr) {
    const ref = parseDate(dateStr);
    const dow = ref.getUTCDay() || 7; // Sonntag = 7
    const monday = new Date(ref);
    monday.setUTCDate(ref.getUTCDate() - (dow - 1));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const toISO = d => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return { fromISO: toISO(monday), toISO: toISO(sunday) };
  }

  function calculateRestHoursBefore(shift) {
    if (!shiftCountsAsWork(shift) || !shift.plannedStart) return null;

    const prevDate = addDaysISO(shift.date, -1);
    const prevShifts = state.shifts.filter(s =>
      s.driverId === shift.driverId &&
      s.date === prevDate &&
      shiftCountsAsWork(s)
    );
    if (prevShifts.length === 0) return null;

    const toMin = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    let latestEnd = null;
    for (const s of prevShifts) {
      if (!s.plannedEnd) continue;
      const endMin = toMin(s.plannedEnd);
      if (latestEnd === null || endMin > latestEnd) {
        latestEnd = endMin;
      }
    }
    if (latestEnd === null) return null;

    const curStart = toMin(shift.plannedStart);
    const restMinutes = (24 * 60 - latestEnd) + curStart;
    return restMinutes / 60;
  }

  function calculateWorkingStreakBefore(shift) {
    let streak = 0;
    for (let k = 1; k <= 7; k++) {
      const d = addDaysISO(shift.date, -k);
      const dayShifts = state.shifts.filter(s =>
        s.driverId === shift.driverId &&
        s.date === d &&
        shiftCountsAsWork(s)
      );
      if (dayShifts.length > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function calculateWeeklyHoursWithShift(shift, isUpdate) {
    const { fromISO, toISO } = getWeekRangeISO(shift.date);
    let totalMinutes = 0;
    let foundCandidate = false;

    for (const s of state.shifts) {
      if (s.driverId !== shift.driverId) continue;
      if (s.date < fromISO || s.date > toISO) continue;

      let current = s;
      if (s.id === shift.id) {
        foundCandidate = true;
        if (isUpdate) {
          current = shift;
        } else {
          // bei Neuanlage ist die Schicht noch nicht im State → wird später addiert
          continue;
        }
      }

      totalMinutes += getShiftDurationMinutes(current);
    }

    if (!foundCandidate) {
      totalMinutes += getShiftDurationMinutes(shift);
    }

    return totalMinutes / 60;
  }

  function hasEarlyAndLateInWeek(shift, isUpdate) {
    const { fromISO, toISO } = getWeekRangeISO(shift.date);
    let hasEarly = false;
    let hasLate = false;
    let candidateSeen = false;

    function track(s) {
      if (!shiftCountsAsWork(s)) return;
      if (s.typeId === "early") hasEarly = true;
      if (s.typeId === "late") hasLate = true;
    }

    for (const s of state.shifts) {
      if (s.driverId !== shift.driverId) continue;
      if (s.date < fromISO || s.date > toISO) continue;

      if (s.id === shift.id) {
        candidateSeen = true;
        if (isUpdate) {
          track(shift);
        } else {
          // bei Neuanlage ist die Schicht noch nicht im State; wir verfolgen sie später separat
          continue;
        }
      } else {
        track(s);
      }
    }

    if (!candidateSeen) {
      track(shift);
    }

    return hasEarly && hasLate;
  }

  function hasLineShiftClash(shift, isUpdate) {
    const line = shift.lineCode;
    if (!line) return false;
    if (!shiftCountsAsWork(shift)) return false;

    for (const other of state.shifts) {
      if (other.date !== shift.date) continue;
      if (!shiftCountsAsWork(other)) continue;
      if (other.lineCode !== line) continue;
      if (other.typeId !== shift.typeId) continue;

      // Beim Update die eigene Schicht nicht gegen sich selbst prüfen
      if (isUpdate && other.id === shift.id) continue;

      return true;
    }

    return false;
  }




  function checkRulesForNewShift(shift, isUpdate = false) {
    const violations = [];

    const driverShiftsSameDay = state.shifts.filter(s =>
      s.driverId === shift.driverId &&
      s.date === shift.date &&
      s.id !== shift.id
    );

    // 1) Doppelbelegung am selben Tag (Zeitüberschneidung)
    for (const other of driverShiftsSameDay) {
      if (overlaps(
        shift.plannedStart, shift.plannedEnd,
        other.plannedStart, other.plannedEnd
      )) {
        violations.push("Doppelbelegung am gleichen Tag");
        break;
      }
    }

    const workType = getShiftTypeById(shift.typeId);
    const isWork = workType && workType.countsAsWork;

    // 2) Maximale Tagesarbeitszeit
    if (isWork && shift.plannedStart && shift.plannedEnd) {
      const toMin = t => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      let minutes = toMin(shift.plannedEnd) - toMin(shift.plannedStart);
      if (minutes < 0) minutes += 24 * 60; // Nacht

      let totalMinutes = minutes;
      for (const other of driverShiftsSameDay) {
        const otherType = getShiftTypeById(other.typeId);
        if (!otherType || !otherType.countsAsWork) continue;
        if (!other.plannedStart || !other.plannedEnd) continue;
        let m = toMin(other.plannedEnd) - toMin(other.plannedStart);
        if (m < 0) m += 24 * 60;
        totalMinutes += m;
      }
      const hours = totalMinutes / 60;
      if (hours > state.ruleConfig.maxHoursPerDay) {
        violations.push("Maximale Tagesarbeitszeit überschritten");
      }
    }

    // 3) Erweiterte Wochen- und Ruhezeit-Regeln (Arbeitsschutz)
    if (isWork) {
      const restHours = calculateRestHoursBefore(shift);
      if (restHours !== null && restHours < state.ruleConfig.minRestHours) {
        violations.push(`Ruhezeit < ${state.ruleConfig.minRestHours}h zum Vortag (${restHours.toFixed(1)}h)`);
      }

      const streakBefore = calculateWorkingStreakBefore(shift);
      const streak = streakBefore + 1; // inkl. aktuellem Tag
      if (streak > state.ruleConfig.maxConsecutiveDays) {
        violations.push(`> ${state.ruleConfig.maxConsecutiveDays} Arbeitstage am Stück`);
      }

      const weekHours = calculateWeeklyHoursWithShift(shift, isUpdate);
      if (weekHours > state.ruleConfig.maxHoursPerWeek) {
        violations.push(`Wochenlimit ${state.ruleConfig.maxHoursPerWeek}h überschritten (${weekHours.toFixed(1)}h)`);
      }

      if (hasEarlyAndLateInWeek(shift, isUpdate)) {
        violations.push("Früh- und Spätdienst in einer Woche kombiniert");
      }

      // Keine doppelte Vergabe von gleicher Linie + gleichem Schichttyp am selben Tag an verschiedene Fahrer
      if (hasLineShiftClash(shift, isUpdate)) {
        violations.push("Linie und Schicht sind bereits einem anderen Fahrer zugeordnet");
      }
    }

    return violations;
  }



  // KPI-Funktionen (vereinfachte Beispielimplementierung)

  function parseDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }


  // Globale Regel: Wochenende = frei (keine reguläre Früh-/Spätbesetzung).
  const WEEKENDS_ARE_OFF = true;

  /**
   * Prüft, ob ein Datum (YYYY-MM-DD) auf ein Wochenende fällt.
   * 0 = Sonntag, 6 = Samstag (UTC-Betrachtung passend zu parseDate).
   */
  function isWeekend(dateStr) {
    const d = parseDate(dateStr);
    const dow = d.getUTCDay();
    return dow === 0 || dow === 6;
  }

  function isWithinPeriod(dateStr, from, to) {
    const d = parseDate(dateStr);
    return d >= from && d <= to;
  }

  function getPeriodRange(periodType, periodValue) {
    if (periodType === "year") {
      const year = periodValue;
      const from = new Date(Date.UTC(year, 0, 1));
      const to = new Date(Date.UTC(year, 11, 31));
      return { from, to };
    } else if (periodType === "week") {
      // periodValue: "YYYY-MM-DD" (Datum innerhalb der gewünschten Woche)
      const refDate = parseDate(periodValue);
      const day = refDate.getUTCDay() || 7; // Sonntag = 7
      const monday = new Date(refDate);
      monday.setUTCDate(refDate.getUTCDate() - (day - 1));
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      return { from: monday, to: sunday };
    } else if (periodType === "day") {
      // periodValue: "YYYY-MM-DD" (konkreter Tag)
      const d = parseDate(periodValue);
      return { from: d, to: d };
    } else {
      // "YYYY-MM" für Monate
      const [y, m] = periodValue.split("-").map(Number);
      const from = new Date(Date.UTC(y, m - 1, 1));
      const to = new Date(Date.UTC(y, m, 0)); // letzter Tag des Monats
      return { from, to };
    }
  }

  
  // --- Personalbedarfs- und Risiko-Logik (Früh/Spät, Krankheitsrisiko) ---

  /**
   * Gibt für einen Datumsbereich pro Tag eine Zusammenfassung zurück,
   * wie viele Früh- und Spätschichten geplant sind und wie gut die Zielwerte erfüllt werden.
   *
   * Rückgabeformat pro Tag:
   * {
   *   date: "2025-11-17",
   *   early: { required, planned, status }, // status: "red" | "yellow" | "green"
   *   late:  { required, planned, status }
   * }
   */
  
  // --- Staffing-Targets (Personalbedarf) Getter/Setter ---

  /**
   * Liefert die Zielbesetzung für einen Tag. Wenn es keinen Eintrag in byDate gibt,
   * wird auf den Default zurückgegriffen.
   */
  function getStaffingTargetForDate(dateISO) {
    const cfg = state.staffingTargets || {};
    const def = cfg.default || {};
    const byDate = cfg.byDate || {};
    const override = byDate[dateISO] || {};
    let early = override.early != null ? override.early : (def.early != null ? def.early : 0);
    let late = override.late != null ? override.late : (def.late != null ? def.late : 0);

    // Globale Regel: Wochenende = frei → Standardziel 0 für Früh/Spät,
    // sofern kein explizites Override für diesen Tag gesetzt ist.
    if (WEEKENDS_ARE_OFF && isWeekend(dateISO) && !byDate[dateISO]) {
      early = 0;
      late = 0;
    }

    return { early, late };
  }

  /**
   * Setzt (oder ändert) die Zielbesetzung für einen Tag.
   * partialTargets kann z.B. { early: 5 } oder { late: 3 } sein.
   * Wenn die Werte wieder dem Default entsprechen, wird der Tag aus byDate entfernt.
   */
  function setStaffingTargetForDate(dateISO, partialTargets) {
    if (!dateISO) return;
    if (!state.staffingTargets.byDate) {
      state.staffingTargets.byDate = {};
    }
    const def = state.staffingTargets.default || {};
    const existing = state.staffingTargets.byDate[dateISO] || {};
    const merged = {
      early: partialTargets.early != null
        ? partialTargets.early
        : (existing.early != null ? existing.early : (def.early != null ? def.early : 0)),
      late: partialTargets.late != null
        ? partialTargets.late
        : (existing.late != null ? existing.late : (def.late != null ? def.late : 0))
    };

    const sameAsDefault =
      (def.early != null ? def.early : 0) === merged.early &&
      (def.late != null ? def.late : 0) === merged.late;

    if (sameAsDefault) {
      delete state.staffingTargets.byDate[dateISO];
    } else {
      state.staffingTargets.byDate[dateISO] = merged;
    }
  }

  /**
   * Entfernt einen speziellen Eintrag für einen Tag, sodass wieder der Default gilt.
   */
  function resetStaffingTargetForDate(dateISO) {
    if (!dateISO || !state.staffingTargets.byDate) return;
    delete state.staffingTargets.byDate[dateISO];
  }

function getStaffingSummaryForRange(fromISO, toISODate) {
    const result = [];
    const from = parseDate(fromISO);
    const to = parseDate(toISODate);

    const toIsoString = d => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const computeStatus = (planned, required) => {
      if (!required || required <= 0) return "neutral";
      const ratio = planned / required;
      if (ratio >= 1) return "green";
      if (ratio >= 0.5) return "yellow";
      return "red";
    };

    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateISO = toIsoString(d);

      const shiftsOfDay = state.shifts.filter(s => s.date === dateISO && shiftCountsAsWork(s));

      const plannedEarly = shiftsOfDay.filter(s => s.typeId === "early" || s.typeId === "jumper_early").length;
      const plannedLate = shiftsOfDay.filter(s => s.typeId === "late" || s.typeId === "jumper_late").length;

      const targets = getStaffingTargetForDate(dateISO);
      const requiredEarly = targets.early ?? 0;
      const requiredLate = targets.late ?? 0;

      result.push({
        date: dateISO,
        early: {
          required: requiredEarly,
          planned: plannedEarly,
          status: computeStatus(plannedEarly, requiredEarly)
        },
        late: {
          required: requiredLate,
          planned: plannedLate,
          status: computeStatus(plannedLate, requiredLate)
        }
      });
    }

    return result;
  }

  /**
   * Berechnet einen einfachen Risiko-Report für einen Tag basierend auf Krank-Schichten.
   *
   * Rückgabeformat:
   * {
   *   date: "2025-11-17",
   *   level: "low" | "medium" | "high",
   *   messages: [ "..." ]
   * }
   */
  function calculateRiskForDay(dateISO) {
    const messages = [];

    const targetDate = parseDate(dateISO);

    const toISO = d => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    // Hilfsfunktion: Kranktage in den letzten N Tagen zählen
    function countSickDaysInPast(driverId, days) {
      const from = new Date(targetDate);
      from.setUTCDate(from.getUTCDate() - days);

      let count = 0;
      for (const s of state.shifts) {
        if (s.driverId !== driverId) continue;
        if (!s.typeId) continue;
        const type = getShiftTypeById(s.typeId);
        if (!type || type.id !== "sick") continue;

        const d = parseDate(s.date);
        if (d >= from && d <= targetDate) {
          count++;
        }
      }
      return count;
    }

    const shiftsOfDay = state.shifts.filter(s => s.date === dateISO);

    // 1) Direkt krank eingeplante Fahrer
    const sickToday = new Set();
    for (const s of shiftsOfDay) {
      const type = getShiftTypeById(s.typeId);
      if (!type) continue;
      if (type.id === "sick") {
        sickToday.add(s.driverId);
      }
    }

    for (const driverId of sickToday) {
      const d = getDriverById(driverId);
      const name = d ? d.name : driverId;
      messages.push(`Fahrer ${name} ist für diesen Tag krank eingeplant.`);
    }

    // 2) Fahrer mit vielen Krank-Tagen in den letzten 30 Tagen
    const seenDrivers = new Set(shiftsOfDay.map(s => s.driverId));
    for (const driverId of seenDrivers) {
      const sickDays = countSickDaysInPast(driverId, 30);
      if (sickDays >= 3) {
        const d = getDriverById(driverId);
        const name = d ? d.name : driverId;
        messages.push(`Fahrer ${name} hatte ${sickDays} Krank-Tage in den letzten 30 Tagen.`);
      }
    }

    // Risiko-Level aus Anzahl der Meldungen ableiten
    let level = "low";
    if (messages.length >= 3) {
      level = "high";
    } else if (messages.length >= 1) {
      level = "medium";
    }

    return {
      date: dateISO,
      level,
      messages
    };
  }


function getWorkHoursPerDriver(periodType, periodValue, { driverId = "all", shiftTypeId = "all" } = {}) {
    const { from, to } = getPeriodRange(periodType, periodValue);

    const toMin = t => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const result = {};
    for (const d of state.drivers) {
      if (driverId !== "all" && d.id !== driverId) continue;
      result[d.id] = { driver: d, totalHours: 0, overtimeHours: 0, nightHours: 0 };
    }

    for (const s of state.shifts) {
      const type = getShiftTypeById(s.typeId);
      if (!type || !type.countsAsWork) continue;
      if (!s.plannedStart || !s.plannedEnd) continue;
      if (!isWithinPeriod(s.date, from, to)) continue;
      if (driverId !== "all" && s.driverId !== driverId) continue;
      if (shiftTypeId !== "all" && s.typeId !== shiftTypeId) continue;

      let minutes = toMin(s.plannedEnd) - toMin(s.plannedStart);
      if (minutes < 0) minutes += 24 * 60;

      const rec = result[s.driverId];
      if (!rec) continue;
      rec.totalHours += minutes / 60;

      // Dummy-Regel: alles über 8h am Tag als Überstunden
      // (Für Demo: wir aggregieren hier nicht pro Tag, sondern überschlagsweise)
      if (minutes / 60 > 8) {
        rec.overtimeHours += (minutes / 60) - 8;
      }

      // Nachtstunden: Zeiten zwischen 22:00 und 06:00 (vereinfachte Schätzung)
      const startMin = toMin(s.plannedStart);
      const endMin = (startMin + minutes) % (24 * 60);
      if (startMin >= 22 * 60 || endMin <= 6 * 60) {
        rec.nightHours += minutes / 60;
      }
    }

    return Object.values(result);
  }


  function getAbsenceStats(periodType, periodValue, { driverId = "all" } = {}) {
    const { from, to } = getPeriodRange(periodType, periodValue);
    const result = {};
    for (const d of state.drivers) {
      if (driverId !== "all" && d.id !== driverId) continue;
      result[d.id] = {
        driver: d,
        vacation: 0,
        sick: 0,
        off: 0,
        holiday: 0
      };
    }

    for (const s of state.shifts) {
      if (!isWithinPeriod(s.date, from, to)) continue;
      if (driverId !== "all" && s.driverId !== driverId) continue;
      const type = getShiftTypeById(s.typeId);
      if (!type || type.countsAsWork) continue;

      const rec = result[s.driverId];
      if (!rec) continue;

      switch (s.typeId) {
        case "vacation":
          rec.vacation++;
          break;
        case "sick":
          rec.sick++;
          break;
        case "off":
          rec.off++;
          break;
        case "holiday":
          rec.holiday++;
          break;
        default:
          break;
      }
    }

    return Object.values(result);
  }


  function getRuleViolations(periodType, periodValue, { driverId = "all" } = {}) {
    const { from, to } = getPeriodRange(periodType, periodValue);
    const list = [];
    for (const s of state.shifts) {
      if (!s.errorList || s.errorList.length === 0) continue;
      if (!isWithinPeriod(s.date, from, to)) continue;
      if (driverId !== "all" && s.driverId !== driverId) continue;
      list.push(s);
    }
    return list;
  }


  function getHolidaysForPeriod(periodType, periodValue) {
    const { from, to } = getPeriodRange(periodType, periodValue);
    const year = from.getUTCFullYear();
    const map = BrandenburgHolidays.getHolidayMap(year);
    const holidays = [];
    Object.keys(map).forEach(dateStr => {
      if (isWithinPeriod(dateStr, from, to)) {
        holidays.push({ date: dateStr, name: map[dateStr] });
      }
    });
    return holidays;
  }

  

  /**
   * Liefert eine Schicht anhand ihrer ID.
   */
  function getShiftById(shiftId) {
    return state.shifts.find(s => s.id === shiftId) || null;
  }

  /**
   * Liefert alle Jumper-Schichten (Früh/Spät) für ein bestimmtes Datum (YYYY-MM-DD).
   */
  function getJumperShiftsForDate(dateISO) {
    return state.shifts.filter(s => {
      if (s.date !== dateISO) return false;
      const type = getShiftTypeById(s.typeId);
      if (!type) return false;
      return type.id === "jumper_early" || type.id === "jumper_late";
    });
  }

  /**
   * Liefert alle Abwesenheits-Schichten (Urlaub, Krank, Frei, Feiertag, …)
   * für ein bestimmtes Datum (YYYY-MM-DD).
   */
  function getAbsenceShiftsForDate(dateISO) {
    return state.shifts.filter(s => {
      if (s.date !== dateISO) return false;
      const type = getShiftTypeById(s.typeId);
      return !!(type && !type.countsAsWork);
    });
  }

  /**
   * Liefert mögliche Zuordnungen für einen Jumper:
   * - gleiche Datum
   * - passende Schichtart (Früh/Spät) anhand des Jumper-Typs
   *
   * Rückgabe: Array von Objekten mit:
   *   { absenceShift, driver, lineCodeGuess }
   */
  function getJumperAssignmentOptions(jumperShiftId) {
    const jumper = getShiftById(jumperShiftId);
    if (!jumper) return [];

    const type = getShiftTypeById(jumper.typeId);
    if (!type) return [];

    const dateISO = jumper.date;
    const absences = getAbsenceShiftsForDate(dateISO);

    const isEarlyJumper = type.id === "jumper_early";
    const isLateJumper = type.id === "jumper_late";

    // Heuristik: wir betrachten für Jumper Früh/Spät alle Abwesenheiten,
    // der Nutzer wählt dann manuell, welche er abdecken soll.
    return absences.map(a => {
      const driver = getDriverById(a.driverId);
      // Linie kann aktuell nicht sauber abgeleitet werden -> Nutzer entscheidet,
      // oder wir übernehmen ggf. vorhandene lineCode-Info der Abwesenheit.
      const lineCodeGuess = a.lineCode || null;
      return {
        absenceShift: a,
        driver,
        lineCodeGuess,
        isEarlyJumper,
        isLateJumper
      };
    });
  }

  /**
   * Weist einem Jumper eine Ausfall-Schicht zu.
   * - Kopiert optional lineCode von der Ausfall-Schicht
   * - Merkt sich referenzierte Fahrer/Schichten zur Nachvollziehbarkeit.
   */
  function assignJumperToAbsence(jumperShiftId, absenceShiftId, { lineCode = null } = {}) {
    const jumper = getShiftById(jumperShiftId);
    const absence = getShiftById(absenceShiftId);
    if (!jumper || !absence) return null;

    // Linie übernehmen: erst explizit übergebenen Wert, sonst von der Ausfall-Schicht,
    // andernfalls unverändert lassen.
    const effectiveLineCode = lineCode || absence.lineCode || jumper.lineCode || null;

    jumper.lineCode = effectiveLineCode;
    jumper.coveredDriverId = absence.driverId;
    jumper.coveredShiftId = absence.id;

    // Optional: Notiz ergänzen, dass es sich um eine Vertretung handelt.
    if (!jumper.note) {
      const driver = getDriverById(absence.driverId);
      const driverName = driver ? driver.name : "ausgefallener Fahrer";
      jumper.note = `Einsatz als Jumper für ${driverName}`;
    }

    return jumper;
  }

function getShiftsForRange(from, to, { driverId = null, includeApproved = true, onlyWithViolations = false, onlyWork = false } = {}) {
    return state.shifts.filter(s => {
      const d = parseDate(s.date);
      if (d < from || d > to) return false;
      if (driverId && driverId !== "all" && s.driverId !== driverId) return false;
      if (!includeApproved && s.approved) return false;
      if (onlyWithViolations && (!s.errorList || s.errorList.length === 0)) return false;
      if (onlyWork) {
        const type = getShiftTypeById(s.typeId);
        if (!type || !type.countsAsWork) return false;
      }
      return true;
    });
  }

  
  function getDriverKpiDetail(periodType, periodValue, driverId, shiftTypeId = "all") {
    if (!driverId || driverId === "all") {
      return null;
    }

    const { from, to } = getPeriodRange(periodType, periodValue);

    // Alle Schichten des Fahrers im Zeitraum
    const shifts = getShiftsForRange(from, to, {
      driverId,
      includeApproved: true,
      onlyWithViolations: false,
      onlyWork: false
    });

    const driver = getDriverById(driverId);
    if (!driver) {
      return null;
    }

    if (!shifts.length) {
      return {
        driver,
        totalShifts: 0,
        earlyCount: 0,
        lateCount: 0,
        nightCount: 0,
        vacationDays: 0,
        sickDays: 0,
        offDays: 0,
        avgShiftHours: 0,
        earliestStart: null,
        latestEnd: null
      };
    }

    return calculateDriverKpiFromShifts(shifts, driver, shiftTypeId);
  }

  function calculateDriverKpiFromShifts(shifts, driver, shiftTypeId) {
    const toMin = t => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };
    
        let totalShifts = 0;
        let earlyCount = 0;
        let lateCount = 0;
        let nightCount = 0;
        let vacationDays = 0;
        let sickDays = 0;
        let offDays = 0;
        let totalMinutes = 0;
        let earliestStart = null;
        let latestEnd = null;
    
        shifts.forEach(s => {
          if (!s.typeId) return;
          if (shiftTypeId !== "all" && s.typeId !== shiftTypeId) return;
    
          const type = getShiftTypeById(s.typeId);
          const isWork = type && type.countsAsWork;
    
          if (isWork && s.plannedStart && s.plannedEnd) {
            const startMin = toMin(s.plannedStart);
            let minutes = toMin(s.plannedEnd) - startMin;
            if (minutes < 0) minutes += 24 * 60;
    
            const endMin = (startMin + minutes) % (24 * 60);
    
            if (earliestStart === null || startMin < earliestStart) {
              earliestStart = startMin;
            }
            if (latestEnd === null || endMin > latestEnd) {
              latestEnd = endMin;
            }
    
            totalMinutes += minutes;
            totalShifts++;
          }
    
          // Zählung nach Schichttyp
          switch (s.typeId) {
            case "early":
              earlyCount++;
              break;
            case "late":
              lateCount++;
              break;
            case "night":
              nightCount++;
              break;
            case "vacation":
              vacationDays++;
              break;
            case "sick":
              sickDays++;
              break;
            case "off":
              offDays++;
              break;
            default:
              break;
          }
        });
    
        const avgShiftHours = totalShifts > 0 ? totalMinutes / 60 / totalShifts : 0;
    
        const toTimeString = minutes => {
          const m = minutes % (24 * 60);
          const h = Math.floor(m / 60);
          const mm = m % 60;
          return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
        };
    
        return {
          driver,
          totalShifts,
          earlyCount,
          lateCount,
          nightCount,
          vacationDays,
          sickDays,
          offDays,
          avgShiftHours,
          earliestStart: earliestStart !== null ? toTimeString(earliestStart) : null,
          latestEnd: latestEnd !== null ? toTimeString(latestEnd) : null
        };
  }


  // Exportiert den aktuellen Zustand als Plain-Objekt für Backups.
  function exportStateAsJson() {
    return {
      drivers: state.drivers,
      shiftTypes: state.shiftTypes,
      templates: state.templates,
      shifts: state.shifts,
      ruleConfig: state.ruleConfig
    };
  }

  // Importiert einen zuvor exportierten Zustand.
  // Erwartet ein Objekt mit drivers, shiftTypes, templates, shifts, ruleConfig.
  function importStateFromObject(obj) {
    if (!obj || typeof obj !== "object") {
      throw new Error("Ungültiges Backup-Format (kein Objekt).");
    }

    const next = {
      drivers: Array.isArray(obj.drivers) ? obj.drivers : [],
      shiftTypes: Array.isArray(obj.shiftTypes) ? obj.shiftTypes : state.shiftTypes.slice(),
      templates: Array.isArray(obj.templates) ? obj.templates : [],
      shifts: Array.isArray(obj.shifts) ? obj.shifts : [],
      ruleConfig: obj.ruleConfig && typeof obj.ruleConfig === "object"
        ? obj.ruleConfig
        : state.ruleConfig
    };

    state.drivers = next.drivers;
    state.shiftTypes = next.shiftTypes;
    state.templates = next.templates;
    state.shifts = next.shifts;
    state.ruleConfig = next.ruleConfig;

    save();
  }


return {
    load,
    save,
    getState,
    getDrivers,
    getDriverById,
    addDriver,
    updateDriver,
    deleteDriver,
    getShiftTypeById,
    getTemplateById,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getShiftsForDriverAndDate,
    addShiftFromTemplate,
    deleteShift,
    updateShift,
    // Jumper-Logik
    getShiftById,
    getJumperShiftsForDate,
    getAbsenceShiftsForDate,
    getJumperAssignmentOptions,
    assignJumperToAbsence,
    // Frühschicht-Linien-Rotation (Mo–Fr)
    getEarlyLinePatternForStart,
    getEarlyLineAssignmentsForWeek,
    autoFillEarlyWeekForDriver,
    // Spät- & Wochenendlogik
    getLateLinePatternForStart,
    getLateLineAssignmentsForWeek,
    autoFillLateWeekForDriver,
    autoFillWeekendOffForWeek,
    getWorkHoursPerDriver,
    getAbsenceStats,
    getRuleViolations,
    getHolidaysForPeriod,
    getShiftsForRange,
    getDriverKpiDetail,
    // Staffing-Targets (konfigurierbar)
    getStaffingTargetForDate,
    setStaffingTargetForDate,
    resetStaffingTargetForDate,
    // Neue Auswertungen
    getStaffingSummaryForRange,
    calculateRiskForDay,
    exportStateAsJson,
    importStateFromObject
  };
})();

  function getShiftListForMonth(year, month, { driverId = "all", shiftTypeId = "all" } = {}) {
    const y = Number(year);
    const m = Number(month);
    if (!Number.isFinite(y) || !Number.isFinite(m)) {
      return [];
    }
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);

    const shifts = getShiftsForRange(from, to, {
      driverId,
      includeApproved: true,
      onlyWithViolations: false,
      onlyWork: false
    });

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return [];
    }

    const rows = [];
    shifts.forEach(s => {
      const shiftType = getShiftTypeById(s.typeId);
      if (shiftTypeId && shiftTypeId !== "all") {
        if (!shiftType || shiftType.id !== shiftTypeId) {
          return;
        }
      }
      const driver = getDriverById(s.driverId);
      rows.push({
        id: s.id,
        date: s.date,
        driver,
        shiftType,
        lineCode: s.lineCode || "",
        note: s.note || "",
        start: s.start || null,
        end: s.end || null
      });
    });

    rows.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      const aName = (a.driver && a.driver.name) ? a.driver.name : "";
      const bName = (b.driver && b.driver.name) ? b.driver.name : "";
      return aName.localeCompare(bName, "de");
    });

    return rows;
  }


