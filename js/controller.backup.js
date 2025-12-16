// controller.backup.js
// Verantwortlich für Backup-Export und -Import (JSON-Datei).

function initBackupHandlers() {
  const exportBtn = document.getElementById("btn-export-backup");
  const importBtn = document.getElementById("btn-import-backup");
  const fileInput = document.getElementById("input-import-backup");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      try {
        const stateObj = BusplanModel.exportStateAsJson();
        const json = JSON.stringify(stateObj, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        const today = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = "Schichtplan-backup-" + today + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Fehler beim Export des Backups", e);
        BusplanView.showError("Backup konnte nicht erstellt werden. Details in der Konsole.");
      }
    });
  }

  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = function (ev) {
        try {
          const text = ev.target.result;
          const parsed = JSON.parse(text);
          BusplanModel.importStateFromObject(parsed);
          refreshAll();
          BusplanView.showInfo("Backup wurde erfolgreich geladen.");
        } catch (e) {
          console.error("Fehler beim Import des Backups", e);
          BusplanView.showError("Backup konnte nicht geladen werden. Bitte prüfen Sie die Datei.");
        } finally {
          fileInput.value = "";
        }
      };
      reader.readAsText(file, "utf-8");
    });
  }
}
