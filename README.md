# LTynk: Precision Engineering for Linguists

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Genkit](https://img.shields.io/badge/Google%20Genkit-1.20-blue?logo=google-cloud)](https://github.com/google/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> "We think like linguists, verify like engineers."

**LTynk** is a high-performance, local-first Quality Assurance (QA) platform designed for professional translators, editors, and localization engineers. It provides instant, automated verification for industry-standard formats (XLIFF, TMX), ensuring flawless grammar, terminological consistency, and adherence to complex technical specifications.

## 🚀 Key Capabilities

- **Instant Terminology Validation**: Verify translations against multi-domain glossaries (Legal, Medical, Technical) in real-time.
- **Advanced XLIFF/TMX Support**: Robust parsing and rebuilding for industry-standard formats, including SDLXLIFF (Trados), MQXLIFF (MemoQ), and standard TMX 1.4b.
- **AI-Powered Linguistic QA**: Beyond regex matching, LTynk utilizes Gemini 2.5 Flash via Google Genkit to provide situational reasoning and "human-like" error detection.
- **Deep Consistency Audits**: Automated detection of source-to-target inconsistencies, punctuation pattern mismatches, and segment-level repetitions.
- **Professional Reporting**: Export detailed, auditor-ready QA reports in Excel (.xlsx) format for seamless collaboration with clients and teams.

## 🏗️ Technical Architecture

LTynk is engineered with a strict focus on speed, privacy, and architectural elegance:

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router for a responsive, modern SPA experience.
- **State Store**: [Zustand](https://github.com/pmndrs/zustand) for reactive state management with custom history (Undo/Redo) logic.
- **Persistence Layer**: [Dexie.js](https://dexie.org/) (IndexedDB) for a 100% local-first experience. Your data never leaves your machine.
- **Linguistic Engine**: Custom-built validation pipelines for regex patterns, tag integrity, and numerical accuracy.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/) with a custom "Sand & Zinc" aesthetic tailored for professional focus.

## 📦 Getting Started

### Prerequisites

- **Node.js**: version 18.0.0 or higher.
- **API Access**: A [Google Gemini API Key](https://aistudio.google.com/) is required for AI-powered features.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/anasoumadi/LTynk.git
   cd LTynk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the environment:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Launch development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:9002](http://localhost:9002) in your browser.

## 🛠️ Project Structure

- `src/lib/`: Core validation logic, parsers (TMX/XLIFF/Excel), and database schemas.
- `src/hooks/`: Custom React hooks for state management (`useTmxStore`) and file I/O.
- `src/components/`: Modular UI units (Dashboard, Editor Grid, QA Reports, Settings).
- `src/ai/`: Genkit flow definitions and prompt engineering.

---

Crafted with ❤️ by **anasoumadi** (AS).  
