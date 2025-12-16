// view.js
// Enthält Rendering-Logik für alle Views (ohne Geschäftslogik).

window.BusplanView = (function () {
  function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function createDriverAvatarAndInfo(driver, metaText) {
    const avatar = document.createElement("div");
    avatar.className = "driver-avatar";
    if (driver.color) {
      avatar.style.backgroundColor = driver.color;
    }
    avatar.textContent = getInitials(driver.name);

    const info = document.createElement("div");
    info.className = "driver-info";

    const name = document.createElement("div");
    name.className = "driver-name";
    name.textContent = driver.name;

    const meta = document.createElement("div");
    meta.className = "driver-meta";
    meta.textContent = metaText || "";

    info.appendChild(name);
    info.appendChild(meta);

    return { avatar, info };
  }


  
  function showError(message) {
    const text = message || "Es ist ein unbekannter Fehler aufgetreten.";
    // Nutzt das generische Modal für eine konsistente Fehlerdarstellung
    showModal("Fehler", `<p class="modal-message modal-error">${text}</p>`);
  }

  function showInfo(message) {
    const text = message || "Aktion erfolgreich ausgeführt.";
    showModal("Hinweis", `<p class="modal-message modal-info">${text}</p>`);
  }

  function formatDateLabel(date) {
    const options = { weekday: "short", day: "2-digit", month: "2-digit" };
    return date.toLocaleDateString("de-DE", options);
  }

  // Zentrale UI-Datumsformatierung (wird von Controllern via BusplanView.formatDateISO verwendet)
  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getWeekDates(referenceDate) {
    const day = referenceDate.getDay() || 7; // Montag=1, Sonntag=7
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() - (day - 1));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function updateZoom(zoom) {
    const label = document.getElementById("zoom-label");
    if (label) {
      label.textContent = Math.round(zoom * 100) + "%";
    }
    const gridBody = document.getElementById("week-grid-body");
    if (gridBody) {
      gridBody.style.fontSize = (0.8 * zoom) + "rem";
    }
  }

  function markClickable(element) {
    if (!element) return;
    element.style.cursor = "pointer";
  }

  function updateReportPeriodUi(type) {
    const dateInput = document.getElementById("report-period-date");
    const monthInput = document.getElementById("report-period-month");
    const yearInput = document.getElementById("report-period-year");
    const helpElement = document.getElementById("report-help");

    if (dateInput) {
      dateInput.style.display = (type === "day" || type === "week") ? "" : "none";
    }
    if (monthInput) {
      monthInput.style.display = type === "month" ? "" : "none";
    }
    if (yearInput) {
      yearInput.style.display = type === "year" ? "" : "none";
    }

    const helpMap = {
      day: "Wähle den Tag für den Bericht.",
      week: "Wähle ein Datum innerhalb der gewünschten Woche.",
      month: "Wähle den Monat für den Bericht.",
      year: "Wähle das Jahr für den Bericht."
    };

    const helpText = helpMap[type] || "";
    if (helpElement) {
      helpElement.textContent = helpText;
    }

    const today = new Date();
    if ((type === "day" || type === "week") && dateInput && !dateInput.value) {
      dateInput.value = BusplanView.formatDateISO(today);
    }
    if (type === "month" && monthInput && !monthInput.value) {
      monthInput.value = today.toISOString().slice(0, 7);
    }
    if (type === "year" && yearInput && !yearInput.value) {
      yearInput.value = String(today.getFullYear());
    }
  }

  function toggleTemplatePanel() {
    const panel = document.getElementById("template-panel");
    if (!panel) return;
    const isHidden = window.getComputedStyle(panel).display === "none";
    panel.style.display = isHidden ? "block" : "none";
  }

  function renderDriverList(drivers) {
    renderDriverListInto("driver-list", drivers);
  }

  function renderMasterDriverList(drivers) {
    renderDriverListInto("master-driver-list", drivers);
  }

  function renderDriverListInto(containerId, drivers) {
    const container = document.getElementById(containerId);
    if (!container) return;
    clearElement(container);

    drivers.forEach(d => {
      const row = document.createElement("div");
      row.className = "driver-row";
      row.dataset.driverId = d.id;

      let metaText = "";
      if (containerId === "driver-list") {
        // Planung: nur die Rolle anzeigen, Stammdaten bleiben im Hintergrund.
        metaText = d.role || "";
      } else {
        // Stammdaten-Ansicht: kompakte Zusammenfassung der wichtigsten Daten.
        const metaParts = [];
        if (d.employeeId) {
          metaParts.push("PNR: " + d.employeeId);
        }
        if (d.role) {
          metaParts.push(d.role);
        }
        if (d.licenseClass) {
          metaParts.push("FS: " + d.licenseClass);
        }
        if (d.phone) {
          metaParts.push(d.phone);
        }
        metaText = metaParts.join(" · ") || "Keine weiteren Stammdaten hinterlegt";
      }

      const { avatar, info } = createDriverAvatarAndInfo(d, metaText);

      row.appendChild(avatar);
      row.appendChild(info);

      container.appendChild(row);
    });
  }





function getInitials(name) {
    return name
      .split(" ")
      .filter(p => p.length > 0)
      .map(p => p[0].toUpperCase())
      .slice(0, 2)
      .join("");
  }

  function renderWeekHeader(weekDates, staffingSummary) {
    const header = document.getElementById("week-grid-header");
    clearElement(header);
    const today = new Date();

    const summaryByDate = new Map();
    if (Array.isArray(staffingSummary)) {
      staffingSummary.forEach(day => {
        if (day && day.date) {
          summaryByDate.set(day.date, day);
        }
      });
    }

    // Erste Spalte im Header: Fahrer-Label für die Namensspalte.
    const driverHeaderCell = document.createElement("div");
    driverHeaderCell.className = "grid-header-cell grid-header-driver";
    const driverLabel = document.createElement("div");
    driverLabel.className = "grid-header-driver-label";
    driverLabel.textContent = "Fahrer";
    driverHeaderCell.appendChild(driverLabel);
    header.appendChild(driverHeaderCell);

    weekDates.forEach(d => {
      const cell = document.createElement("div");
      cell.className = "grid-header-cell";
      const dateISO = formatDateISO(d);
      cell.dataset.date = dateISO;

      const day = document.createElement("div");
      day.className = "grid-header-day";
      day.textContent = d.toLocaleDateString("de-DE", { weekday: "short" });

      const date = document.createElement("div");
      date.className = "grid-header-date";
      date.textContent = d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

      if (d.toDateString() === today.toDateString()) {
        day.style.color = "var(--color-primary)";
      }

      cell.appendChild(day);
      cell.appendChild(date);

      const summary = summaryByDate.get(dateISO);
      if (summary) {
        const staffing = document.createElement("div");
        staffing.className = "grid-header-staffing";

        function createBadge(label, info) {
          const span = document.createElement("span");
          span.classList.add("status-badge");
          span.classList.add("status-badge--tiny");
          span.textContent = `${label} ${info.planned}/${info.required}`;
          if (info.status === "green") {
            span.classList.add("status-badge--ok");
          } else if (info.status === "yellow") {
            span.classList.add("status-badge--warn");
          } else if (info.status === "red") {
            span.classList.add("status-badge--critical");
          }
          return span;
        }

        if (summary.early) {
          staffing.appendChild(createBadge("F", summary.early));
        }
        if (summary.late) {
          if (staffing.childNodes.length > 0) {
            const spacer = document.createElement("span");
            spacer.textContent = " ";
            staffing.appendChild(spacer);
          }
          staffing.appendChild(createBadge("S", summary.late));
        }

        cell.appendChild(staffing);
      }

      header.appendChild(cell);
    });
  }


  // Rendert alle Schichten als Karten in eine gegebene Zelle.
  

  // Liefert eine CSS-Klasse für eine Linienkennung (R1/R2/G1/G2),
  // um einen einheitlichen Farbakzent pro Linie zu setzen.
  function getLineClass(lineCode) {
    if (!lineCode) return "";
    switch (lineCode.toUpperCase()) {
      case "R1":
        return "shift-line-r1";
      case "R2":
        return "shift-line-r2";
      case "G1":
        return "shift-line-g1";
      case "G2":
        return "shift-line-g2";
      default:
        return "";
    }
  }



function renderShiftBlocksIntoCell(cell, shifts) {
    shifts.forEach(shift => {
      const type = BusplanModel.getShiftTypeById(shift.typeId);
      const block = document.createElement("div");
      block.className = "shift-block";
      if (type && type.colorClass) {
        block.classList.add(type.colorClass);
      }

      const lineClass = getLineClass(shift.lineCode);
      if (lineClass) {
        block.classList.add(lineClass);
      }

      block.dataset.shiftId = shift.id;

      const isAbsence = type && type.countsAsWork === false;

      if (isAbsence) {
        // Kompakte Darstellung für Abwesenheiten (Urlaub, Frei, Krank, Feiertag, …)
        block.classList.add("shift-block--absence");

        const typeLabel = document.createElement("span");
        typeLabel.className = "shift-type-label";
        typeLabel.textContent = type ? type.name : "";

        block.appendChild(typeLabel);
      } else {
        // Bisherige detailierte Darstellung für Arbeitszeiten (Früh/Spät/Nacht, Linien etc.)
        const typeLabel = document.createElement("span");
        typeLabel.className = "shift-type-label";
        typeLabel.textContent = type ? type.name : "";

        const time = document.createElement("span");
        time.className = "shift-time";
        if (shift.plannedStart && shift.plannedEnd) {
          time.textContent = `${shift.plannedStart} – ${shift.plannedEnd}`;
        } else {
          time.textContent = type ? type.name : "";
        }

        const meta = document.createElement("span");
        meta.className = "shift-meta";
        const parts = [];
        if (shift.lineCode) parts.push(`Linie: ${shift.lineCode}`);
        if (shift.note) parts.push(shift.note);
        meta.textContent = parts.join(" · ");

        block.appendChild(typeLabel);
        block.appendChild(time);
        block.appendChild(meta);
      }

      if (shift.errorList && shift.errorList.length > 0) {
        block.title = shift.errorList.join("\n");
      }

      block.addEventListener("click", () => {
        // Jumper-Schichten bekommen eine eigene Aktion (Zuweisung),
        // alle anderen öffnen wie gewohnt die Detailansicht.
        if (type && (type.id === "jumper_early" || type.id === "jumper_late") && window.BusplanPlanningController && BusplanPlanningController.handleJumperClick) {
          BusplanPlanningController.handleJumperClick(shift.id);
        } else {
          showShiftDetails(shift.id);
        }
      });

      cell.appendChild(block);
    });
  }


    // Rendert die Wochenansicht so, dass Fahrer und Schichtzellen
  // im selben Grid (gleiche Zeile) liegen.
  
  function createDriverHeaderCell(driver) {
    const driverCell = document.createElement("div");
    driverCell.className = "grid-cell week-grid-driver-cell";
    driverCell.dataset.driverId = driver.id;

    const driverRow = document.createElement("div");
    driverRow.className = "driver-row driver-row--inline";

    const metaText = driver.role || "";
    const { avatar, info } = createDriverAvatarAndInfo(driver, metaText);

    driverRow.appendChild(avatar);
    driverRow.appendChild(info);

    driverCell.appendChild(driverRow);
    return driverCell;
  }

  function createWeekGridCell(driverId, dateStr, holidaysMap, shiftsLookup) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.dataset.driverId = driverId;
    cell.dataset.date = dateStr;
    cell.dataset.dropTarget = "true";

    if (holidaysMap[dateStr]) {
      cell.style.background = "#eff6ff";
    }

    const shifts = shiftsLookup(driverId, dateStr);
    renderShiftBlocksIntoCell(cell, shifts);
    return cell;
  }

function renderWeekBody(drivers, weekDates, shiftsLookup, holidaysMap) {
    const body = document.getElementById("week-grid-body");
    clearElement(body);

    drivers.forEach(d => {
      const row = document.createElement("div");
      row.className = "grid-row";
      row.dataset.driverId = d.id;

      const driverCell = createDriverHeaderCell(d);
      row.appendChild(driverCell);

      weekDates.forEach(date => {
        const dateStr = formatDateISO(date);
        const cell = createWeekGridCell(d.id, dateStr, holidaysMap, shiftsLookup);
        row.appendChild(cell);
      });

      body.appendChild(row);
    });
  }

function renderTemplatePanel(templates, shiftTypes) {
    renderTemplatePanelInto("template-panel", templates, shiftTypes);
  }

  function renderMasterTemplatePanel(templates, shiftTypes) {
    renderTemplatePanelInto("master-template-panel", templates, shiftTypes);
  }

  function renderTemplatePanelInto(containerId, templates, shiftTypes) {
    const container = document.getElementById(containerId);
    if (!container) return;
    clearElement(container);

    const workContainerTitle = document.createElement("div");
    workContainerTitle.className = "template-category-title";
    workContainerTitle.textContent = "Arbeitszeiten";
    container.appendChild(workContainerTitle);

    // Arbeitszeiten nach Schichttyp gruppieren (Früh / Spät / Nacht)
    const workTemplatesByType = new Map();
    templates.forEach(t => {
      const type = shiftTypes.find(st => st.id === t.typeId);
      if (!type || !type.countsAsWork) return;
      if (!workTemplatesByType.has(type.id)) {
        workTemplatesByType.set(type.id, []);
      }
      workTemplatesByType.get(type.id).push(t);
    });

    const typeOrder = ["early", "late", "night"];
    typeOrder.forEach(typeId => {
      const templList = workTemplatesByType.get(typeId);
      if (!templList || templList.length === 0) return;
      const type = shiftTypes.find(st => st.id === typeId);
      const subTitle = document.createElement("div");
      subTitle.className = "template-subcategory-title";
      subTitle.textContent = type ? type.name : typeId;
      container.appendChild(subTitle);

      templList.forEach(t => {
        container.appendChild(createTemplateElement(t, shiftTypes));
      });
    });

    // Alle weiteren Arbeitszeit-Typen, die nicht explizit in typeOrder stehen
    workTemplatesByType.forEach((templList, typeId) => {
      if (typeOrder.includes(typeId)) return;
      const type = shiftTypes.find(st => st.id === typeId);
      const subTitle = document.createElement("div");
      subTitle.className = "template-subcategory-title";
      subTitle.textContent = type ? type.name : typeId;
      container.appendChild(subTitle);

      templList.forEach(t => {
        container.appendChild(createTemplateElement(t, shiftTypes));
      });
    });

    // Abwesenheiten
    const absTitle = document.createElement("div");
    absTitle.className = "template-category-title";
    absTitle.textContent = "Abwesenheiten / Nicht-Arbeitszeit";
    container.appendChild(absTitle);

    templates
      .filter(t => {
        const type = shiftTypes.find(st => st.id === t.typeId);
        return type && !type.countsAsWork;
      })
      .forEach(t => {
        container.appendChild(createTemplateElement(t, shiftTypes));
      });
  }

  function createTemplateElement(template, shiftTypes) {
    const type = shiftTypes.find(st => st.id === template.typeId);
    const el = document.createElement("div");
    let extraClass = "";
    if (template.lineCode && type) {
      const key = (type.id + "-" + template.lineCode).toLowerCase();
      extraClass = " template-" + key;
    }
    el.className = "template-item " + (type ? type.colorClass : "") + extraClass;
    el.draggable = true;
    el.dataset.templateId = template.id;

    const left = document.createElement("div");
    const name = document.createElement("span");
    name.className = "template-item-name";
    name.textContent = template.name;
    const meta = document.createElement("span");
    meta.className = "template-item-meta";
    const parts = [];
    if (template.start && template.end) parts.push(`${template.start}–${template.end}`);
    if (type) parts.push(type.name);
    meta.textContent = parts.join(" · ");
    left.appendChild(name);
    left.appendChild(meta);

    el.appendChild(left);
    return el;
  }

  function renderMonthView(referenceDate, shiftsLookup, holidays) {
    const container = document.getElementById("month-calendar");
    clearElement(container);

    const wrap = document.createElement("div");

    const headerRow = document.createElement("div");
    headerRow.className = "month-grid";
    const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    weekdays.forEach(w => {
      const h = document.createElement("div");
      h.className = "month-day-header";
      h.textContent = w;
      headerRow.appendChild(h);
    });
    wrap.appendChild(headerRow);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startDay = ((firstOfMonth.getDay() + 6) % 7); // Montag=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const holidayMap = {};
    holidays.forEach(h => holidayMap[h.date] = h.name);

    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement("div");
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "month-day-cell";
      const d = new Date(year, month, day);
      const dateStr = formatDateISO(d);

      if (d.toDateString() === today.toDateString()) {
        cell.classList.add("today");
      }

      const num = document.createElement("div");
      num.className = "month-day-number";
      num.textContent = day;
      cell.appendChild(num);

      if (holidayMap[dateStr]) {
        const hline = document.createElement("div");
        hline.className = "month-day-summary";
        hline.textContent = holidayMap[dateStr];
        cell.appendChild(hline);
      }

      const shifts = shiftsLookup(dateStr);
      if (shifts && shifts.length > 0) {
        const list = document.createElement("div");
        list.className = "month-day-shifts";
        renderShiftBlocksIntoCell(list, shifts);
        cell.appendChild(list);
      }

      grid.appendChild(cell);
    }

    wrap.appendChild(grid);
    container.appendChild(wrap);
  }

  function renderKpiCards(kpis) {
    const container = document.getElementById("kpi-cards");
    clearElement(container);

    const defs = [
      {
        key: "totalWorkHours",
        label: "Arbeitsstunden gesamt",
        meta: "Alle Fahrer, nur Arbeitszeit"
      },
      {
        key: "avgHoursPerDriver",
        label: "Ø Stunden pro Fahrer",
        meta: "Durchschnitt über alle Fahrer"
      },
      {
        key: "totalOvertime",
        label: "Überstunden gesamt",
        meta: "Überschlag"
      },
      {
        key: "ruleViolations",
        label: "Regelverstöße",
        meta: "Schichten mit Verstößen"
      },
      {
        key: "vacationDays",
        label: "Urlaubstage",
        meta: "Gesamt im Zeitraum"
      },
      {
        key: "sickDays",
        label: "Kranktage",
        meta: "Gesamt im Zeitraum"
      },
      {
        key: "offDays",
        label: "Frei-Tage",
        meta: "Gesamt im Zeitraum"
      },
      {
        key: "holidayDays",
        label: "Feiertage",
        meta: "Feiertags-Einträge"
      }
    ];

    defs.forEach(def => {
      const card = document.createElement("div");
      card.className = "kpi-card";

      const label = document.createElement("div");
      label.className = "kpi-label";
      label.textContent = def.label;

      const value = document.createElement("div");
      value.className = "kpi-value";
      value.textContent = (kpis[def.key] ?? 0).toLocaleString("de-DE", {
        maximumFractionDigits: 1
      });

      const meta = document.createElement("div");
      meta.className = "kpi-meta";
      meta.textContent = def.meta;

      card.appendChild(label);
      card.appendChild(value);
      card.appendChild(meta);
      container.appendChild(card);
    });
  }
  function renderDriverKpiDetail(detail) {
    const section = document.getElementById("driver-kpi-detail");
    const container = document.getElementById("driver-kpi-content");
    if (!section || !container) return;

    if (!detail || !detail.driver) {
      section.style.display = "none";
      clearElement(container);
      return;
    }

    section.style.display = "";
    clearElement(container);

    const defs = [
      { key: "driverName", label: "Fahrer" },
      { key: "totalShifts", label: "Schichten gesamt" },
      { key: "earlyCount", label: "Frühschichten" },
      { key: "lateCount", label: "Spätschichten" },
      { key: "nightCount", label: "Nachtschichten" },
      { key: "vacationDays", label: "Urlaubstage" },
      { key: "sickDays", label: "Kranktage" },
      { key: "offDays", label: "Frei-Tage" },
      { key: "avgShiftHours", label: "Ø Schichtdauer (h)" },
      { key: "earliestStart", label: "Frühester Start" },
      { key: "latestEnd", label: "Spätestes Ende" }
    ];

    const values = {
      driverName: detail.driver.name,
      totalShifts: detail.totalShifts,
      earlyCount: detail.earlyCount,
      lateCount: detail.lateCount,
      nightCount: detail.nightCount,
      vacationDays: detail.vacationDays,
      sickDays: detail.sickDays,
      offDays: detail.offDays,
      avgShiftHours: detail.avgShiftHours ? detail.avgShiftHours.toFixed(1) : "0.0",
      earliestStart: detail.earliestStart || "–",
      latestEnd: detail.latestEnd || "–"
    };

    defs.forEach(def => {
      const card = document.createElement("div");
      card.className = "kpi-card";
      const label = document.createElement("div");
      label.className = "kpi-label";
      label.textContent = def.label;
      const value = document.createElement("div");
      value.className = "kpi-value";
      value.textContent = values[def.key];
      card.appendChild(label);
      card.appendChild(value);
      container.appendChild(card);
    });
  }



  function renderWorktimeTable(rows) {
    const tbody = document.querySelector("#table-worktime tbody");
    clearElement(tbody);
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.driver.name}</td>
        <td>${r.totalHours.toFixed(1)}</td>
        <td>${r.overtimeHours.toFixed(1)}</td>
        <td>${r.nightHours.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderAbsenceTable(rows) {
    const tbody = document.querySelector("#table-absence tbody");
    clearElement(tbody);
    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.driver.name}</td>
        <td>${r.vacation}</td>
        <td>${r.sick}</td>
        <td>${r.off}</td>
        <td>${r.holiday}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderViolationsTable(rows) {
    const tbody = document.querySelector("#table-violations tbody");
    clearElement(tbody);
    rows.forEach(s => {
      const tr = document.createElement("tr");
      const date = s.date;
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${BusplanModel.getDriverById(s.driverId)?.name ?? ""}</td>
        <td>${date}</td>
        <td>${(s.errorList || []).join(", ")}</td>
        <td>${s.supervisorComment ?? ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

function renderStaffingSummary(containerId, summaryList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    clearElement(container);

    if (!summaryList || summaryList.length === 0) {
      container.textContent = "Keine Daten im gewählten Zeitraum.";
      return;
    }

    const table = document.createElement("table");
    table.className = "data-table compact-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Datum</th>
        <th>Früh</th>
        <th>Spät</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    summaryList.forEach(day => {
      const tr = document.createElement("tr");

      function createCell(info) {
        const td = document.createElement("td");
        if (!info) {
          td.textContent = "-";
          return td;
        }
        const badge = document.createElement("span");
        badge.classList.add("status-badge");
        badge.textContent = `${info.planned}/${info.required}`;
        if (info.status === "green") {
          badge.classList.add("status-badge--ok");
        } else if (info.status === "yellow") {
          badge.classList.add("status-badge--warn");
        } else if (info.status === "red") {
          badge.classList.add("status-badge--critical");
        }
        td.appendChild(badge);
        return td;
      }

      const dateTd = document.createElement("td");
      dateTd.textContent = day.date;

      tr.appendChild(dateTd);
      tr.appendChild(createCell(day.early));
      tr.appendChild(createCell(day.late));
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderRiskSummary(containerId, riskList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    clearElement(container);

    if (!riskList || riskList.length === 0) {
      container.textContent = "Keine Hinweise.";
      return;
    }

    const list = document.createElement("div");
    list.className = "risk-list";

    riskList.forEach(r => {
      const card = document.createElement("div");
      card.className = "risk-card";

      const header = document.createElement("div");
      header.className = "risk-card-header";

      const title = document.createElement("span");
      title.textContent = r.date;

      const level = document.createElement("span");
      level.classList.add("risk-level-badge");
      level.textContent = r.level;
      if (r.level === "high") {
        level.classList.add("risk-level-badge--high");
      } else if (r.level === "medium") {
        level.classList.add("risk-level-badge--medium");
      } else {
        level.classList.add("risk-level-badge--low");
      }

      header.appendChild(title);
      header.appendChild(level);
      card.appendChild(header);

      const body = document.createElement("ul");
      (r.messages || []).forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        body.appendChild(li);
      });

      if (!r.messages || r.messages.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Kein besonderes Risiko erkannt.";
        body.appendChild(li);
      }

      card.appendChild(body);
      list.appendChild(card);
    });

    container.appendChild(list);
  }



  function renderApprovalTable(shifts) {
    const tbody = document.querySelector("#table-approval tbody");
    clearElement(tbody);

    shifts.forEach(s => {
      const tr = document.createElement("tr");
      if (s.errorList && s.errorList.length > 0) {
        tr.classList.add("violation-row");
      }

  



      const driver = BusplanModel.getDriverById(s.driverId);
      const type = BusplanModel.getShiftTypeById(s.typeId);
      const errorText = (s.errorList || []).join(", ");

      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${driver ? driver.name : ""}</td>
        <td>${s.lineCode ?? ""}</td>
        <td>Werk</td>
        <td>${s.date} ${s.plannedStart ?? ""}–${s.plannedEnd ?? ""}</td>
        <td><input type="time" value="${s.actualStart ?? ""}" data-field="actualStart" data-shift-id="${s.id}"></td>
        <td><input type="time" value="${s.actualEnd ?? ""}" data-field="actualEnd" data-shift-id="${s.id}"></td>
        <td><textarea rows="1" data-field="supervisorComment" data-shift-id="${s.id}">${s.supervisorComment ?? ""}</textarea></td>
        <td><span class="violation-text">${errorText}</span></td>
        <td><input type="checkbox" data-field="approved" data-shift-id="${s.id}" ${s.approved ? "checked" : ""}></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function showModal(title, html) {
    const backdrop = document.getElementById("modal-backdrop");
    const titleEl = document.getElementById("modal-title");
    const bodyEl = document.getElementById("modal-body");
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    backdrop.classList.remove("hidden");
  }

  function hideModal() {
    document.getElementById("modal-backdrop").classList.add("hidden");
  }

  function switchView(viewId) {
    document.querySelectorAll(".view").forEach(v => {
      v.classList.toggle("active", v.id === `view-${viewId}`);
    });
    document.querySelectorAll(".nav-tab").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewId);
    });
  }

  
  function renderMonthlyShiftList(containerId, rows, meta) {
    const container = document.getElementById(containerId);
    if (!container) return;
    clearElement(container);

    if (!rows || rows.length === 0) {
      const p = document.createElement("p");
      p.className = "text-muted";
      p.textContent = "Keine Schichten im ausgewählten Monat.";
      container.appendChild(p);
      return;
    }

    const table = document.createElement("table");
    table.className = "data-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Datum</th>
        <th>Tag</th>
        <th>Fahrer</th>
        <th>Schicht</th>
        <th>Linie</th>
        <th>Info</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(row => {
      const dateStr = row.date || "";
      const dateObj = dateStr ? new Date(dateStr + "T00:00:00") : null;
      const dateLabel = dateObj
        ? dateObj.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
        : dateStr;
      const weekday = dateObj
        ? dateObj.toLocaleDateString("de-DE", { weekday: "short" })
        : "";

      const driverName = row.driver && row.driver.name ? row.driver.name : "";
      const shiftName = row.shiftType && row.shiftType.name
        ? row.shiftType.name
        : (row.shiftType && row.shiftType.id) || "";
      const line = row.lineCode || "";
      const note = row.note || "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dateLabel}</td>
        <td>${weekday}</td>
        <td>${driverName}</td>
        <td>${shiftName}</td>
        <td>${line}</td>
        <td>${note}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }
return {
  showInfo,
  showError,
    formatDateISO,
    updateReportPeriodUi,
    markClickable,
    updateZoom,
    toggleTemplatePanel,
    renderDriverList,
    renderMasterDriverList,
    renderWeekHeader,
    renderWeekBody,
    renderTemplatePanel,
    renderMasterTemplatePanel,
    getWeekDates,
    renderMonthView,
    renderMonthlyShiftList,
    renderKpiCards,
    renderWorktimeTable,
    renderAbsenceTable,
    renderViolationsTable,
    renderRiskSummary,
    renderStaffingSummary,
    renderApprovalTable,
    showModal,
    hideModal,
    switchView
  };
})();