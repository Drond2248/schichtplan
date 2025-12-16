// controller.drivers.js
// Verwaltet Fahrer-Events und Modale.

function initDriverManagement() {
  const addButton = document.getElementById("master-driver-add-button");
  if (addButton) {
    addButton.addEventListener("click", () => {
      openCreateDriverModal();
    });
  }

  const driverList = document.getElementById("master-driver-list");
  if (driverList) {
    driverList.addEventListener("click", evt => {
      const row = evt.target.closest(".driver-row");
      if (!row) return;
      const driverId = row.dataset.driverId;
      if (!driverId) return;
      openEditDriverModal(driverId);
    });
  }
}


function openCreateDriverModal() {
  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "Speichern";
  }

  const html = `
    <div class="filter-grid">
      <div class="form-field">
        <label for="driver-name-input">Name</label>
        <input id="driver-name-input" type="text" placeholder="z.B. Anna Müller">
      </div>
      <div class="form-field">
        <label for="driver-employeeid-input">Personalnummer</label>
        <input id="driver-employeeid-input" type="text" placeholder="z.B. 1001">
      </div>
      <div class="form-field">
        <label for="driver-role-input">Rolle</label>
        <input id="driver-role-input" type="text" placeholder="z.B. Busfahrer, Teamleiter">
      </div>
      <div class="form-field">
        <label for="driver-license-input">Führerscheinklasse</label>
        <input id="driver-license-input" type="text" placeholder="z.B. D, DE, B">
      </div>
      <div class="form-field">
        <label for="driver-birthdate-input">Geburtsdatum</label>
        <input id="driver-birthdate-input" type="date">
      </div>
      <div class="form-field">
        <label for="driver-address-input">Adresse</label>
        <input id="driver-address-input" type="text" placeholder="Straße, PLZ Ort">
      </div>
      <div class="form-field">
        <label for="driver-phone-input">Telefonnummer</label>
        <input id="driver-phone-input" type="tel" placeholder="z.B. 030 123456">
      </div>
      <div class="form-field">
        <label for="driver-email-input">E-Mail</label>
        <input id="driver-email-input" type="email" placeholder="z.B. anna.mueller@example.com">
      </div>
      <div class="form-field">
        <label for="driver-color-input">Farbe</label>
        <input id="driver-color-input" type="color" value="#111827">
      </div>
    </div>
    <p class="form-hint">
      Neuen Fahrer anlegen. Klicke in der Liste auf einen Fahrer, um ihn später zu bearbeiten.
    </p>
  `;

  BusplanView.showModal("Fahrer anlegen", html);

  modalOkHandler = () => {
    const nameInput = document.getElementById("driver-name-input");
    const employeeIdInput = document.getElementById("driver-employeeid-input");
    const roleInput = document.getElementById("driver-role-input");
    const licenseInput = document.getElementById("driver-license-input");
    const birthdateInput = document.getElementById("driver-birthdate-input");
    const addressInput = document.getElementById("driver-address-input");
    const phoneInput = document.getElementById("driver-phone-input");
    const emailInput = document.getElementById("driver-email-input");
    const colorInput = document.getElementById("driver-color-input");

    const name = nameInput ? nameInput.value.trim() : "";
    const employeeId = employeeIdInput ? employeeIdInput.value.trim() : "";
    const role = roleInput ? roleInput.value.trim() : "";
    const licenseClass = licenseInput ? licenseInput.value.trim() : "";
    const birthDate = birthdateInput ? birthdateInput.value : "";
    const address = addressInput ? addressInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const color = colorInput && colorInput.value ? colorInput.value : "#111827";

    if (!name) {
      BusplanView.showError("Bitte einen Fahrernamen eingeben.");
      if (nameInput) {
        nameInput.focus();
      }
      return false; // Modal offen lassen
    }

    try {
      BusplanModel.addDriver({
        name,
        color,
        employeeId,
        role,
        licenseClass,
        birthDate,
        address,
        phone,
        email
      });
      refreshAll();
      return true;
    } catch (err) {
      console.error(err);
      BusplanView.showError(err.message || "Fahrer konnte nicht gespeichert werden.");
      return false;
    }
  };
}


function openEditDriverModal(driverId) {
  const driver = BusplanModel.getDriverById(driverId);
  if (!driver) {
    console.warn("Fahrer nicht gefunden:", driverId);
    return;
  }

  const okButton = document.getElementById("modal-ok");
  if (okButton) {
    okButton.textContent = "Speichern";
  }

  const html = `
    <div class="filter-grid">
      <div class="form-field">
        <label for="driver-name-input">Name</label>
        <input id="driver-name-input" type="text">
      </div>
      <div class="form-field">
        <label for="driver-employeeid-input">Personalnummer</label>
        <input id="driver-employeeid-input" type="text">
      </div>
      <div class="form-field">
        <label for="driver-role-input">Rolle</label>
        <input id="driver-role-input" type="text">
      </div>
      <div class="form-field">
        <label for="driver-license-input">Führerscheinklasse</label>
        <input id="driver-license-input" type="text">
      </div>
      <div class="form-field">
        <label for="driver-birthdate-input">Geburtsdatum</label>
        <input id="driver-birthdate-input" type="date">
      </div>
      <div class="form-field">
        <label for="driver-address-input">Adresse</label>
        <input id="driver-address-input" type="text">
      </div>
      <div class="form-field">
        <label for="driver-phone-input">Telefonnummer</label>
        <input id="driver-phone-input" type="tel">
      </div>
      <div class="form-field">
        <label for="driver-email-input">E-Mail</label>
        <input id="driver-email-input" type="email">
      </div>
      <div class="form-field">
        <label for="driver-color-input">Farbe</label>
        <input id="driver-color-input" type="color">
      </div>
    </div>
    <div class="modal-footer-extra">
      <button type="button" id="driver-delete-button" class="danger-button">
        Fahrer löschen
      </button>
    </div>
  `;

  BusplanView.showModal("Fahrer bearbeiten", html);

  const nameInput = document.getElementById("driver-name-input");
  const employeeIdInput = document.getElementById("driver-employeeid-input");
  const roleInput = document.getElementById("driver-role-input");
  const licenseInput = document.getElementById("driver-license-input");
  const birthdateInput = document.getElementById("driver-birthdate-input");
  const addressInput = document.getElementById("driver-address-input");
  const phoneInput = document.getElementById("driver-phone-input");
  const emailInput = document.getElementById("driver-email-input");
  const colorInput = document.getElementById("driver-color-input");

  if (nameInput) {
    nameInput.value = driver.name || "";
  }
  if (employeeIdInput) {
    employeeIdInput.value = driver.employeeId || "";
  }
  if (roleInput) {
    roleInput.value = driver.role || "";
  }
  if (licenseInput) {
    licenseInput.value = driver.licenseClass || "";
  }
  if (birthdateInput) {
    birthdateInput.value = driver.birthDate || "";
  }
  if (addressInput) {
    addressInput.value = driver.address || "";
  }
  if (phoneInput) {
    phoneInput.value = driver.phone || "";
  }
  if (emailInput) {
    emailInput.value = driver.email || "";
  }
  if (colorInput) {
    colorInput.value = driver.color || "#111827";
  }

  const deleteButton = document.getElementById("driver-delete-button");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      const confirmed = confirm(
        "Fahrer wirklich löschen? Zugeordnete Schichten werden ebenfalls entfernt."
      );
      if (!confirmed) return;

      BusplanModel.deleteDriver(driverId);
      refreshAll();
      modalOkHandler = null;
      BusplanView.hideModal();
      resetModalOkLabel();
    });
  }

  modalOkHandler = () => {
    const name = nameInput ? nameInput.value.trim() : "";
    const employeeId = employeeIdInput ? employeeIdInput.value.trim() : "";
    const role = roleInput ? roleInput.value.trim() : "";
    const licenseClass = licenseInput ? licenseInput.value.trim() : "";
    const birthDate = birthdateInput ? birthdateInput.value : "";
    const address = addressInput ? addressInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const color = colorInput && colorInput.value ? colorInput.value : "#111827";

    if (!name) {
      BusplanView.showError("Bitte einen Fahrernamen eingeben.");
      if (nameInput) {
        nameInput.focus();
      }
      return false;
    }

    try {
      BusplanModel.updateDriver(driverId, {
        name,
        color,
        employeeId,
        role,
        licenseClass,
        birthDate,
        address,
        phone,
        email
      });
      refreshAll();
      return true;
    } catch (err) {
      console.error(err);
      BusplanView.showError(err.message || "Fahrer konnte nicht gespeichert werden.");
      return false;
    }
  };
}