# TechX — To-Do List (Desafio Full Stack)

Aplicação web de gerenciamento de tarefas (To-Do List) desenvolvida como desafio técnico.

- **Frontend:** Angular 19 (standalone components, signals)
- **Backend:** Node.js + TypeScript + Express
- **Banco principal:** MySQL (via Prisma ORM)
- **Banco extra (NoSQL):** MongoDB (via Mongoose) — armazena metadados das tarefas (tags, notas e histórico de atividades)
- **Autenticação:** JWT (JSON Web Token) com senhas protegidas por bcrypt

## Funcionalidades

- Cadastro e login de usuários (JWT)
- Listagem de tarefas do usuário autenticado
- Criar, editar e excluir tarefas
- Status de tarefa com badges: **Pendente**, **Em andamento**, **Concluída** (troca rápida na lista)
- Atribuir tarefas a outros usuários; cada tarefa registra quem criou e o responsável
- Listagem mostra tarefas criadas pelo usuário **ou** atribuídas a ele
- Tags e histórico de atividades de cada tarefa (MongoDB)

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ (testado com v22)
- [Docker](https://www.docker.com/) + Docker Compose (para subir MySQL e MongoDB)

> Sem Docker? Basta ter um MySQL e um MongoDB acessíveis e ajustar as URLs no `backend/.env`.

---

## 1. Subir os bancos de dados

Na raiz do projeto:

```bash
docker compose up -d
```

Isso sobe:
- **MySQL 8** em `localhost:3306` (banco `techx`)
- **MongoDB 7** em `localhost:27017`
- **Adminer** (UI do MySQL) em `http://localhost:8080`

---

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # no Windows: copy .env.example .env
npx prisma migrate dev      # cria as tabelas no MySQL
npm run dev
```

API disponível em **http://localhost:3333**.

Variáveis de ambiente (`backend/.env`):

| Variável        | Descrição                                  |
| --------------- | ------------------------------------------ |
| `DATABASE_URL`  | Conexão MySQL (Prisma)                     |
| `MONGO_URL`     | Conexão MongoDB (Mongoose)                 |
| `JWT_SECRET`    | Segredo para assinar os tokens JWT         |
| `JWT_EXPIRES_IN`| Validade do token (ex: `7d`)               |
| `PORT`          | Porta da API (padrão `3333`)               |
| `CORS_ORIGIN`   | Origem permitida (frontend, `:4200`)       |

### Endpoints

| Método | Rota                        | Auth | Descrição                          |
| ------ | --------------------------- | ---- | ---------------------------------- |
| POST   | `/api/auth/register`        | —    | Cadastra usuário e retorna token   |
| POST   | `/api/auth/login`           | —    | Autentica e retorna token          |
| GET    | `/api/users`                | ✅   | Lista usuários (para atribuição)   |
| GET    | `/api/tasks`                | ✅   | Lista tarefas criadas por ou atribuídas ao usuário |
| POST   | `/api/tasks`                | ✅   | Cria tarefa                        |
| GET    | `/api/tasks/:id`            | ✅   | Detalha tarefa (+ metadados Mongo) |
| PUT    | `/api/tasks/:id`            | ✅   | Edita tarefa                       |
| PATCH  | `/api/tasks/:id/status`     | ✅   | Altera status (PENDENTE/EM_ANDAMENTO/CONCLUIDA) |
| DELETE | `/api/tasks/:id`            | ✅   | Remove tarefa                      |

Rotas com ✅ exigem o header `Authorization: Bearer <token>`.

---

## 3. Frontend

```bash
cd frontend
npm install
npm start
```

Aplicação em **http://localhost:4200**.

O endereço da API está em `frontend/src/app/core/api.config.ts` (padrão `http://localhost:3333/api`).

---

## Estrutura do projeto

```
.
├── docker-compose.yml      # MySQL + MongoDB + Adminer
├── backend/                # API REST (Express + TS + Prisma + Mongoose)
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/         # variáveis de ambiente
│       ├── lib/            # clientes Prisma/Mongo, helpers
│       ├── middleware/     # auth JWT + tratamento de erros
│       ├── models/         # schema Mongoose (metadados)
│       └── modules/        # auth e tasks (rotas, controllers, services)
└── frontend/               # SPA Angular
    └── src/app/
        ├── core/           # services, models, guard, interceptor
        └── features/       # telas de auth e de tarefas
```

---

## Decisões técnicas

- **Prisma para MySQL + Mongoose para MongoDB:** o Prisma usa um único datasource por schema. Para usar os dois bancos exigidos, o MySQL (dados principais: usuários e tarefas) fica no Prisma e o MongoDB (metadados/atividades das tarefas) no Mongoose — separação limpa de responsabilidades.
- **Arquitetura modular no backend:** cada domínio (`auth`, `tasks`) tem rotas, controller e service isolados; acesso a dados concentrado nos services.
- **Validação com Zod** e **tratamento central de erros** via middleware.
- **Frontend standalone (Angular 19)** com signals, guard de rota e HTTP interceptor que injeta o token JWT.
