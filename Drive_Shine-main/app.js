import { addDoc, serverTimestamp } from "firebase/firestore";
import { contactMessagesRef, requireFirebase, websiteBookingsRef } from "../src/firebase";

const driveShineWhatsAppNumber = "233240871412";

const bookingModalMarkup = `
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
            <input id="customerName" name="customerName" type="text" maxlength="120" placeholder="Full name" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingPhone">Phone Number</label>
            <input id="bookingPhone" name="bookingPhone" type="tel" maxlength="40" placeholder="Your phone number" required />
            <span class="error-text"></span>
          </div>
          <div class="field">
            <label for="bookingEmail">Email</label>
            <input id="bookingEmail" name="bookingEmail" type="email" maxlength="254" placeholder="you@example.com" required />
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
            <input id="bookingAddress" name="bookingAddress" type="text" maxlength="500" placeholder="Street, city, ZIP" required />
            <span class="error-text"></span>
          </div>
          <div class="field full">
            <label for="bookingNotes">Additional Notes</label>
            <textarea id="bookingNotes" name="bookingNotes" maxlength="2000" placeholder="Vehicle condition, access details, preferred products, or special requests."></textarea>
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
  const bookingSyncChannel = typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel("drive-shine-website-bookings");
  window.addEventListener("pagehide", () => bookingSyncChannel?.close(), { once: true });

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

  function showToast(title, message, isError = false) {
    successToast.querySelector("strong").textContent = title;
    successToast.querySelector("span").textContent = message;
    successToast.classList.toggle("is-error", isError);
    successToast.setAttribute("role", isError ? "alert" : "status");
    successToast.classList.add("is-visible");
    window.setTimeout(() => successToast.classList.remove("is-visible"), 4200);
  }

  function getFormValue(form, name) {
    return form.elements[name] ? form.elements[name].value.trim() : "";
  }

  function bookingWhatsAppUrl(form) {
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
    return `https://wa.me/${driveShineWhatsAppNumber}?text=${message}`;
  }

  async function syncBookingToCommandCenter(form) {
    const storageKey = "drive-shine-command-center-v1";
    const customer = getFormValue(form, "customerName");
    const bookingData = {
      customer,
      phone: getFormValue(form, "bookingPhone"),
      vehicle: getFormValue(form, "vehicleType"),
      package: getFormValue(form, "serviceSelect"),
      date: getFormValue(form, "bookingDate"),
      time: getFormValue(form, "bookingTime"),
      email: getFormValue(form, "bookingEmail"),
      address: getFormValue(form, "bookingAddress"),
      notes: getFormValue(form, "bookingNotes")
    };
    const bookingRef = await addDoc(requireFirebase(websiteBookingsRef, "Firestore bookings"), {
      ...bookingData,
      createdAt: serverTimestamp()
    });
    const booking = {
      id: bookingRef.id,
      ...bookingData,
      price: 0,
      payment: "Pending",
      status: "Pending",
      initials: customer.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    };

    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    saved.bookings = Array.isArray(saved.bookings) ? saved.bookings : [];
    saved.customers = Array.isArray(saved.customers) ? saved.customers : [];
    saved.notifications = Array.isArray(saved.notifications) ? saved.notifications : [];
    saved.bookings.unshift(booking);

    if (!saved.customers.some((item) => item.name && item.name.toLowerCase() === customer.toLowerCase())) {
      saved.customers.unshift({
        name: customer,
        phone: booking.phone,
        email: getFormValue(form, "bookingEmail"),
        address: getFormValue(form, "bookingAddress"),
        membership: "—",
        spent: 0,
        service: "New booking",
        status: "Active",
        joined: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        initials: booking.initials
      });
    }

    saved.notifications.unshift({
      id: Date.now(),
      type: "booking",
      icon: "calendar-plus",
      title: "New website booking received",
      text: `${customer} requested ${booking.package}.`,
      time: "Just now",
      read: false
    });
    localStorage.setItem(storageKey, JSON.stringify(saved));
    bookingSyncChannel?.postMessage({ type: "booking-updated" });
    window.dispatchEvent(new Event("drive-shine-booking-updated"));
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

  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm(bookingForm)) return;
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;
    submitButton.disabled = true;
    try {
      await syncBookingToCommandCenter(bookingForm);
      const whatsappUrl = bookingWhatsAppUrl(bookingForm);
      showToast("Booking received", "Your booking is saved. Opening WhatsApp to confirm the appointment.");
      bookingForm.reset();
      bookingForm.querySelectorAll(".field").forEach((field) => field.classList.remove("valid", "invalid"));
      closeBooking();
      window.location.assign(whatsappUrl);
    } catch (error) {
      console.error("Website booking could not be saved to Firebase:", error);
      showToast("Booking not saved", "We couldn't save your booking. Your details are still here—please try again.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateForm(contactForm)) return;
      const submitButton = contactForm.querySelector('button[type="submit"]');
      if (submitButton.disabled) return;
      submitButton.disabled = true;
      try {
        await addDoc(requireFirebase(contactMessagesRef, "Firestore contact messages"), {
          name: getFormValue(contactForm, "contactName"),
          phone: getFormValue(contactForm, "contactPhone"),
          email: getFormValue(contactForm, "contactEmail"),
          message: getFormValue(contactForm, "contactMessage"),
          createdAt: serverTimestamp(),
        });
        showToast("Message received", "Thanks for reaching out. Drive&Shine will respond soon.");
        contactForm.reset();
        contactForm.querySelectorAll(".field").forEach((field) => field.classList.remove("valid", "invalid"));
      } catch (error) {
        console.error("Contact message could not be saved to Firebase:", error);
        showToast("Message not sent", "We couldn't save your message. Your details are still here—please try again.", true);
      } finally {
        submitButton.disabled = false;
      }
    });
  }
});
