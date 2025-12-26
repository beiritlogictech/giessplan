document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-pass").forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;
    btn.addEventListener("click", () => {
      const isHidden = input.getAttribute("type") === "password";
      input.setAttribute("type", isHidden ? "text" : "password");
      btn.textContent = isHidden ? "🙈" : "👁️";
    });
  });
});
