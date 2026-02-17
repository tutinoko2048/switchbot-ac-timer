FROM oven/bun:1.3.9

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN pnpm install --frozen-lockfile --filter backend...

COPY backend ./backend

WORKDIR /app/backend

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
