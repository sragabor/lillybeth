import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { deleteImage } from '@/lib/upload'

interface ImageInput {
  id?: string
  url: string
  filename?: string
}

// GET images for a room type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: roomTypeId } = await params

  try {
    const images = await prisma.roomTypeImage.findMany({
      where: { roomTypeId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

// POST create/update images (batch) - handles reordering and new uploads
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: roomTypeId } = await params

  try {
    const { images } = await request.json() as { images: ImageInput[] }

    // Get existing images to find which ones to delete
    const existingImages = await prisma.roomTypeImage.findMany({
      where: { roomTypeId },
    })

    const newImageIds = images.filter(img => img.id).map(img => img.id)
    const imagesToDelete = existingImages.filter(img => !newImageIds.includes(img.id))

    // Delete removed images from storage
    for (const img of imagesToDelete) {
      await deleteImage(img.url)
    }

    // Delete all existing image records
    await prisma.roomTypeImage.deleteMany({ where: { roomTypeId } })

    // Create new image records with updated order
    if (images && images.length > 0) {
      await prisma.roomTypeImage.createMany({
        data: images.map((image, index) => ({
          roomTypeId,
          url: image.url,
          filename: image.filename || '',
          order: index,
        })),
      })
    }

    const updatedImages = await prisma.roomTypeImage.findMany({
      where: { roomTypeId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ images: updatedImages })
  } catch (error) {
    console.error('Error updating images:', error)
    return NextResponse.json({ error: 'Failed to update images' }, { status: 500 })
  }
}

// DELETE a single image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageId } = await request.json()

    const image = await prisma.roomTypeImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete from storage
    await deleteImage(image.url)

    // Delete from database
    await prisma.roomTypeImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
