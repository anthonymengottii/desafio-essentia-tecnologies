import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();

router.use(authenticate);

// Lista todos os usuários (para atribuição de tarefas).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  })
);

export default router;
