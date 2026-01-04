import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { LocalizedText } from '@/lib/i18n'
import { Prisma } from '@/generated/prisma'

interface HouseRuleInput {
  key: LocalizedText
  value: LocalizedText
}

// POST create/update house rules (batch)
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
    const { rules } = await request.json() as { rules: HouseRuleInput[] }

    // Delete existing rules and recreate
    await prisma.houseRule.deleteMany({ where: { buildingId } })

    if (rules && rules.length > 0) {
      await prisma.houseRule.createMany({
        data: rules.map((rule, index) => ({
          buildingId,
          key: rule.key as Prisma.InputJsonValue,
          value: rule.value as Prisma.InputJsonValue,
          order: index,
        })),
      })
    }

    const updatedRules = await prisma.houseRule.findMany({
      where: { buildingId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ rules: updatedRules })
  } catch (error) {
    console.error('Error updating house rules:', error)
    return NextResponse.json({ error: 'Failed to update house rules' }, { status: 500 })
  }
}
