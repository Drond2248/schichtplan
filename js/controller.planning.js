// controller.planning.js

// Hilfsfunktion: prüft, ob ein ISO-Datum (YYYY-MM-DD) ein Montag ist.
function isMonday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const weekday = d.getDay(); // 0=So, 1=Mo, ..., 6=Sa
  return weekday === 1;
}

// Wochen- und Monatsplanung, sowie Schichtdetails.

function initWeekView() {
  const weekPrev = document.getElementById("week-prev");
  const weekNext = document.getElementById("week-next");
  const weekToday = document.getElementById("week-today");
  const weekPicker = document.getElementById("week-date-picker");

  weekPrev.addEventListener("click", () => {
    state.weekRefDate.setDate(state.weekRefDate.getDate() - 7);
    refreshWeekView();
  });
  weekNext.addEventListener("click", () => {
    state.weekRefDate.setDate(state.weekRefDate.getDate() + 7);
    refreshWeekView();
  });
  weekToday.addEventListener("click", () => {
    state.weekRefDate = new Date();
    refreshWeekView();
  });
  weekPicker.addEventListener("change", () => {
    if (!weekPicker.value) return;
    const [y, m, d] = weekPicker.value.split("-").map(Number);
    state.weekRefDate = new Date(y, m - 1, d);
    refreshWeekView();
  });
  document.getElementById("toggle-templates").addEventListener("click", () => {
    BusplanView.toggleTemplatePanel();
  });

  // Drag & Drop
  const templatePanel = document.getElementById("template-panel");
  templatePanel.addEventListener("dragstart", evt => {
    const templateId = evt.target.dataset.templateId;
    if (!templateId) return;
    evt.dataTransfer.setData("text/plain", templateId);
  });

  const gridBody = document.getElementById("week-grid-body");
  gridBody.addEventListener("dragover", evt => {
    evt.preventDefault();
  });
  gridBody.addEventListener("drop", evt => {
    evt.preventDefault();
    const templateId = evt.dataTransfer.getData("text/plain");
    const cell = evt.target.closest(".grid-cell");
    if (!cell || !templateId) return;

    const driverId = cell.dataset.driverId;
    const date = cell.dataset.date;

    // 1) Wie bisher: Schicht aus Template für die gedroppte Zelle anlegen
    BusplanModel.addShiftFromTemplate(driverId, date, templateId);

    // 2) Früh-/Spätschicht-Rotation (Mo–Fr) anstoßen, wenn:
    //    - Template ein Früh- oder Spätdienst ist (typeId === "early" / "late")
    //    - Datum ein Montag ist
    const template = BusplanModel.getTemplateById(templateId);

    if (template && isMonday(date)) {
      const startLineCode = template.lineCode; // z. B. "R1", "G1", ...

      if (template.typeId === "early") {
        // Auto-Fill für Di–Fr (Frühschichten): nur leere Zellen werden befüllt
        BusplanModel.autoFillEarlyWeekForDriver(driverId, date, startLineCode);
      } else if (template.typeId === "late") {
        // Auto-Fill für Di–Fr (Spätschichten): nur leere Zellen werden befüllt
        BusplanModel.autoFillLateWeekForDriver(driverId, date, startLineCode);
      }
    }

    // 3) UI aktualisieren
    refreshWeekView();
  });

  // Shift click / context menu
  gridBody.addEventListener("click", evt => {
    const block = evt.target.closest(".shift-block");
    if (!block) return;
    const shiftId = block.dataset.shiftId;
    showShiftDetails(shiftId);
  });

  gridBody.addEventListener("contextmenu", evt => {
    const block = evt.target.closest(".shift-block");
    if (!block) return;
    evt.preventDefault();
    const shiftId = block.dataset.shiftId;
    if (confirm("Diese Schicht löschen?")) {
      BusplanModel.deleteShift(shiftId);
      refreshWeekView();
    }
  });
}


function initMonthView() {
  const monthPrev = document.getElementById("month-prev");
  const monthNext = document.getElementById("month-next");
  const monthToday = document.getElementById("month-today");
  const monthPicker = document.getElementById("month-picker");
  const monthDriverSelect = document.getElementById("month-driver-select");

  monthPrev.addEventListener("click", () => {
    state.monthRefDate.setMonth(state.monthRefDate.getMonth() - 1);
    refreshMonthView();
  });
  monthNext.addEventListener("click", () => {
    state.monthRefDate.setMonth(state.monthRefDate.getMonth() + 1);
    refreshMonthView();
  });
  monthToday.addEventListener("click", () => {
    state.monthRefDate = new Date();
    refreshMonthView();
  });
  monthPicker.addEventListener("change", () => {
    if (!monthPicker.value) return;
    const [y, m] = monthPicker.value.split("-").map(Number);
    state.monthRefDate = new Date(y, m - 1, 1);
    refreshMonthView();
  });

  if (monthDriverSelect) {
    monthDriverSelect.addEventListener("change", () => {
      state.monthDriverId = monthDriverSelect.value || "all";
      refreshMonthView();
    });
  }
}

function initMonthListView() {
  const prevBtn = document.getElementById("month-list-prev");
  const nextBtn = document.getElementById("month-list-next");
  const todayBtn = document.getElementById("month-list-today");
  const picker = document.getElementById("month-list-picker");
  const driverSelect = document.getElementById("month-list-driver");
  const shiftTypeSelect = document.getElementById("month-list-shift-type");

  if (!picker) {
    return;
  }

  // Initialwert: aktueller monthRefDate
  const d = state.monthRefDate instanceof Date ? state.monthRefDate : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  picker.value = `${y}-${m}`;

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      state.monthRefDate.setMonth(state.monthRefDate.getMonth() - 1);
      const d2 = state.monthRefDate;
      const y2 = d2.getFullYear();
      const m2 = String(d2.getMonth() + 1).padStart(2, "0");
      picker.value = `${y2}-${m2}`;
      const monthPicker = document.getElementById("month-picker");
      if (monthPicker) {
        monthPicker.value = picker.value;
      }
      refreshMonthView();
      refreshMonthListView();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      state.monthRefDate.setMonth(state.monthRefDate.getMonth() + 1);
      const d2 = state.monthRefDate;
      const y2 = d2.getFullYear();
      const m2 = String(d2.getMonth() + 1).padStart(2, "0");
      picker.value = `${y2}-${m2}`;
      const monthPicker = document.getElementById("month-picker");
      if (monthPicker) {
        monthPicker.value = picker.value;
      }
      refreshMonthView();
      refreshMonthListView();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", () => {
      state.monthRefDate = new Date();
      const d2 = state.monthRefDate;
      const y2 = d2.getFullYear();
      const m2 = String(d2.getMonth() + 1).padStart(2, "0");
      picker.value = `${y2}-${m2}`;
      const monthPicker = document.getElementById("month-picker");
      if (monthPicker) {
        monthPicker.value = picker.value;
      }
      refreshMonthView();
      refreshMonthListView();
    });
  }

  picker.addEventListener("change", () => {
    if (!picker.value) return;
    const [yearStr, monthStr] = picker.value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    state.monthRefDate = new Date(year, month - 1, 1);
    const monthPicker = document.getElementById("month-picker");
    if (monthPicker) {
      monthPicker.value = picker.value;
    }
    refreshMonthView();
    refreshMonthListView();
  });

  if (driverSelect) {
    driverSelect.addEventListener("change", () => {
      refreshMonthListView();
    });
  }
  if (shiftTypeSelect) {
    shiftTypeSelect.addEventListener("change", () => {
      refreshMonthListView();
    });
  }
}

function refreshMonthListView() {
  if (state.currentView !== "month-list") return;

  const container = document.getElementById("month-list-table");
  if (!container) return;

  const picker = document.getElementById("month-list-picker");
  const driverSelect = document.getElementById("month-list-driver");
  const shiftTypeSelect = document.getElementById("month-list-shift-type");

  let refDate = state.monthRefDate instanceof Date ? new Date(state.monthRefDate) : new Date();
  if (picker && picker.value) {
    const [yearStr, monthStr] = picker.value.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (Number.isFinite(year) && Number.isFinite(month)) {
      refDate = new Date(year, month - 1, 1);
      state.monthRefDate = refDate;
    }
  } else if (picker) {
    const y = refDate.getFullYear();
    const m = String(refDate.getMonth() + 1).padStart(2, "0");
    picker.value = `${y}-${m}`;
  }

  const year = refDate.getFullYear();
  const month = refDate.getMonth() + 1;

  const modelState = BusplanModel.getState();

  // Fahrer-Auswahl aufbauen
  if (driverSelect) {
    const current = driverSelect.value || "all";
    while (driverSelect.firstChild) {
      driverSelect.removeChild(driverSelect.firstChild);
    }
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Alle Fahrer";
    driverSelect.appendChild(optAll);
    (modelState.drivers || []).forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      driverSelect.appendChild(opt);
    });
    if (current) {
      driverSelect.value = current;
    }
  }

  // Schichttypen-Auswahl aufbauen
  if (shiftTypeSelect) {
    const current = shiftTypeSelect.value || "all";
    while (shiftTypeSelect.firstChild) {
      shiftTypeSelect.removeChild(shiftTypeSelect.firstChild);
    }
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Alle Schichten";
    shiftTypeSelect.appendChild(optAll);
    (modelState.shiftTypes || []).forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      shiftTypeSelect.appendChild(opt);
    });
    if (current) {
      shiftTypeSelect.value = current;
    }
  }

  const driverId = driverSelect ? (driverSelect.value || "all") : "all";
  const shiftTypeId = shiftTypeSelect ? (shiftTypeSelect.value || "all") : "all";

  const rows = BusplanModel.getShiftListForMonth(year, month, { driverId, shiftTypeId });
  BusplanView.renderMonthlyShiftList("month-list-table", rows, { year, month });
}
function openStaffingTargetDialog(dateISO) {
  if (!dateISO) return;

  const currentTargets = BusplanModel.getStaffingTargetForDate(dateISO) || {};
  const early = currentTargets.early != null ? currentTargets.early : "";
  const late = currentTargets.late != null ? currentTargets.late : "";

  const formattedDate = (function () {
    const d = new Date(dateISO + "T00:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  })();

  const html = `
    <div class="form-grid">
      <div class="form-row">
        <label>Datum</label>
        <div>${formattedDate}</div>
      </div>
      <div class="form-row">
        <label for="staffing-early-input">Früh (Fahrer-Ziel)</label>
        <input id="staffing-early-input" type="number" min="0" value="${early}">
      </div>
      <div class="form-row">
        <label for="staffing-late-input">Spät (Fahrer-Ziel)</label>
        <input id="staffing-late-input" type="number" min="0" value="${late}">
      </div>
      <div class="form-row">
        <button id="staffing-reset-button" class="secondary-button" type="button">
          Auf Standard zurücksetzen
        </button>
      </div>
    </div>
  `;

  BusplanView.showModal("Personalbedarf anpassen", html);

  const earlyInput = document.getElementById("staffing-early-input");
  const lateInput = document.getElementById("staffing-late-input");
  const resetButton = document.getElementById("staffing-reset-button");
  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "Speichern";
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      BusplanModel.resetStaffingTargetForDate(dateISO);
      refreshWeekView();
      modalOkHandler = null;
      BusplanView.hideModal();
      resetModalOkLabel();
    });
  }

  // OK-Handler speichert neue Werte
  modalOkHandler = () => {
    const partial = {};
    if (earlyInput && earlyInput.value.trim() !== "") {
      const n = parseInt(earlyInput.value.trim(), 10);
      if (!Number.isFinite(n) || n < 0) {
        BusplanView.showError("Bitte eine gültige Zahl für Früh-Ziel eingeben.");
        return false;
      }
      partial.early = n;
    }
    if (lateInput && lateInput.value.trim() !== "") {
      const n = parseInt(lateInput.value.trim(), 10);
      if (!Number.isFinite(n) || n < 0) {
        BusplanView.showError("Bitte eine gültige Zahl für Spät-Ziel eingeben.");
        return false;
      }
      partial.late = n;
    }

    // Wenn beide Felder leer sind, interpretieren wir das als "zurück auf Default".
    if (!("early" in partial) && !("late" in partial)) {
      BusplanModel.resetStaffingTargetForDate(dateISO);
    } else {
      BusplanModel.setStaffingTargetForDate(dateISO, partial);
    }

    refreshWeekView();
    return true; // Modal wird vom Core geschlossen
  };
}


function refreshWeekView() {
  if (state.currentView !== "week") return;
  const modelState = BusplanModel.getState();
  const weekDates = BusplanView.getWeekDates(state.weekRefDate);

  const weekLabel = document.getElementById("week-label");
  const first = weekDates[0];
  const last = weekDates[6];
  const formatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const weekNum = getISOWeekNumber(state.weekRefDate);
  weekLabel.textContent = `KW ${weekNum} · ${formatter.format(first)} – ${formatter.format(last)}`;

  // Globale Regel: Wochenende = frei → Frei-Schichten ggfs. automatisch setzen.
  if (BusplanModel.autoFillWeekendOffForWeek) {
    BusplanModel.autoFillWeekendOffForWeek(weekDates);
  }

  const fromISO = BusplanView.formatDateISO(weekDates[0]);
  const toISO = BusplanView.formatDateISO(weekDates[6]);
  const staffingSummary = BusplanModel.getStaffingSummaryForRange(fromISO, toISO);

  BusplanView.renderWeekHeader(weekDates, staffingSummary);

  // Klick auf Wochen-Header erlaubt das Bearbeiten der Tages-Zielwerte (Früh/Spät)
  const header = document.getElementById("week-grid-header");
  if (header) {
    header.querySelectorAll(".grid-header-cell").forEach(cell => {
      const dateISO = cell.dataset.date;
      if (!dateISO) return;
      BusplanView.markClickable(cell);
      cell.addEventListener("click", () => {
        openStaffingTargetDialog(dateISO);
      });
    });
  }

  const year = state.weekRefDate.getFullYear();
  const holidayMap = BrandenburgHolidays.getHolidayMap(year);

  BusplanView.renderWeekBody(
    modelState.drivers,
    weekDates,
    BusplanModel.getShiftsForDriverAndDate,
    holidayMap
  );

  const weekPicker = document.getElementById("week-date-picker");
  weekPicker.value = BusplanView.formatDateISO(state.weekRefDate);
}


function refreshMonthView() {
  if (state.currentView !== "month") return;
  const modelState = BusplanModel.getState();
  const label = document.getElementById("month-label");
  const formatter = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
  label.textContent = formatter.format(state.monthRefDate);

  const monthPicker = document.getElementById("month-picker");
  monthPicker.value = state.monthRefDate.toISOString().slice(0, 7);

  // Fahrer-Auswahl im Monat-View aktualisieren
  const driverSelect = document.getElementById("month-driver-select");
  if (driverSelect) {
    const previousValue = driverSelect.value || state.monthDriverId || "all";
    // Optionen zurücksetzen
    while (driverSelect.firstChild) {
      driverSelect.removeChild(driverSelect.firstChild);
    }

    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "Alle Fahrer";
    driverSelect.appendChild(optAll);

    if (modelState && Array.isArray(modelState.drivers)) {
      modelState.drivers.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name;
        driverSelect.appendChild(opt);
      });
    }

    // Auswahl wiederherstellen, falls möglich
    let targetValue = previousValue;
    const values = Array.from(driverSelect.options).map(o => o.value);
    if (!values.includes(targetValue)) {
      targetValue = "all";
    }
    driverSelect.value = targetValue;
    state.monthDriverId = targetValue;
  }

  const periodType = "month";
  const periodValue = monthPicker.value;
  const holidays = BusplanModel.getHolidaysForPeriod(periodType, periodValue);

  function shiftsLookup(dateStr) {
    const allShifts = BusplanModel.getState().shifts.filter(s => s.date === dateStr);
    const selectedDriverId = state.monthDriverId;
    if (!selectedDriverId || selectedDriverId === "all") {
      return allShifts;
    }
    return allShifts.filter(s => s.driverId === selectedDriverId);
  }

  BusplanView.renderMonthView(state.monthRefDate, shiftsLookup, holidays);
}


function showShiftDetails(shiftId) {
  const state = BusplanModel.getState();
  const shift = state.shifts.find(s => s.id === shiftId);
  if (!shift) return;
  const driver = BusplanModel.getDriverById(shift.driverId);
  const type = BusplanModel.getShiftTypeById(shift.typeId);

  const html = `
    <p><strong>Fahrer:</strong> ${driver ? driver.name : ""}</p>
    <p><strong>Datum:</strong> ${shift.date}</p>
    <p><strong>Typ:</strong> ${type ? type.name : ""}</p>
    <p><strong>Linie:</strong> ${shift.lineCode ?? "-"}</p>
    <p><strong>Geplante Zeit:</strong> ${(shift.plannedStart ?? "")} – ${(shift.plannedEnd ?? "")}</p>
    <p><strong>Notiz:</strong> ${shift.note ?? ""}</p>
    <p><strong>Fehler:</strong> ${(shift.errorList || []).join(", ") || "Keine"}</p>
  `;
  BusplanView.showModal("Schichtdetails", html);
}

// Einfacher Controller-Namespace für Planungs-spezifische Aktionen (z. B. Jumper).
window.BusplanPlanningController = window.BusplanPlanningController || {};

/**
 * Klick-Handler für Jumper-Schichten.
 * - Frägt das Model nach möglichen Ausfall-Schichten an diesem Tag.
 * - Wenn keine vorhanden: Hinweis anzeigen.
 * - Wenn eine vorhanden: direkt zuweisen.
 * - Wenn mehrere vorhanden: einfache Auswahl per prompt().
 */
BusplanPlanningController.handleJumperClick = function (jumperShiftId) {
  const options = BusplanModel.getJumperAssignmentOptions(jumperShiftId) || [];
  if (!options.length) {
    BusplanView.showError("Keine Ausfall-Schichten für diesen Tag gefunden, die der Jumper übernehmen kann.");
    return;
  }

  // Nur eine Option → direkt zuweisen.
  if (options.length === 1) {
    const opt = options[0];
    const absence = opt.absenceShift;
    const lineCode = opt.lineCodeGuess || prompt(
      "Bitte die zu übernehmende Linie für den Jumper eintragen (z.B. R1, G1):",
      ""
    ) || null;

    BusplanModel.assignJumperToAbsence(jumperShiftId, absence.id, { lineCode });
    refreshWeekView();
    return;
  }

  // Mehrere Optionen → per prompt Auswahl ermöglichen.
  let message = "Bitte wählen, für welchen Ausfall der Jumper einspringen soll:\n";
  options.forEach((opt, index) => {
    const absence = opt.absenceShift;
    const driverName = opt.driver ? opt.driver.name : "Unbekannter Fahrer";
    const lineInfo = opt.lineCodeGuess ? `Linie: ${opt.lineCodeGuess}` : "Linie: (manuell eingeben)";
    message += `\n${index + 1}) ${driverName} am ${absence.date} – ${lineInfo}`;
  });
  message += "\n\nNummer eingeben (Abbrechen zum Abbrechen):";

  const input = prompt(message, "1");
  if (!input) return;
  const choice = parseInt(input, 10);
  if (isNaN(choice) || choice < 1 || choice > options.length) {
    BusplanView.showError("Ungültige Auswahl.");
    return;
  }

  const selected = options[choice - 1];
  const absence = selected.absenceShift;

  const lineCode = selected.lineCodeGuess || prompt(
    "Bitte die zu übernehmende Linie für den Jumper eintragen (z.B. R1, G1):",
    ""
  ) || null;

  BusplanModel.assignJumperToAbsence(jumperShiftId, absence.id, { lineCode });
  refreshWeekView();
};

