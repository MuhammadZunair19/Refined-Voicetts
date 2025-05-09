/**
 * Helper function to navigate between pages with a smooth transition
 */
export function navigateTo(url: string): void {
  // Show overlay
  const overlay = document.getElementById("page-transition-overlay")
  if (overlay) {
    overlay.style.opacity = "1"
  }

  // Add a small delay to allow the overlay to appear
  setTimeout(() => {
    window.location.href = url
  }, 100)
}

