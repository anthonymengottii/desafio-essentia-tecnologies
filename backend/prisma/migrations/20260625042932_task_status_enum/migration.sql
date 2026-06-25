/*
  Warnings:

  - You are about to drop the column `completed` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Task` DROP COLUMN `completed`,
    ADD COLUMN `status` ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA') NOT NULL DEFAULT 'PENDENTE';
