const driveShineWhatsAppNumber = "233240871412";

const bookingModalMarkup = `
  <a class="btn sticky-whatsapp" href="https://wa.me/${driveShineWhatsAppNumber}?text=Hi%20Drive%26Shine%2C%20I%27d%20like%20to%20book%20a%20mobile%20detailing%20appointment." target="_blank" rel="noopener" aria-label="Chat with Drive&Shine on WhatsApp at 0240871412">
    <i data-lucide="message-circle"></i>
    WhatsApp
  </a>

  <div class="modal" id="bookingModal" role="dialog" aria-modal="true" aria-labelledby="bookingTitle">
    <div class="booking-panel">
      <div class="modal-head">
        <div>
          <div class="eyebrow">Online Booking</div>
          <h2 id="bookingTitle">Reserve Your Detail</h2>
          <p>Complete the form and we will confirm your appointment window, service details, and any preparation needed before arrival.</p>
        </div>
        <button class="close-modal" type="button" aria-label="Close booking modal" id="closeModal">
          <i data-lucide="x"></i>
        </button>
      </div>

      <form id="bookingForm" novalidate>
        <div class="form-grid">
          <div class="field">
            <label for="customerName">Customer Name</label>
            <input id="customerName" name="customerName" type="text" placeholder="Full name" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingPhone">Phone Number</label>
            <input id="bookingPhone" name="bookingPhone" type="tel" placeholder="Your phone number" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingEmail">Email</label>
            <input id="bookingEmail" name="bookingEmail" type="email" placeholder="you@example.com" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="vehicleType">Vehicle Type</label>
            <select id="vehicleType" name="vehicleType" required>
              <option value="">Select vehicle</option>
              <option>Sedan</option>
              <option>Coupe</option>
              <option>SUV</option>
              <option>Truck</option>
              <option>Luxury or Exotic</option>
            </select>
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="serviceSelect">Service Selection</label>
            <select id="serviceSelect" name="serviceSelect" required>
              <option value="">Select service</option>
              <option>Interior Detailing</option>
              <option>Exterior Detailing</option>
              <option>Engine Bay Cleaning</option>
              <option>Paint Correction</option>
              <option>Ceramic Coating</option>
              <option>Headlight Restoration</option>
              <option>Basic Wash Package</option>
              <option>Premium Detail Package</option>
              <option>Ultimate Showroom Package</option>
              <option>Drive Silver Membership</option>
              <option>Drive Gold Membership</option>
              <option>Drive Platinum Membership</option>
            </select>
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingDate">Date</label>
            <input id="bookingDate" name="bookingDate" type="date" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingTime">Time</label>
            <select id="bookingTime" name="bookingTime" required>
              <option value="">Select time</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>11:00 AM</option>
              <option>12:00 PM</option>
              <option>1:00 PM</option>
              <option>2:00 PM</option>
              <option>3:00 PM</option>
              <option>4:00 PM</option>
            </select>
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingAddress">Address / Location</label>
            <input id="bookingAddress" name="bookingAddress" type="text" placeholder="Street, city, ZIP" required />
            <span class="error-text"></span>
          </div>
          <div class="field full">
            <label for="bookingNotes">Additional Notes</label>
            <textarea id="bookingNotes" name="bookingNotes" placeholder="Vehicle condition, access details, preferred products, or special requests."></textarea>
            <span class="error-text"></span>
          </div>
        </div>

        <button class="btn btn-primary" type="submit">
          <i data-lucide="badge-check"></i>
          Confirm Booking
        </button>
      </form>
    </div>
  </div>

  <div class="success-toast" id="successToast" role="status" aria-live="polite">
    <i data-lucide="circle-check"></i>
    <div>
      <strong>Request Received</strong>
      <span>Your booking details were captured. Drive&Shine will confirm the appointment shortly.</span>
    </div>
  </div>
`;

document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", bookingModalMarkup);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  const navLinks = document.getElementById("navLinks");
  const mobileToggle = document.getElementById("mobileToggle");
  const bookingModal = document.getElementById("bookingModal");
  const closeModal = document.getElementById("closeModal");
  const bookingForm = document.getElementById("bookingForm");
  const contactForm = document.getElementById("contactForm");
  const successToast = document.getElementById("successToast");
  const serviceSelect = document.getElementById("serviceSelect");
  const bookingDate = document.getElementById("bookingDate");

  if (bookingDate) {
    bookingDate.min = new Date().toISOString().split("T")[0];
  }

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        mobileToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

  const validators = {
    customerName: {
      message: "Enter your full name.",
      test: (value) => value.trim().length >= 2
    },
    bookingPhone: {
      message: "Enter a valid phone number.",
      test: (value) => /^[0-9+()\-\s.]{7,}$/.test(value.trim())
    },
    bookingEmail: {
      message: "Enter a valid email address.",
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    },
    vehicleType: {
      message: "Select your vehicle type.",
      test: (value) => value.trim() !== ""
    },
    serviceSelect: {
      message: "Select a service.",
      test: (value) => value.trim() !== ""
    },
    bookingDate: {
      message: "Choose an appointment date.",
      test: (value) => value.trim() !== ""
    },
    bookingTime: {
      message: "Choose an appointment time.",
      test: (value) => value.trim() !== ""
    },
    bookingAddress: {
      message: "Enter the service address.",
      test: (value) => value.trim().length >= 6
    },
    contactName: {
      message: "Enter your name.",
      test: (value) => value.trim().length >= 2
    },
    contactPhone: {
      message: "Enter a valid phone number.",
      test: (value) => /^[0-9+()\-\s.]{7,}$/.test(value.trim())
    },
    contactEmail: {
      message: "Enter a valid email address.",
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    },
    contactMessage: {
      message: "Add a short message.",
      test: (value) => value.trim().length >= 8
    }
  };

  function setFieldState(input, isValid, message) {
    const field = input.closest(".field");
    const errorText = field ? field.querySelector(".error-text") : null;
    if (!field || !errorText) return;

    field.classList.toggle("invalid", !isValid);
    field.classList.toggle("valid", isValid && input.value.trim() !== "");
    errorText.textContent = isValid ? "" : message;
  }

  function validateInput(input) {
    const validator = validators[input.name];
    if (!validator) return true;
    const isValid = validator.test(input.value);
    setFieldState(input, isValid, validator.message);
    return isValid;
  }

  function validateForm(form) {
    const inputs = Array.from(form.querySelectorAll("input, select, textarea"));
    const validatedInputs = inputs.filter((input) => validators[input.name]);
    return validatedInputs.map(validateInput).every(Boolean);
  }

  function wireValidation(form) {
    if (!form) return;
    form.querySelectorAll("input, select, textarea").forEach((input) => {
      input.addEventListener("input", () => validateInput(input));
      input.addEventListener("blur", () => validateInput(input));
    });
  }

  function showSuccess(message) {
    if (message) {
      successToast.querySelector("span").textContent = message;
    }
    successToast.classList.add("is-visible");
    window.setTimeout(() => successToast.classList.remove("is-visible"), 4200);
  }

  function getFormValue(form, name) {
    return form.elements[name] ? form.elements[name].value.trim() : "";
  }

  function openBookingWhatsApp(form) {
    const details = [
      "Hi Drive&Shine, I'd like to book a mobile detailing appointment.",
      "",
      `Name: ${getFormValue(form, "customerName")}`,
      `Phone: ${getFormValue(form, "bookingPhone")}`,
      `Email: ${getFormValue(form, "bookingEmail")}`,
      `Vehicle: ${getFormValue(form, "vehicleType")}`,
      `Service: ${getFormValue(form, "serviceSelect")}`,
      `Date: ${getFormValue(form, "bookingDate")}`,
      `Time: ${getFormValue(form, "bookingTime")}`,
      `Location: ${getFormValue(form, "bookingAddress")}`,
      `Notes: ${getFormValue(form, "bookingNotes") || "None"}`
    ];
    const message = encodeURIComponent(details.join("\n"));
    window.open(`https://wa.me/${driveShineWhatsAppNumber}?text=${message}`, "_blank", "noopener");
  }


  function openBooking(serviceName = "") {
    bookingModal.classList.add("is-open");
    document.body.classList.add("modal-open");
    if (serviceName && serviceSelect) {
      serviceSelect.value = serviceName;
      validateInput(serviceSelect);
    }
    window.setTimeout(() => {
      const firstInput = bookingModal.querySelector("#customerName");
      if (firstInput) firstInput.focus();
    }, 80);
  }

  function closeBooking() {
    bookingModal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }

  document.querySelectorAll("[data-open-booking]").forEach((button) => {
    button.addEventListener("click", () => openBooking(button.dataset.service || ""));
  });

  closeModal.addEventListener("click", closeBooking);
  bookingModal.addEventListener("click", (event) => {
    if (event.target === bookingModal) closeBooking();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && bookingModal.classList.contains("is-open")) {
      closeBooking();
    }
  });

  wireValidation(bookingForm);
  wireValidation(contactForm);

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm(bookingForm)) return;
    openBookingWhatsApp(bookingForm);
    showSuccess("Your booking request is ready in WhatsApp. Send it there so we can confirm your appointment.");
    bookingForm.reset();
    bookingForm.querySelectorAll(".field").forEach((field) => field.classList.remove("valid", "invalid"));
    closeBooking();
  });

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateForm(contactForm)) return;
      showSuccess("Thanks for reaching out. Drive&Shine will respond to your message soon.");
      contactForm.reset();
      contactForm.querySelectorAll(".field").forEach((field) => field.classList.remove("valid", "invalid"));
    });
  }
});
