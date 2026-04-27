CREATE TABLE "MindMap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'space',
    "ownerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MindMapNode" (
    "id" TEXT NOT NULL,
    "mindMapId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "doodleDataUrl" TEXT,
    "sticker" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindMapNode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MindMapNode_mindMapId_idx" ON "MindMapNode"("mindMapId");
CREATE INDEX "MindMapNode_parentId_idx" ON "MindMapNode"("parentId");

ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_mindMapId_fkey" FOREIGN KEY ("mindMapId") REFERENCES "MindMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MindMapNode" ADD CONSTRAINT "MindMapNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MindMapNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;