FROM node:24-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json

RUN pnpm install --frozen-lockfile --filter frontend...

COPY frontend ./frontend
COPY backend/src ./backend/src

WORKDIR /app/frontend

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
