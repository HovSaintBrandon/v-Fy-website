// ==================== Configuration ====================
const API_BASE = "https://website.venuefy.top";

// ==================== State ====================
let studentInfo = null;
let isVerified = false;

// ==================== Initialize ====================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Set current year
  document.getElementById("current-year").textContent = new Date().getFullYear();
  
  // Initialize scroll listener
  initScrollListener();
  
  // Load data
  loadTestimonials();
  loadDownloads();
  
  // Initialize form listeners
  initFormListeners();
  
  // Show privacy popup on first paint
  try { showPrivacyModal(); } catch (e) { /* ignore if modal missing */ }
});

// ==================== Navigation ====================
function initScrollListener() {
  const navbar = document.getElementById("navbar");
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

function scrollToSection(event, sectionId) {
  event.preventDefault();
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
  closeMobileMenu();
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("menu-icon");
  
  menu.classList.toggle("open");
  
  if (menu.classList.contains("open")) {
    icon.setAttribute("data-lucide", "x");
  } else {
    icon.setAttribute("data-lucide", "menu");
  }
  lucide.createIcons();
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("menu-icon");
  
  menu.classList.remove("open");
  icon.setAttribute("data-lucide", "menu");
  lucide.createIcons();
}

// ==================== Testimonials ====================
async function loadTestimonials() {
  const grid = document.getElementById("testimonials-grid");
  
  // Show loading skeleton
  grid.innerHTML = `
    ${[1, 2, 3].map(() => `
      <div class="testimonial-card glass-card">
        <div class="skeleton" style="width: 2.5rem; height: 2.5rem; margin-bottom: 1.5rem;"></div>
        <div class="skeleton" style="height: 1rem; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 1rem; width: 80%; margin-bottom: 0.5rem;"></div>
        <div class="skeleton" style="height: 1rem; width: 60%; margin-bottom: 1.5rem;"></div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="skeleton" style="width: 3rem; height: 3rem; border-radius: 50%;"></div>
          <div>
            <div class="skeleton" style="height: 1rem; width: 6rem; margin-bottom: 0.5rem;"></div>
            <div class="skeleton" style="height: 0.75rem; width: 8rem;"></div>
          </div>
        </div>
      </div>
    `).join("")}
  `;
  
  try {
    const response = await fetch(`${API_BASE}/api/testimonials`);
    if (response.ok) {
      const testimonials = await response.json();
      renderTestimonials(testimonials);
    } else {
      throw new Error("Failed to fetch");
    }
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    grid.innerHTML = `
      <div class="empty-state">
        <p>No testimonials yet. Be the first to share your experience!</p>
      </div>
    `;
  }
}

function renderTestimonials(testimonials) {
  const grid = document.getElementById("testimonials-grid");
  
  if (testimonials.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No testimonials yet. Be the first to share your experience!</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = testimonials.map(t => `
    <div class="testimonial-card glass-card">
      <div class="quote-icon">
        <i data-lucide="quote"></i>
      </div>
      <blockquote>"${escapeHtml(t.message)}"</blockquote>
      <div class="testimonial-author">
        <div class="author-avatar">
          <span>${getInitials(t.name)}</span>
        </div>
        <div class="author-info">
          <h4>${escapeHtml(t.name)}</h4>
          <p>${escapeHtml(t.course)}</p>
        </div>
      </div>
    </div>
  `).join("");
  
  lucide.createIcons();
}

function getInitials(name) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ==================== Testimonial Form ====================
function initFormListeners() {
  const regInput = document.getElementById("reg-number");
  const messageInput = document.getElementById("testimonial-message");
  const charCount = document.getElementById("char-count");
  const submitBtn = document.getElementById("submit-btn");
  
  // Handle Enter key on reg number input
  regInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      verifyStudent();
    }
  });
  
  // Character count for message
  messageInput.addEventListener("input", () => {
    const length = messageInput.value.length;
    charCount.textContent = `${length}/500 characters`;
    submitBtn.disabled = length < 20;
  });
}

async function verifyStudent() {
  const regNumber = document.getElementById("reg-number").value.trim();
  const verifyBtn = document.getElementById("verify-btn");
  
  if (!regNumber) {
    showToast("Error", "Please enter your registration number.", "error");
    return;
  }
  
  // Show loading
  verifyBtn.innerHTML = '<div class="loader"></div>';
  verifyBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE}/api/student/${encodeURIComponent(regNumber)}`);
    
    if (response.ok) {
      studentInfo = await response.json();
      isVerified = true;
      
      // Update UI
      document.getElementById("verified-name").textContent = studentInfo.name;
      document.getElementById("verified-course").textContent = studentInfo.course;
      document.getElementById("verify-step").classList.add("hidden");
      document.getElementById("testimonial-step").classList.remove("hidden");
      
      showToast("Verified!", `Welcome, ${studentInfo.name}!`, "success");
      lucide.createIcons();
    } else {
      showToast("Not Found", "Student ID not found in our records.", "error");
    }
  } catch (error) {
    showToast("Error", "Failed to verify. Please try again.", "error");
  } finally {
    verifyBtn.innerHTML = '<i data-lucide="check-circle"></i><span>Verify</span>';
    verifyBtn.disabled = false;
    lucide.createIcons();
  }
}

async function submitTestimonial() {
  const regNumber = document.getElementById("reg-number").value.trim();
  const message = document.getElementById("testimonial-message").value.trim();
  const submitBtn = document.getElementById("submit-btn");
  
  if (!message || message.length < 20) {
    showToast("Error", "Please write at least 20 characters.", "error");
    return;
  }
  
  // Show loading
  submitBtn.innerHTML = '<div class="loader"></div>';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_BASE}/api/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regNumber: regNumber.toUpperCase(),
        message: message,
        name: studentInfo?.name || "Anonymous",
        course: studentInfo?.course || "Unknown",
      }),
    });
    
    if (response.ok) {
      showToast("Submitted!", "Your testimonial is pending approval. Thank you!", "success");
      
      // Reset form
      document.getElementById("reg-number").value = "";
      document.getElementById("testimonial-message").value = "";
      document.getElementById("char-count").textContent = "0/500 characters";
      document.getElementById("verify-step").classList.remove("hidden");
      document.getElementById("testimonial-step").classList.add("hidden");
      studentInfo = null;
      isVerified = false;
    } else {
      throw new Error("Submission failed");
    }
  } catch (error) {
    showToast("Error", "Failed to submit. Please try again.", "error");
  } finally {
    submitBtn.innerHTML = '<i data-lucide="send"></i><span>Post Testimonial</span>';
    submitBtn.disabled = false;
    lucide.createIcons();
  }
}

// ==================== Downloads ====================
async function loadDownloads() {
  const grid = document.getElementById("download-grid");
  
  const platforms = [
    { key: "android", name: "Android", extension: "APK", iconClass: "platform-icon-android" },
    { key: "windows", name: "Windows", extension: "EXE", iconClass: "platform-icon-windows" },
    { key: "linux", name: "Linux", extension: "AppImage", iconClass: "platform-icon-linux" },
    { key: "ios", name: "iOS", extension: "IPA", iconClass: "platform-icon-ios" },
  ];
  
  const iconMap = {
    android: "smartphone",
    windows: "monitor",
    linux: "monitor",
    ios: "smartphone",
  };
  
  // Show loading skeleton
  grid.innerHTML = platforms.map(p => `
    <div class="download-card glass-card">
      <div class="platform-icon ${p.iconClass}">
        <i data-lucide="${iconMap[p.key]}"></i>
      </div>
      <h3>${p.name}</h3>
      <div class="skeleton" style="height: 1rem; width: 5rem; margin: 0 auto 1rem;"></div>
      <button class="btn btn-outline btn-sm w-full" disabled>
        <i data-lucide="download"></i>
        ${p.extension}
      </button>
    </div>
  `).join("");
  
  lucide.createIcons();
  
  try {
    const response = await fetch(`${API_BASE}/api/downloads`);
    if (response.ok) {
      const downloads = await response.json();
      renderDownloads(downloads, platforms, iconMap);
    } else {
      throw new Error("Failed to fetch");
    }
  } catch (error) {
    console.error("Failed to fetch downloads:", error);
    renderDownloads({}, platforms, iconMap);
  }
}

function renderDownloads(downloads, platforms, iconMap) {
  const grid = document.getElementById("download-grid");
  
  grid.innerHTML = platforms.map(p => {
    const download = downloads[p.key];
    const isAvailable = !!download;
    
    return `
      <div class="download-card glass-card ${isAvailable ? 'available' : 'unavailable'}">
        <div class="platform-icon ${p.iconClass}">
          <i data-lucide="${iconMap[p.key]}"></i>
        </div>
        <h3>${p.name}</h3>
        <span class="version-info">
          ${isAvailable ? `${download.version} • ${formatFileSize(download.size)}` : 'Coming Soon'}
        </span>
        <button 
          class="btn ${isAvailable ? 'btn-hero' : 'btn-outline'} btn-sm w-full"
          onclick="handleDownload('${p.name}', ${isAvailable ? `'${download.url}'` : 'null'})"
        >
          <i data-lucide="download"></i>
          ${p.extension}
        </button>
      </div>
    `;
  }).join("");
  
  lucide.createIcons();
}

function handleDownload(platform, url) {
  if (!url) {
    showToast("Coming Soon", `${platform} version is not available yet.`, "error");
    return;
  }
  window.open(url, "_blank");
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ==================== Utilities ====================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(title, message, type = "success") {
  const container = document.getElementById("toast-container");
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <h4>${escapeHtml(title)}</h4>
    <p>${escapeHtml(message)}</p>
  `;
  
  container.appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==================== Privacy Modal ====================
function showPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  // wire close button
  const closeBtn = document.getElementById('privacy-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hidePrivacyModal());
  }
  // allow ESC to close
  function escHandler(e) {
    if (e.key === 'Escape') hidePrivacyModal();
  }
  document.addEventListener('keydown', escHandler);
  // store handler for potential cleanup
  modal._escHandler = escHandler;
}

function hidePrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (!modal) return;
  modal.style.display = 'none';
  if (modal._escHandler) document.removeEventListener('keydown', modal._escHandler);
}
