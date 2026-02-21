import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CartItem {
  roomTypeId: string;
  quantity: number;
  guestCount?: number;
}

interface AdditionalPriceOption {
  id: string;
  title: Record<string, string>;
  priceEur: number;
  mandatory: boolean;
  perNight: boolean;
  perGuest: boolean;
  origin: 'building' | 'roomType';
  roomTypeId?: string;
}

// Per-room selection: roomTypeId -> roomIndex -> priceId[]
interface PerRoomPriceSelection {
  [roomTypeId: string]: {
    [roomIndex: number]: string[];
  };
}

interface RoomPriceBreakdown {
  roomTypeId: string;
  roomTypeName: Record<string, string> | string;
  accommodationName: Record<string, string> | string;
  quantity: number;
  nightlyPrices: { date: string; price: number }[];
  accommodationTotal: number;
  pricePerRoom: number;
  roomTypeAdditionalPrices: AdditionalPriceOption[];
  availableAdditionalPrices: AdditionalPriceOption[];
  roomIds: string[];
}

// Helper to check if a date is weekend (Friday or Saturday night)
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.checkIn || !data.checkOut || !data.items || !Array.isArray(data.items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const items: CartItem[] = data.items;
    const selectedBuildingPriceIds: string[] = data.selectedBuildingPriceIds || [];
    const perRoomSelections: PerRoomPriceSelection = data.perRoomSelections || {};

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const roomBreakdowns: RoomPriceBreakdown[] = [];
    let grandAccommodationTotal = 0;
    const allAdditionalPrices: AdditionalPriceOption[] = [];
    const seenPriceIds = new Set<string>();

    for (const item of items) {
      // Get room type with pricing and rooms
      const roomType = await prisma.roomType.findUnique({
        where: { id: item.roomTypeId },
        include: {
          building: {
            include: {
              additionalPrices: { orderBy: { order: 'asc' } },
            },
          },
          additionalPrices: { orderBy: { order: 'asc' } },
          dateRangePrices: {
            where: {
              startDate: { lte: checkOut },
              endDate: { gte: checkIn },
            },
            orderBy: { startDate: 'asc' },
          },
          calendarOverrides: {
            where: {
              date: {
                gte: checkIn,
                lt: checkOut,
              },
            },
          },
          rooms: {
            where: { isActive: true },
            include: {
              bookings: {
                where: {
                  status: { notIn: ['CANCELLED'] },
                  OR: [
                    {
                      checkIn: { lt: checkOut },
                      checkOut: { gt: checkIn },
                    },
                  ],
                },
              },
            },
          },
        },
      });

      if (!roomType) {
        return NextResponse.json({ error: `Room type not found: ${item.roomTypeId}` }, { status: 404 });
      }

      // Find available rooms
      const availableRooms = roomType.rooms.filter((room) => room.bookings.length === 0);
      if (availableRooms.length < item.quantity) {
        return NextResponse.json({
          error: `Not enough rooms available for ${typeof roomType.name === 'object' ? (roomType.name as Record<string, string>).en : roomType.name}`,
        }, { status: 400 });
      }

      // Create override map
      const overrideMap = new Map<string, number | null>();
      for (const override of roomType.calendarOverrides) {
        const dateKey = override.date.toISOString().split('T')[0];
        overrideMap.set(dateKey, override.price);
      }

      // Calculate nightly prices
      const nightlyPrices: { date: string; price: number }[] = [];
      for (let i = 0; i < nights; i++) {
        const currentDate = new Date(checkIn);
        currentDate.setDate(currentDate.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0];

        // Check for override
        const overridePrice = overrideMap.get(dateKey);
        if (overridePrice !== undefined && overridePrice !== null) {
          nightlyPrices.push({ date: dateKey, price: overridePrice });
          continue;
        }

        // Check date range prices
        let priceFound = false;
        for (const range of roomType.dateRangePrices) {
          if (currentDate >= range.startDate && currentDate <= range.endDate) {
            const price = isWeekend(currentDate) ? Number(range.weekendPrice) : Number(range.weekdayPrice);
            nightlyPrices.push({ date: dateKey, price });
            priceFound = true;
            break;
          }
        }

        if (!priceFound) {
          nightlyPrices.push({ date: dateKey, price: 0 });
        }
      }

      const pricePerRoom = nightlyPrices.reduce((sum, n) => sum + n.price, 0);
      const roomAccommodationTotal = pricePerRoom * item.quantity;
      grandAccommodationTotal += roomAccommodationTotal;

      // Get room IDs to book
      const roomIds = availableRooms.slice(0, item.quantity).map((r) => r.id);

      // Collect additional prices
      const roomAdditionalPrices: AdditionalPriceOption[] = [];
      const roomTypeAdditionalPrices: AdditionalPriceOption[] = [];

      // Building-level additional prices (global, shown once)
      for (const price of roomType.building.additionalPrices) {
        if (!seenPriceIds.has(price.id)) {
          seenPriceIds.add(price.id);
          const priceOption: AdditionalPriceOption = {
            id: price.id,
            title: price.title as Record<string, string>,
            priceEur: price.priceEur,
            mandatory: price.mandatory,
            perNight: price.perNight,
            perGuest: price.perGuest,
            origin: 'building',
          };
          allAdditionalPrices.push(priceOption);
          roomAdditionalPrices.push(priceOption);
        }
      }

      // Room type-level additional prices (per-room)
      for (const price of roomType.additionalPrices) {
        const priceOption: AdditionalPriceOption = {
          id: price.id,
          title: price.title as Record<string, string>,
          priceEur: price.priceEur,
          mandatory: price.mandatory,
          perNight: price.perNight,
          perGuest: price.perGuest,
          origin: 'roomType',
          roomTypeId: item.roomTypeId,
        };
        roomTypeAdditionalPrices.push(priceOption);
        // Also add to global list for reference
        allAdditionalPrices.push(priceOption);
        roomAdditionalPrices.push(priceOption);
      }

      roomBreakdowns.push({
        roomTypeId: item.roomTypeId,
        roomTypeName: roomType.name as Record<string, string> | string,
        accommodationName: roomType.building.name as Record<string, string> | string,
        quantity: item.quantity,
        nightlyPrices,
        accommodationTotal: roomAccommodationTotal,
        pricePerRoom,
        roomTypeAdditionalPrices,
        availableAdditionalPrices: roomAdditionalPrices,
        roomIds,
      });
    }

    // Calculate total guest count
    const totalGuestCount = items.reduce((sum, item) => sum + (item.guestCount || item.quantity), 0);

    // Calculate additional prices total
    let additionalTotal = 0;
    const selectedAdditionalPrices: {
      id: string;
      title: Record<string, string>;
      priceEur: number;
      quantity: number;
      total: number;
      origin: 'building' | 'roomType';
      roomTypeId?: string;
      roomIndex?: number;
    }[] = [];

    // Process building-level prices (apply once globally)
    const buildingPrices = allAdditionalPrices.filter(p => p.origin === 'building');
    for (const price of buildingPrices) {
      if (price.mandatory || selectedBuildingPriceIds.includes(price.id)) {
        const nightMultiplier = price.perNight ? nights : 1;
        const guestMultiplier = price.perGuest ? totalGuestCount : 1;
        const quantity = nightMultiplier * guestMultiplier;
        const total = price.priceEur * quantity;

        selectedAdditionalPrices.push({
          id: price.id,
          title: price.title,
          priceEur: price.priceEur,
          quantity,
          total,
          origin: 'building',
        });

        additionalTotal += total;
      }
    }

    // Process room-type-level prices (apply per room based on selection)
    for (const breakdown of roomBreakdowns) {
      const roomTypeId = breakdown.roomTypeId;
      const roomTypeSelections = perRoomSelections[roomTypeId] || {};
      const roomTypePrices = breakdown.roomTypeAdditionalPrices;

      // Get guest count per room for this room type
      const itemGuestCount = items.find(i => i.roomTypeId === roomTypeId)?.guestCount || breakdown.quantity;
      const guestsPerRoom = Math.ceil(itemGuestCount / breakdown.quantity);

      for (let roomIndex = 0; roomIndex < breakdown.quantity; roomIndex++) {
        const roomSelections = roomTypeSelections[roomIndex] || [];

        for (const price of roomTypePrices) {
          if (price.mandatory || roomSelections.includes(price.id)) {
            const nightMultiplier = price.perNight ? nights : 1;
            const guestMultiplier = price.perGuest ? guestsPerRoom : 1;
            const quantity = nightMultiplier * guestMultiplier;
            const total = price.priceEur * quantity;

            selectedAdditionalPrices.push({
              id: price.id,
              title: price.title,
              priceEur: price.priceEur,
              quantity,
              total,
              origin: 'roomType',
              roomTypeId,
              roomIndex,
            });

            additionalTotal += total;
          }
        }
      }
    }

    return NextResponse.json({
      nights,
      roomBreakdowns,
      accommodationTotal: grandAccommodationTotal,
      availableAdditionalPrices: allAdditionalPrices,
      selectedAdditionalPrices,
      additionalTotal,
      grandTotal: grandAccommodationTotal + additionalTotal,
    });
  } catch (error) {
    console.error('Error calculating booking price:', error);
    return NextResponse.json({ error: 'Failed to calculate price' }, { status: 500 });
  }
}
