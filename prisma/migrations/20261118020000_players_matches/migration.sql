-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('MS', 'WS', 'MD', 'WD', 'XD');

-- CreateEnum
CREATE TYPE "MatchSide" AS ENUM ('a', 'b');

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "country" TEXT,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" UUID NOT NULL,
    "category" "Category" NOT NULL,
    "key" TEXT NOT NULL,
    "player1_id" UUID NOT NULL,
    "player2_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "category" "Category" NOT NULL,
    "tournament" TEXT NOT NULL,
    "round" TEXT,
    "played_on" DATE NOT NULL,
    "entry_a_id" UUID NOT NULL,
    "entry_b_id" UUID NOT NULL,
    "winner" "MatchSide" NOT NULL,
    "retired" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_games" (
    "match_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "score_a" INTEGER NOT NULL,
    "score_b" INTEGER NOT NULL,

    CONSTRAINT "match_games_pkey" PRIMARY KEY ("match_id","number")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_external_id_key" ON "players"("external_id");

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE UNIQUE INDEX "entries_key_key" ON "entries"("key");

-- CreateIndex
CREATE INDEX "entries_player1_id_idx" ON "entries"("player1_id");

-- CreateIndex
CREATE INDEX "entries_player2_id_idx" ON "entries"("player2_id");

-- CreateIndex
CREATE INDEX "matches_category_played_on_idx" ON "matches"("category", "played_on");

-- CreateIndex
CREATE INDEX "matches_entry_a_id_idx" ON "matches"("entry_a_id");

-- CreateIndex
CREATE INDEX "matches_entry_b_id_idx" ON "matches"("entry_b_id");

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_entry_a_id_fkey" FOREIGN KEY ("entry_a_id") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_entry_b_id_fkey" FOREIGN KEY ("entry_b_id") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

