// controller.reporting.js
// Reporting- / KPI-Ansicht und Export.

function initReportingView() {
  const periodTypeSelect = document.getElementById("report-period-type");
  const dateInput = document.getElementById("report-period-date");
  const monthInput = document.getElementById("report-period-month");
  const yearInput = document.getElementById("report-period-year");
  function updatePeriodUi() {
    const type = periodTypeSelect ? periodTypeSelect.value : "month";
    BusplanView.updateReportPeriodUi(type);
  }


  if (periodTypeSelect) {
    periodTypeSelect.addEventListener("change", updatePeriodUi);
  }
  updatePeriodUi();

  const refreshBtn = document.getElementById("report-refresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshReportingView();
    });
  }

  // Export-Button: Verhalten hängt vom Berichtstyp ab
  const exportTriggerBtn = document.getElementById("report-export");
  if (exportTriggerBtn) {
    exportTriggerBtn.addEventListener("click", () => {
      const period = getCurrentReportingPeriod();
      const periodType = period.periodType || "month";

      if (periodType === "day") {
        // Tagesreport
        exportDailyReportCsv();
      } else if (periodType === "week") {
        // Wochenreport
        exportWeeklyReportCsv();
      } else {
        // Monat / Jahr → Gesamt-Report für Zeitraum
        exportReportCsv();
      }
    });
  }

  // Fallback: alte, separate Buttons bleiben funktionsfähig, falls vorhanden.
  const exportBtn = document.getElementById("report-export-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportReportCsv();
    });
  }

  const weekExportBtn = document.getElementById("report-export-week-csv");
  if (weekExportBtn) {
    weekExportBtn.addEventListener("click", () => {
      exportWeeklyReportCsv();
    });
  }

  const dayExportBtn = document.getElementById("report-export-day-csv");
  if (dayExportBtn) {
    dayExportBtn.addEventListener("click", () => {
      exportDailyReportCsv();
    });
  }
}


function getCurrentReportingPeriod() {
  const typeSelect = document.getElementById("report-period-type");
  const periodType = typeSelect ? typeSelect.value : "month";

  let periodValue;
  const today = new Date();

  if (periodType === "day" || periodType === "week") {
    const dateInput = document.getElementById("report-period-date");
    periodValue = dateInput ? dateInput.value : "";
    if (!periodValue && dateInput) {
      periodValue = BusplanView.formatDateISO(today);
      dateInput.value = periodValue;
    }
  } else if (periodType === "month") {
    const monthInput = document.getElementById("report-period-month");
    periodValue = monthInput ? monthInput.value : "";
    if (!periodValue && monthInput) {
      periodValue = today.toISOString().slice(0, 7);
      monthInput.value = periodValue;
    }
  } else if (periodType === "year") {
    const yearInput = document.getElementById("report-period-year");
    periodValue = yearInput ? yearInput.value : "";
    if (!periodValue && yearInput) {
      periodValue = String(today.getFullYear());
      yearInput.value = periodValue;
    }
  } else {
    periodValue = today.toISOString().slice(0, 7);
  }

  return { periodType, periodValue };
}

function refreshReportingView() {
  if (state.currentView !== "reporting") return;

  const period = getCurrentReportingPeriod();
  const periodType = period.periodType;
  const periodValue = period.periodValue;

  const driverId = document.getElementById("report-driver").value;
  const shiftTypeId = document.getElementById("report-shift-type").value;

  const workRows = BusplanModel.getWorkHoursPerDriver(periodType, periodValue, {
    driverId,
    shiftTypeId
  });
  const absenceRows = BusplanModel.getAbsenceStats(periodType, periodValue, {
    driverId
  });
  const violations = BusplanModel.getRuleViolations(periodType, periodValue, {
    driverId
  });

  const totalWorkHours = workRows.reduce((sum, r) => sum + r.totalHours, 0);
  const avgHours = workRows.length ? totalWorkHours / workRows.length : 0;
  const totalOvertime = workRows.reduce((sum, r) => sum + r.overtimeHours, 0);

  const totalVacation = absenceRows.reduce((sum, r) => sum + r.vacation, 0);
  const totalSick = absenceRows.reduce((sum, r) => sum + r.sick, 0);
  const totalOff = absenceRows.reduce((sum, r) => sum + r.off, 0);
  const totalHoliday = absenceRows.reduce((sum, r) => sum + r.holiday, 0);

  const kpis = {
    totalWorkHours,
    avgHoursPerDriver: avgHours,
    totalOvertime,
    ruleViolations: violations.length,
    vacationDays: totalVacation,
    sickDays: totalSick,
    offDays: totalOff,
    holidayDays: totalHoliday
  };

  const driverDetail = BusplanModel.getDriverKpiDetail(periodType, periodValue, driverId, shiftTypeId);

  BusplanView.renderKpiCards(kpis);
  BusplanView.renderWorktimeTable(workRows);
  BusplanView.renderAbsenceTable(absenceRows);
  BusplanView.renderViolationsTable(violations);
  BusplanView.renderDriverKpiDetail(driverDetail);
}




function downloadCsv(filename, lines) {
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Baut einen kombinierten CSV-Export für den aktuellen Zeitraum (Monat/Jahr).
// Baut einen kombinierten CSV-Export für den aktuellen Zeitraum (Monat/Woche/Jahr).
// Baut einen kombinierten CSV-Export für den aktuellen Zeitraum (Tag/Woche/Monat/Jahr).
function exportReportCsv() {
  const period = getCurrentReportingPeriod();
  const periodType = period.periodType;
  const periodValue = period.periodValue;

  const driverId = document.getElementById("report-driver").value;
  const shiftTypeId = document.getElementById("report-shift-type").value;

  const workRows = BusplanModel.getWorkHoursPerDriver(periodType, periodValue, {
    driverId,
    shiftTypeId
  });
  const absenceRows = BusplanModel.getAbsenceStats(periodType, periodValue, {
    driverId
  });
  const violations = BusplanModel.getRuleViolations(periodType, periodValue, {
    driverId
  });

  const lines = [];
  const sep = ";";

  // Abschnitt 1: Arbeitszeit je Fahrer
  lines.push("Arbeitszeit je Fahrer");
  lines.push(["Fahrer", "Stunden gesamt", "Überstunden", "Nachtstunden"].join(sep));
  workRows.forEach(r => {
    const name = r.driver ? r.driver.name : "";
    lines.push([
      name,
      r.totalHours.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.nightHours.toFixed(2)
    ].join(sep));
  });

  lines.push("");
  // Abschnitt 2: Abwesenheit je Fahrer
  const absenceById = {};
  absenceRows.forEach(r => {
    if (r.driver) {
      absenceById[r.driver.id] = r;
    }
  });

  lines.push("Abwesenheit je Fahrer");
  lines.push(["Fahrer", "Urlaub", "Krank", "Frei", "Feiertage"].join(sep));
  workRows.forEach(r => {
    const driver = r.driver;
    const abs = driver && absenceById[driver.id] ? absenceById[driver.id] : { vacation: 0, sick: 0, off: 0, holiday: 0 };
    lines.push([
      driver ? driver.name : "",
      abs.vacation,
      abs.sick,
      abs.off,
      abs.holiday
    ].join(sep));
  });

  lines.push("");
  // Abschnitt 3: Regelverstöße
  lines.push("Regelverstöße");
  lines.push(["Schicht-ID", "Fahrer", "Datum", "Regel", "Kommentar"].join(sep));
  violations.forEach(v => {
    const driver = v.driver;
    const name = driver ? driver.name : "";
    lines.push([
      v.shiftId || "",
      name,
      v.date || "",
      v.rule || "",
      v.comment || ""
    ].join(sep));
  });

  const filename = `Schichtplan-${periodType}-${periodValue}.csv`;
  downloadCsv(filename, lines);
}

// Hilfsfunktion: berechnet Wochenstart (Montag) und -ende (Sonntag) für ein gegebenes Datum.
function getWeekRangeFromDate(date) {
  const day = date.getDay() || 7; // Sonntag = 7
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday, to: sunday };
}

// Exportiert alle Schichten im angegebenen Zeitraum als CSV.
function exportShiftsForRangeCsv(from, to, { driverId = "all", label = "range" } = {}) {
  const shifts = BusplanModel.getShiftsForRange(from, to, {
    driverId,
    includeApproved: true,
    onlyWithViolations: false,
    onlyWork: false
  });

  const sep = ";";
  const lines = [];
  lines.push(["Datum", "Fahrer", "Schichttyp", "Start", "Ende", "Linie", "Notiz"].join(sep));

  shifts.forEach(s => {
    const driver = BusplanModel.getDriverById(s.driverId);
    const type = BusplanModel.getShiftTypeById(s.typeId);
    lines.push([
      s.date || "",
      driver ? driver.name : "",
      type ? type.name : "",
      s.plannedStart || "",
      s.plannedEnd || "",
      s.lineCode || "",
      s.note || ""
    ].join(sep));
  });

  const filename = `Schichtplan${label}.csv`;
  downloadCsv(filename, lines);
}

// Export: Wochenreport (basierend auf report-week-date).
// Export: Wochenreport (nutzt den aktuellen Berichtstyp/Datum, bevorzugt Woche/Tag).
function exportWeeklyReportCsv() {
  const driverId = document.getElementById("report-driver").value;
  const period = getCurrentReportingPeriod();
  let dateStr = "";

  if (period.periodType === "week" || period.periodType === "day") {
    const dateInput = document.getElementById("report-period-date");
    dateStr = dateInput ? dateInput.value : "";
  }

  if (!dateStr) {
    const today = new Date();
    dateStr = BusplanView.formatDateISO(today);
  }

  let refDate;
  if (dateStr) {
    refDate = parseDate(dateStr);
  } else {
    refDate = new Date();
  }
  const { from, to } = getWeekRangeFromDate(refDate);
  exportShiftsForRangeCsv(from, to, {
    driverId: driverId === "all" ? null : driverId,
    label: `week-${BusplanView.formatDateISO(from)}-bis-${BusplanView.formatDateISO(to)}`
  });
}

// Export: Tagesreport (basierend auf report-day-date).
// Export: Tagesreport (nutzt den aktuellen Berichtstyp/Datum, bevorzugt Tag/Woche).
function exportDailyReportCsv() {
  const driverId = document.getElementById("report-driver").value;
  const period = getCurrentReportingPeriod();
  let dateStr = "";

  if (period.periodType === "day" || period.periodType === "week") {
    const dateInput = document.getElementById("report-period-date");
    dateStr = dateInput ? dateInput.value : "";
  }

  if (!dateStr) {
    const today = new Date();
    dateStr = BusplanView.formatDateISO(today);
  }

  let from;
  if (dateStr) {
    from = parseDate(dateStr);
  } else {
    from = new Date();
  }
  const to = new Date(from);
  exportShiftsForRangeCsv(from, to, {
    driverId: driverId === "all" ? null : driverId,
    label: `day-${BusplanView.formatDateISO(from)}`
  });
}
