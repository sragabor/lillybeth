import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'

interface ImageInput {
  url: string
}

// POST create/update images (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: buildingId } = await params

  try {
    const { images } = await request.json() as { images: ImageInput[] }

    // Delete existing images and recreate
    await prisma.buildingImage.deleteMany({ where: { buildingId } })

    if (images && images.length > 0) {
      await prisma.buildingImage.createMany({
        data: images.map((image, index) => ({
          buildingId,
          url: image.url,
          order: index,
        })),
      })
    }

    const updatedImages = await prisma.buildingImage.findMany({
      where: { buildingId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ images: updatedImages })
  } catch (error) {
    console.error('Error updating images:', error)
    return NextResponse.json({ error: 'Failed to update images' }, { status: 500 })
  }
}
