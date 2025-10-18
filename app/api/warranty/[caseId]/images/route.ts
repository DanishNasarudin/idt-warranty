import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// GET - Fetch all images for a warranty case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = parseInt((await params).caseId);
    if (isNaN(caseId)) {
      return NextResponse.json({ error: "Invalid case ID" }, { status: 400 });
    }

    // Fetch all files for this case
    const caseFiles = await prisma.warrantyCaseFile.findMany({
      where: { caseId },
      include: {
        file: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        file: {
          createdAt: "desc",
        },
      },
    });

    const images = caseFiles.map((cf: any) => ({
      id: cf.file.id,
      fileName: cf.file.fileName,
      mimeType: cf.file.mimeType,
      sizeBytes: cf.file.sizeBytes,
      createdAt: cf.file.createdAt,
      url: `/api/warranty/images/${cf.file.id}`,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST - Upload a new image for a warranty case
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = parseInt((await params).caseId);
    if (isNaN(caseId)) {
      return NextResponse.json({ error: "Invalid case ID" }, { status: 400 });
    }

    // Verify the case exists
    const warrantyCase = await prisma.warrantyCase.findUnique({
      where: { id: caseId },
    });

    if (!warrantyCase) {
      return NextResponse.json(
        { error: "Warranty case not found" },
        { status: 404 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPEG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to WebP and compress using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85 }) // Adjust quality as needed (0-100)
      .toBuffer();

    // Calculate SHA256 hash to detect duplicates
    const hash = createHash("sha256").update(webpBuffer).digest("hex");

    // Check if file with same hash already exists
    let fileStore = await prisma.fileStore.findUnique({
      where: { sha256: hash },
    });

    if (!fileStore) {
      // Create new file store entry
      fileStore = await prisma.fileStore.create({
        data: {
          fileName: file.name.replace(/\.[^/.]+$/, "") + ".webp", // Replace extension with .webp
          mimeType: "image/webp",
          sizeBytes: webpBuffer.length,
          sha256: hash,
          url: "", // Will be updated after we know the ID
          data: webpBuffer,
        },
      });

      // Update the URL with the file ID
      fileStore = await prisma.fileStore.update({
        where: { id: fileStore.id },
        data: {
          url: `/api/warranty/images/${fileStore.id}`,
        },
      });
    }

    // Link the file to the warranty case (if not already linked)
    await prisma.warrantyCaseFile.upsert({
      where: {
        caseId_fileId: {
          caseId,
          fileId: fileStore.id,
        },
      },
      create: {
        caseId,
        fileId: fileStore.id,
      },
      update: {}, // Do nothing if already exists
    });

    return NextResponse.json({
      success: true,
      image: {
        id: fileStore.id,
        fileName: fileStore.fileName,
        mimeType: fileStore.mimeType,
        sizeBytes: fileStore.sizeBytes,
        url: fileStore.url,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
