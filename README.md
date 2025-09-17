# Playboi Web

Playboi Web is a modern web application for managing and analyzing player profiles, meetings, and performance statistics. It is built with React, TypeScript, Vite, Tailwind CSS, and Supabase for backend services. The app provides a dashboard, player roster, detailed player profiles, meeting/expense tracking, and analytics.

## Features

- **Player Roster:** View, add, edit, and delete player profiles with images, likes, dislikes, and notes.
- **Player Profile:** Detailed view for each player, including stats, performance ratings, meeting/expense history, and AI-powered recaps.
- **Meetings & Expenses:** Log meetings and expenses for each player, including ratings and notes.
- **Performance Analytics:** Visualize player performance, looks, and date experience ratings with star ratings and leaderboards.
- **AI Recap:** Generate AI-powered summaries for player performance and history.
- **Authentication:** Secure login and user-specific data using Supabase Auth.
- **Responsive UI:** Mobile-friendly, modern design with Tailwind CSS.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS
- **Backend:** Supabase (Database, Auth, Functions)
- **State/Data:** React hooks, custom services, API abstraction

## Project Structure

- `src/components/` — React components for UI and features (PlayerProfile, PlaybookScreen, Modals, etc.)
- `src/services/` — API and data services (player, meetings, stats, etc.)
- `src/hooks/` — Custom React hooks for data and auth
- `src/lib/` — Utility libraries (Supabase client, OpenAI, storage, etc.)
- `public/` — Static assets and images
- `supabase/` — Supabase functions and migrations

## Setup & Development

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Configure environment:**
   - Set up your Supabase project and copy the API keys to your `.env` file.
3. **Run the app:**
   ```sh
   npm run dev
   ```
4. **Build for production:**
   ```sh
   npm run build
   ```

## Recent Fixes & Improvements

### Consistent Performance Ratings Calculation

**Issue:**
- The "Performance Ratings" section on the player profile (hub) page was showing different values for "Performance" and "Date Experience" compared to the playbook's "Top Players by Rating" section. This was due to each page using different fields and calculation logic for ratings.

**Fix:**
- We updated `PlayerProfile.tsx` to locally calculate `performanceRating` and `dateExperienceRating` from the loaded meetings array, using the same logic as the playbook's `calculatePlayerStats` function. Now, both the hub and playbook always display matching, accurate ratings for each player.

**Summary of Fix:**
- Calculate `performanceRating` as the average of all `performance_rating` values from meetings.
- Calculate `dateExperienceRating` as the average of all `rating` values from meetings.
- Use these calculated values in the UI for the "Performance" and "Date Experience" star ratings.

---

For more details, see the code in `src/components/PlayerProfile.tsx` and `src/services/api.ts`.
