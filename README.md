# Hardware Quotation Builder

A powerful, completely client-side quotation generation tool built for hardware stores and suppliers. It allows users to quickly select products, edit prices/quantities on the fly, search the web for missing product images, and export the final quotation directly to a professional PDF.

## 🚀 Key Features

### 1. **Dynamic Catalog & Product Selection**
- Complete product catalog loaded directly in the browser.
- Left-side category and brand filters with a beautiful grid layout for hardware items.
- "Recently Selected" floating panel lets you quickly see and un-select items you just tapped.

### 2. **Interactive Quotation Editor**
- Every row is fully editable: Quantity, Price, Total, MRP, and Discount %.
- **Smart Math:**
  - Type `Quantity` and `Price` -> auto-calculates `Total`.
  - Type `Quantity` and `Total` -> auto-calculates `Price`.
  - Discount is completely disconnected so you can adjust the base MRP up or down without breaking your final prices.

### 3. **Local Image Uploads**
- Missing an image for a custom product? Click `+ Img` to open the Image Manager.
- Choose to upload a local file from your device.
- Images are automatically converted to Base64 to bypass browser security blocks (CORS) when generating PDFs.

### 4. **PDF Generation**
- Click "Download PDF" to instantly generate a branded, paginated PDF.
- If a quotation has zero images across all rows, the PDF engine is smart enough to completely remove the Image column so your text has more room to breathe.
- Page numbering is fully supported, and manual products are hidden from the "Page No." column.

### 5. **Mobile & Tablet Optimized**
- **Mobile Mode:** Automatically detects mobile phones and provides a simplified, read-only "History" view that requires a PIN/Password to access.
- **Desktop/Tablet Mode:** The full editor is responsive and optimized for wide screens.

## 💻 Tech Stack & Usage

- **Framework:** React 18 with TypeScript and Vite.
- **Styling:** CSS Modules with modern Glassmorphism UI tokens.
- **PDF Engine:** `html2canvas` + `jspdf` for pixel-perfect document rendering directly in the user's browser.
- **External APIs:** None! 100% Client-side.

### Local Development

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

### Deployment

This project is built to be hosted entirely as static files. It is currently deployed via **Firebase Hosting**.

To build and deploy:
```bash
npm run build
npx firebase-tools deploy --only hosting
```
