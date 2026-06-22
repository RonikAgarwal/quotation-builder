# Hardware Quotation Builder

A fast, client-side quotation generation tool tailored for hardware stores. It enables instant product search, offline-capable quotation editing, and on-device PDF generation. Integrated with Firebase for cloud synchronization and authentication.

## Features

- **Dynamic Product Catalog**: Search and filter an extensive hardware catalog directly in the browser. Fuzzy search is handled client-side for immediate feedback.
- **Interactive Quotation Editor**: Real-time total and price calculations. Add custom discounts and manual MRP overrides on a per-item basis.
- **Cloud Sync & History**: Securely save quotations to the cloud and access previous quotations from any device.
- **Custom Products**: Add unlisted items with custom images. Data is persisted to Firebase Firestore under your authenticated account.
- **On-Device PDF Generation**: Export professional, paginated, and branded PDFs locally without a backend service. Smart layout engine hides image columns if no images are present to maximize text space.
- **Cross-Platform & Mobile Optimized**: Dedicated mobile views, bottom sheet cart drawer, and responsive gestures. Includes a built-in Original Catalog PDF Viewer with Android fallback support.
- **Local Image Handling**: Upload local images for products. They are securely converted to Base64 to bypass CORS constraints during PDF generation.

## Tech Stack

**Core**
- React 18
- TypeScript
- Vite

**State & Infrastructure**
- Firebase Auth (Google Sign-In)
- Firebase Firestore (NoSQL Cloud Database)
- Firebase Hosting
- Fuse.js (Client-side fuzzy search)

**PDF & Export**
- html2canvas & jspdf (Client-side rendering)

**UI & Styling**
- Lucide React (Icons)
- CSS Modules (Custom utility classes, CSS Variables, Glassmorphism design system)

## Development Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd quotation-builder
   npm install
   ```

2. **Environment Configuration**
   Create a `.env.local` file with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Deployment

This application is built as a static Single Page Application (SPA) and is configured to be deployed via Firebase Hosting.

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   npx firebase-tools deploy
   ```

---
*Developed for internal business use.*
