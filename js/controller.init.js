// controller.init.js
// Einstiegspunkt: Navigation, Initialisierung & DOMContentLoaded-Handler.

function initNav() {
  document.querySelectorAll(".nav-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentView = btn.dataset.view;
      BusplanView.switchView(state.currentView);
      refreshAll();
    });
  });
}


function init() {
  BusplanModel.load();
  initNav();
  initWeekView();
  initMonthView();
  initReportingView();
  initApprovalView();
  initDriverManagement();
  initTemplateManagement();
  initBackupHandlers();
  initModalHandlers();
  refreshAll();
}


document.addEventListener("DOMContentLoaded", init);