// Popula dados de demonstração (idempotente). JS puro para rodar com `node`
// tanto localmente quanto dentro do container (sem precisar de tsx/ts).
import pkg from '@prisma/client';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const taskMetaSchema = new mongoose.Schema(
  {
    taskId: { type: Number, required: true, unique: true, index: true },
    tags: { type: [String], default: [] },
    notes: { type: String },
    checklist: {
      type: [new mongoose.Schema({ text: String, done: Boolean }, { _id: false })],
      default: [],
    },
    activityLog: {
      type: [new mongoose.Schema({ action: String, at: Date }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true }
);
const TaskMetaModel = mongoose.model('TaskMeta', taskMetaSchema);

async function main() {
  await mongoose.connect(process.env.MONGO_URL);

  const passwordHash = await bcrypt.hash('demo123', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@techx.com' },
    update: {},
    create: { name: 'Demo User', email: 'demo@techx.com', passwordHash },
  });
  const maria = await prisma.user.upsert({
    where: { email: 'maria@techx.com' },
    update: {},
    create: { name: 'Maria Silva', email: 'maria@techx.com', passwordHash },
  });

  // Recomeça limpo (apenas tarefas do demo).
  const old = await prisma.task.findMany({
    where: { OR: [{ creatorId: demo.id }, { assigneeId: demo.id }] },
    select: { id: true },
  });
  const oldIds = old.map((t) => t.id);
  if (oldIds.length) {
    await prisma.task.deleteMany({ where: { id: { in: oldIds } } });
    await TaskMetaModel.deleteMany({ taskId: { $in: oldIds } });
  }

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const seed = [
    { title: 'Configurar ambiente de desenvolvimento', description: 'Instalar dependências e subir os bancos via Docker.', status: 'CONCLUIDA', assigneeId: demo.id, dueDate: new Date(now - 3 * day), tags: ['setup', 'infra'], checklist: [{ text: 'Clonar repositório', done: true }, { text: 'docker compose up', done: true }, { text: 'Rodar migrations', done: true }] },
    { title: 'Implementar autenticação JWT', description: 'Registro e login com bcrypt + token.', status: 'EM_ANDAMENTO', assigneeId: demo.id, dueDate: new Date(now + 2 * day), tags: ['backend', 'auth'], checklist: [{ text: 'Endpoint de registro', done: true }, { text: 'Endpoint de login', done: true }, { text: 'Middleware de proteção', done: false }] },
    { title: 'Revisar PR do Kanban', description: 'Drag-and-drop com persistência de ordem.', status: 'PENDENTE', assigneeId: maria.id, dueDate: new Date(now - 1 * day), tags: ['review'], checklist: [] },
    { title: 'Escrever testes do backend', description: 'Cobrir auth e permissões de tarefas.', status: 'PENDENTE', assigneeId: demo.id, dueDate: new Date(now + 5 * day), tags: ['testes', 'qualidade'], checklist: [{ text: 'auth.service', done: false }, { text: 'tasks.service', done: false }] },
    { title: 'Ajustar layout responsivo', description: 'Sidebar como drawer no mobile.', status: 'CONCLUIDA', assigneeId: demo.id, dueDate: null, tags: ['frontend', 'ux'], checklist: [] },
    { title: 'Preparar deploy', description: 'Dockerfile do backend + pipeline de CI.', status: 'EM_ANDAMENTO', assigneeId: demo.id, dueDate: new Date(now + 7 * day), tags: ['devops'], checklist: [{ text: 'Dockerfile', done: true }, { text: 'GitHub Actions', done: true }, { text: 'Deploy em produção', done: false }] },
  ];

  let order = 1;
  for (const t of seed) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        order: order++,
        dueDate: t.dueDate,
        creatorId: demo.id,
        assigneeId: t.assigneeId,
      },
    });
    await TaskMetaModel.updateOne(
      { taskId: task.id },
      { $set: { tags: t.tags, checklist: t.checklist, activityLog: [{ action: 'criada', at: new Date() }] } },
      { upsert: true }
    );
  }

  console.log('Seed concluído. Login: demo@techx.com / demo123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoose.disconnect();
  });
