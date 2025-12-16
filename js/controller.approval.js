// controller.approval.js
// Schichtprüfung / Approval-Logik.

function initApprovalView() {
  document.getElementById("approval-load").addEventListener("click", () => {
    refreshApprovalView();
  });

  document.getElementById("approval-save").addEventListener("click", () => {
    saveApprovalChanges();
  });

  const table = document.getElementById("table-approval");
  table.addEventListener("change", evt => {
    const field = evt.target.dataset.field;
    const shiftId = evt.target.dataset.shiftId;
    if (!field || !shiftId) return;
    let value;
    if (evt.target.type === "checkbox") {
      value = evt.target.checked;
    } else {
      value = evt.target.value || null;
    }
    const changes = {};
    changes[field] = value;
    BusplanModel.updateShift(shiftId, changes);
    refreshApprovalView();
  });
}


function refreshApprovalView() {
  if (state.currentView !== "approval") return;

  const fromInput = document.getElementById("approval-from");
  const toInput = document.getElementById("approval-to");
  let from = fromInput.value ? parseDate(fromInput.value) : null;
  let to = toInput.value ? parseDate(toInput.value) : null;

  if (!from || !to) {
    const today = new Date();
    const monday = BusplanView.getWeekDates(today)[0];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    from = monday;
    to = sunday;
    fromInput.value = BusplanView.formatDateISO(from);
    toInput.value = BusplanView.formatDateISO(to);
  }

  const driverId = document.getElementById("approval-driver").value;
  const includeApproved = document.getElementById("approval-include-approved").checked;
  const onlyViolations = document.getElementById("approval-only-violations").checked;
  const onlyWork = document.getElementById("approval-only-work").checked;

  const shifts = BusplanModel.getShiftsForRange(from, to, {
    driverId,
    includeApproved,
    onlyWithViolations: onlyViolations,
    onlyWork
  });

  BusplanView.renderApprovalTable(shifts);

  // Personalbedarf Früh/Spät für den gleichen Zeitraum berechnen
  const fromISO = BusplanView.formatDateISO(from);
  const toISO = BusplanView.formatDateISO(to);
  const staffingSummary = BusplanModel.getStaffingSummaryForRange(fromISO, toISO);
  BusplanView.renderStaffingSummary("approval-staffing-summary", staffingSummary);

  // Risiko-Report pro Tag berechnen (Krankheitsrisiko)
  const riskList = staffingSummary.map(day => BusplanModel.calculateRiskForDay(day.date));
  BusplanView.renderRiskSummary("approval-risk-summary", riskList);
}

