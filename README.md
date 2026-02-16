# B-Progress: Growth & Accountability Platform

B-Progress is a professional-grade web application for coaching, learning tracking, and peer accountability. It bridges the gap between a "Supporter" (Admin) and multiple "Friends" (Students) using AI-driven insights.

## 🛠️ Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **Database**: LocalStorage (Saves history locally in your browser)

## 💻 Running in VS Code

### Prerequisites
- **Node.js**: Download and install from [nodejs.org](https://nodejs.org/).

### Local Setup
1. **Open the folder** in VS Code.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Configuration**:
   - Create a file named `.env` in the root folder.
   - Add your Gemini API Key:
     ```env
     API_KEY=your_actual_key_here
     ```
4. **Launch App**:
   ```bash
   npm start
   ```
   - The app will be available at `http://localhost:5173`.

## 🚀 Deployment

### Option 1: Vercel (Recommended)
1. Push this project to GitHub.
2. Connect the repo to Vercel.
3. Add `API_KEY` to the Vercel Project Environment Variables.

## 📂 Project Structure
- `/components`: UI modules for Admin and Friend dashboards.
- `/services`: Logic for LocalStorage and Gemini API integration.
- `types.ts`: TypeScript interfaces for the data model.

## 🛡️ Security & Privacy
- **History Saving**: Your daily history is saved automatically in your browser's **Local Storage**. If you clear your browser data, your history will be reset unless you use the "Backup History" feature in the Supporter dashboard.
