# E-Tapalwala Frontend Portal

This is the Next.js frontend application for the E-Tapalwala SaaS platform. It provides a gorgeous, dynamic, and fully responsive user interface for Super Admins, City Admins, and Operators.

## 🚀 Key Technologies
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **State Management:** Zustand (Global State) + React Query (Server State & Caching)
- **Charts & UI:** Recharts, Headless UI components

---

## 🛠 Setup & Installation

### 1. Install Dependencies
Ensure you have Node.js (v18+) installed.
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root of the `frontend` folder and set the backend API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Running the Development Server
Run the local Next.js server with hot-reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ☁️ Hosting & Deployment Requirements

To successfully host this frontend in a production environment (e.g., Vercel, Netlify, AWS Amplify, Render):

1. **Framework Preset:** Most modern hosting providers (like Vercel or Netlify) will automatically detect this as a `Next.js` project. Ensure the framework preset is set to **Next.js**.
2. **Environment Variables:** You MUST add `NEXT_PUBLIC_API_URL` to your hosting provider's Environment Variables settings before building. 
   - *Example:* `NEXT_PUBLIC_API_URL=https://api.etapalwala.gov.in`
3. **Build Command:** 
   ```bash
   npm run build
   ```
4. **Output Directory:** The standard Next.js build output directory is `.next`. Your host should automatically detect this, but configure it if asked.
5. **Install Command:**
   ```bash
   npm install
   ```
6. **Node.js Version:** Ensure your hosting platform is configured to use Node.js `18.x` or newer.

**Recommended Host:** We strongly recommend deploying this frontend on **Vercel** for zero-config Next.js optimizations and Edge network delivery.
