-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "photoURL" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "referralCode" TEXT NOT NULL,
    "referredById" INTEGER,
    "planId" INTEGER,
    "walletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OttSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OttSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "levelCount" INTEGER NOT NULL,
    "levelPercentages" TEXT NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoPool" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "entryFee" DECIMAL(65,30) NOT NULL,
    "matrixWidth" INTEGER NOT NULL DEFAULT 3,
    "matrixDepth" INTEGER NOT NULL DEFAULT 3,
    "reward" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "AutoPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoPoolEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "poolId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutoPoolEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "token" TEXT NOT NULL DEFAULT 'USDT',
    "network" TEXT NOT NULL DEFAULT 'BSC',
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "txHash" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slab" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_txHash_key" ON "PaymentIntent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_userId_slab_key" ON "Milestone"("userId", "slab");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OttSubscription" ADD CONSTRAINT "OttSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoPoolEntry" ADD CONSTRAINT "AutoPoolEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoPoolEntry" ADD CONSTRAINT "AutoPoolEntry_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "AutoPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoPoolEntry" ADD CONSTRAINT "AutoPoolEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AutoPoolEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
