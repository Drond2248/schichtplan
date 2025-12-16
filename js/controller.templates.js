// controller.templates.js
// Verwaltet Schicht-Templates und zugehörige Modale.

function initTemplateManagement() {
  const addButton = document.getElementById("master-template-add-button");
  if (addButton) {
    addButton.addEventListener("click", () => {
      openCreateTemplateModal();
    });
  }

  const templatePanel = document.getElementById("master-template-panel");
  if (templatePanel) {
    templatePanel.addEventListener("click", evt => {
      const item = evt.target.closest(".template-item");
      if (!item) return;
      const templateId = item.dataset.templateId;
      if (!templateId) return;
      openEditTemplateModal(templateId);
    });
  }
}


function openCreateTemplateModal() {
  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "Speichern";
  }

  const html = `
    <div class="filter-grid">
      <div class="form-field">
        <label for="template-name-input">Name</label>
        <input id="template-name-input" type="text" placeholder="z.B. Früh R2">
      </div>
      <div class="form-field">
        <label for="template-type-input">Schicht-Typ</label>
        <select id="template-type-input"></select>
      </div>
      <div class="form-field">
        <label for="template-start-input">Startzeit</label>
        <input id="template-start-input" type="time">
      </div>
      <div class="form-field">
        <label for="template-end-input">Endzeit</label>
        <input id="template-end-input" type="time">
      </div>
      <div class="form-field">
        <label for="template-line-input">Linie</label>
        <input id="template-line-input" type="text" placeholder="z.B. R1">
      </div>
      <div class="form-field">
        <label for="template-note-input">Standard-Notiz</label>
        <input id="template-note-input" type="text" placeholder="optional">
      </div>
    </div>
    <p class="form-hint">
      Zeiten leer lassen für ganztägige Abwesenheiten (z.B. Urlaub, Krank).
    </p>
  `;

  BusplanView.showModal("Template anlegen", html);

  const modelState = BusplanModel.getState();
  const typeSelect = document.getElementById("template-type-input");
  if (typeSelect && modelState && Array.isArray(modelState.shiftTypes)) {
    modelState.shiftTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      typeSelect.appendChild(opt);
    });
  }

  modalOkHandler = () => {
    const nameInput = document.getElementById("template-name-input");
    const typeSelect = document.getElementById("template-type-input");
    const startInput = document.getElementById("template-start-input");
    const endInput = document.getElementById("template-end-input");
    const lineInput = document.getElementById("template-line-input");
    const noteInput = document.getElementById("template-note-input");

    const name = nameInput ? nameInput.value.trim() : "";
    const typeId = typeSelect ? typeSelect.value : "";
    const start = startInput ? startInput.value : "";
    const end = endInput ? endInput.value : "";
    const lineCode = lineInput ? lineInput.value : "";
    const defaultNote = noteInput ? noteInput.value : "";

    if (!name) {
      BusplanView.showError("Bitte einen Namen eingeben.");
      if (nameInput) {
        nameInput.focus();
      }
      return false;
    }

    if (!typeId) {
      BusplanView.showError("Bitte einen Schicht-Typ auswählen.");
      if (typeSelect) {
        typeSelect.focus();
      }
      return false;
    }

    try {
      BusplanModel.addTemplate({
        name,
        typeId,
        start,
        end,
        lineCode,
        defaultNote
      });
      refreshAll();
      return true;
    } catch (err) {
      console.error(err);
      BusplanView.showError(err.message || "Template konnte nicht gespeichert werden.");
      return false;
    }
  };
}


function openEditTemplateModal(templateId) {
  const template = BusplanModel.getTemplateById(templateId);
  if (!template) {
    console.warn("Template nicht gefunden:", templateId);
    return;
  }

  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "Speichern";
  }

  const html = `
    <div class="filter-grid">
      <div class="form-field">
        <label for="template-name-input">Name</label>
        <input id="template-name-input" type="text">
      </div>
      <div class="form-field">
        <label for="template-type-input">Schicht-Typ</label>
        <select id="template-type-input"></select>
      </div>
      <div class="form-field">
        <label for="template-start-input">Startzeit</label>
        <input id="template-start-input" type="time">
      </div>
      <div class="form-field">
        <label for="template-end-input">Endzeit</label>
        <input id="template-end-input" type="time">
      </div>
      <div class="form-field">
        <label for="template-line-input">Linie</label>
        <input id="template-line-input" type="text">
      </div>
      <div class="form-field">
        <label for="template-note-input">Standard-Notiz</label>
        <input id="template-note-input" type="text">
      </div>
    </div>
    <div class="modal-footer-extra">
      <button type="button" id="template-delete-button" class="danger-button">
        Template löschen
      </button>
    </div>
  `;

  BusplanView.showModal("Template bearbeiten", html);

  const modelState = BusplanModel.getState();
  const nameInput = document.getElementById("template-name-input");
  const typeSelect = document.getElementById("template-type-input");
  const startInput = document.getElementById("template-start-input");
  const endInput = document.getElementById("template-end-input");
  const lineInput = document.getElementById("template-line-input");
  const noteInput = document.getElementById("template-note-input");

  if (typeSelect && modelState && Array.isArray(modelState.shiftTypes)) {
    modelState.shiftTypes.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      typeSelect.appendChild(opt);
    });
  }

  if (nameInput) {
    nameInput.value = template.name || "";
  }
  if (typeSelect && template.typeId) {
    typeSelect.value = template.typeId;
  }
  if (startInput) {
    startInput.value = template.start || "";
  }
  if (endInput) {
    endInput.value = template.end || "";
  }
  if (lineInput) {
    lineInput.value = template.lineCode || "";
  }
  if (noteInput) {
    noteInput.value = template.defaultNote || "";
  }

  const deleteButton = document.getElementById("template-delete-button");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      const confirmed = confirm("Template wirklich löschen?");
      if (!confirmed) return;

      BusplanModel.deleteTemplate(templateId);
      refreshAll();
      modalOkHandler = null;
      BusplanView.hideModal();
      resetModalOkLabel();
    });
  }

  modalOkHandler = () => {
    const name = nameInput ? nameInput.value.trim() : "";
    const typeId = typeSelect ? typeSelect.value : "";
    const start = startInput ? startInput.value : "";
    const end = endInput ? endInput.value : "";
    const lineCode = lineInput ? lineInput.value : "";
    const defaultNote = noteInput ? noteInput.value : "";

    if (!name) {
      BusplanView.showError("Bitte einen Namen eingeben.");
      if (nameInput) {
        nameInput.focus();
      }
      return false;
    }

    if (!typeId) {
      BusplanView.showError("Bitte einen Schicht-Typ auswählen.");
      if (typeSelect) {
        typeSelect.focus();
      }
      return false;
    }

    try {
      BusplanModel.updateTemplate(templateId, {
        name,
        typeId,
        start,
        end,
        lineCode,
        defaultNote
      });
      refreshAll();
      return true;
    } catch (err) {
      console.error(err);
      BusplanView.showError(err.message || "Template konnte nicht gespeichert werden.");
      return false;
    }
  };
}