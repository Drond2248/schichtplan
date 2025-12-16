
window.BusplanDb = (function () {
  const STORAGE_KEY = "shift_planner_state_v1";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error("Fehler beim Laden des Zustands aus localStorage", e);
      return null;
    }
  }

  function saveState(state) {
    try {
      const snapshot = {
        drivers: state.drivers,
        shiftTypes: state.shiftTypes,
        templates: state.templates,
        shifts: state.shifts,
        ruleConfig: state.ruleConfig
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.error("Fehler beim Speichern des Zustands nach localStorage", e);
    }
  }

  return {
    loadState,
    saveState
  };
})();
