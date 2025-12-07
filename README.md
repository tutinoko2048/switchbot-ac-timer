# SwitchBot AC Timer

## Setup

1.  **Install Dependencies**
    ```bash
    pnpm install
    ```

2.  **Backend Setup**
    - Create `.env` in `backend/` and add your SwitchBot Token and Secret.
      ```env
      SWITCHBOT_TOKEN=your_token
      SWITCHBOT_SECRET=your_secret
      ```
    - Initialize Database:
      ```bash
      cd backend
      bun run src/db/migrate.ts
      ```

3.  **Run Development Servers**

    - **Backend** (Terminal 1):
      ```bash
      cd backend
      bun run dev
      ```
      Runs on http://localhost:3001

    - **Frontend** (Terminal 2):
      ```bash
      cd frontend
      pnpm dev
      ```
      Runs on http://localhost:3000

## Features
- List SwitchBot Air Conditioners
- Schedule Timers (Time, Weekdays)
- Auto-execute ON command via Backend Scheduler
- Manual Test Button
