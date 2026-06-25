import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authenticate } from "../../middleware/auth";
import * as tasksController from "./tasks.controller";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(tasksController.list));
router.post("/", asyncHandler(tasksController.create));
router.get("/:id", asyncHandler(tasksController.getById));
router.put("/:id", asyncHandler(tasksController.update));
router.patch("/:id/complete", asyncHandler(tasksController.toggleComplete));
router.delete("/:id", asyncHandler(tasksController.remove));

export default router;
