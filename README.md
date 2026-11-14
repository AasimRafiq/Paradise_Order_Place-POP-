# Pop Paradise Order Place

A digital table-ordering and kitchen management web application built for dine-in and takeaway restaurants. Customers scan a QR code or open the table menu to browse dishes, get smart dish recommendations based on order history and time of day, and send orders directly to the kitchen queue. Managers and owners can monitor active tables, update menu availability, and review daily sales summaries.

## Features
- **Digital Customer Menu:** Category filtering, search, customization notes, and instant cart updates.
- **Smart Order Assistant:** Rule-based and frequency-driven item pairing suggestions (e.g., suggesting drinks/sides with mains) plus popular-hour picks for customers, and peak-hour demand insights for managers.
- **Live Order Queue (Manager/Kitchen View):** Track order status (`Pending` -> `Preparing` -> `Served`) with real-time total revenue and item-level breakdown.
- **Menu & Pricing Control:** Add new menu items, toggle out-of-stock status, and adjust pricing without touching the code.
- **Zero-Backend Ready:** Uses `localStorage` out of the box so it runs directly in any browser or GitHub Pages, with clean service hooks ready for Firebase/REST API integration.

## Tech Stack
- HTML5, CSS3 (Custom Responsive Grid & Variables)
- Vanilla JavaScript (ES6+ Modular State Management)
- Chart-free lightweight analytics bars using pure CSS

## Setup & Usage
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pop-paradise-order-place.git
   ```
2. Open `index.html` in your browser or serve via VS Code Live Server.
3. Switch between **Customer View** and **Manager Dashboard** using the top navigation toggle.
