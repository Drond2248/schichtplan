// controller.core.js
// Gemeinsamer State und Basisfunktionen für den Controller.

const state = {
  currentView: "week",
  weekRefDate: new Date(),
  monthRefDate: new Date(),
  zoom: 1.0,
  monthDriverId: "all"
};

let modalOkHandler = null;

function resetModalOkLabel() {
  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "OK";
  }
}


function initModalHandlers() {
  const closeButton = document.getElementById("modal-close");
  const okButton = document.getElementById("modal-ok");
  const backdrop = document.getElementById("modal-backdrop");

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      modalOkHandler = null;
      BusplanView.hideModal();
      resetModalOkLabel();
    });
  }

  if (okButton) {
    okButton.addEventListener("click", () => {
      if (typeof modalOkHandler === "function") {
        const shouldClose = modalOkHandler();
        if (shouldClose === false) {
          // Validierung fehlgeschlagen – Modal offen lassen
          return;
        }
      }
      modalOkHandler = null;
      BusplanView.hideModal();
      resetModalOkLabel();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", evt => {
      if (evt.target.id === "modal-backdrop") {
        modalOkHandler = null;
        BusplanView.hideModal();
        resetModalOkLabel();
      }
    });
  }
}



function applyZoom() {
  // Zoom-Funktion deaktiviert – nur noch WeekView aktualisieren
  refreshWeekView();
}


function refreshAll() {
  const modelState = BusplanModel.getState();
  BusplanView.renderDriverList(modelState.drivers);
  BusplanView.renderMasterDriverList(modelState.drivers);
  const driverSelects = [document.getElementById("report-driver"), document.getElementById("approval-driver")];
  driverSelects.forEach(sel => {
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    modelState.drivers.forEach(d => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
    if (current) {
      sel.value = current;
    }
  });

  const shiftTypeSelect = document.getElementById("report-shift-type");
  if (shiftTypeSelect) {
    const current = shiftTypeSelect.value;
    while (shiftTypeSelect.options.length > 1) shiftTypeSelect.remove(1);
    modelState.shiftTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      shiftTypeSelect.appendChild(opt);
    });
    if (current) {
      shiftTypeSelect.value = current;
    }
  }

  BusplanView.renderTemplatePanel(modelState.templates, modelState.shiftTypes);
  BusplanView.renderMasterTemplatePanel(modelState.templates, modelState.shiftTypes);

  refreshWeekView();
  refreshMonthView();
  refreshReportingView();
  refreshApprovalView();
}


function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}


function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}