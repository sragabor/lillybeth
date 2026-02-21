import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CartItem {
  roomTypeId: string;
  quantity: number;
  guestCount?: number;
}

interface AdditionalPriceInput {
  title: string;
  priceEur: number;
  quantity: number;
}

// Per-room selection: roomTypeId -> roomIndex -> priceId[]
interface PerRoomPriceSelection {
  [roomTypeId: string]: {
    [roomIndex: number]: string[];
  };
}

interface RoomBookingData {
  roomId: string;
  guestCount: number;
  totalAmount: number;
  additionalPrices: AdditionalPriceInput[];
}

// Helper to check if a date is weekend
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.guestName || !data.guestEmail || !data.checkIn || !data.checkOut || !data.items) {
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

    // Collect all room bookings data
    const roomBookings: RoomBookingData[] = [];
    let calculatedTotalAmount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildingAdditionalPrices: any[] = [];

    for (const item of items) {
      // Get room type with pricing and available rooms
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
          error: `Not enough rooms available`,
        }, { status: 400 });
      }

      // Create override map
      const overrideMap = new Map<string, number | null>();
      for (const override of roomType.calendarOverrides) {
        const dateKey = override.date.toISOString().split('T')[0];
        overrideMap.set(dateKey, override.price);
      }

      // Calculate accommodation price for this room type
      let roomTypeAccommodationTotal = 0;
      for (let i = 0; i < nights; i++) {
        const currentDate = new Date(checkIn);
        currentDate.setDate(currentDate.getDate() + i);
        const dateKey = currentDate.toISOString().split('T')[0];

        const overridePrice = overrideMap.get(dateKey);
        if (overridePrice !== undefined && overridePrice !== null) {
          roomTypeAccommodationTotal += overridePrice;
          continue;
        }

        for (const range of roomType.dateRangePrices) {
          if (currentDate >= range.startDate && currentDate <= range.endDate) {
            const price = isWeekend(currentDate) ? Number(range.weekendPrice) : Number(range.weekdayPrice);
            roomTypeAccommodationTotal += price;
            break;
          }
        }
      }

      const totalGuestCount = item.guestCount || (roomType.capacity * item.quantity);
      const guestsPerRoom = Math.ceil(totalGuestCount / item.quantity);
      const roomTypeSelections = perRoomSelections[item.roomTypeId] || {};

      // Create bookings for each room with per-room additional prices
      for (let roomIndex = 0; roomIndex < item.quantity; roomIndex++) {
        const room = availableRooms[roomIndex];
        const roomSelections = roomTypeSelections[roomIndex] || [];
        const roomAdditionalPrices: AdditionalPriceInput[] = [];

        // Room type-level additional prices (per room selection)
        for (const price of roomType.additionalPrices) {
          if (price.mandatory || roomSelections.includes(price.id)) {
            const titleObj = price.title as Record<string, string>;
            const title = titleObj?.en || titleObj?.hu || 'Additional fee';
            const nightMultiplier = price.perNight ? nights : 1;
            const guestMultiplier = price.perGuest ? guestsPerRoom : 1;
            const quantity = nightMultiplier * guestMultiplier;

            roomAdditionalPrices.push({
              title,
              priceEur: price.priceEur,
              quantity,
            });
          }
        }

        // Calculate total for this room
        const additionalTotal = roomAdditionalPrices.reduce((sum, p) => sum + p.priceEur * p.quantity, 0);
        const roomTotal = roomTypeAccommodationTotal + additionalTotal;

        roomBookings.push({
          roomId: room.id,
          guestCount: guestsPerRoom,
          totalAmount: roomTotal,
          additionalPrices: roomAdditionalPrices,
        });
        calculatedTotalAmount += roomTotal;
      }

      // Store building prices to be added to first booking only
      buildingAdditionalPrices.push(...roomType.building.additionalPrices);
    }

    // Process building-level prices once and add to the first booking
    const seenBuildingPriceIds = new Set<string>();
    const buildingPricesForFirstRoom: AdditionalPriceInput[] = [];
    const totalGuestCount = items.reduce((sum, item) => sum + (item.guestCount || item.quantity), 0);

    for (const price of buildingAdditionalPrices) {
      if (seenBuildingPriceIds.has(price.id)) continue;
      seenBuildingPriceIds.add(price.id);

      if (price.mandatory || selectedBuildingPriceIds.includes(price.id)) {
        const titleObj = price.title as Record<string, string>;
        const title = titleObj?.en || titleObj?.hu || 'Additional fee';
        const nightMultiplier = price.perNight ? nights : 1;
        const guestMultiplier = price.perGuest ? totalGuestCount : 1;
        const quantity = nightMultiplier * guestMultiplier;
        const total = price.priceEur * quantity;

        buildingPricesForFirstRoom.push({
          title,
          priceEur: price.priceEur,
          quantity,
        });
        calculatedTotalAmount += total;
      }
    }

    // Add building prices to first booking
    if (roomBookings.length > 0 && buildingPricesForFirstRoom.length > 0) {
      roomBookings[0].additionalPrices.push(...buildingPricesForFirstRoom);
      const buildingTotal = buildingPricesForFirstRoom.reduce((sum, p) => sum + p.priceEur * p.quantity, 0);
      roomBookings[0].totalAmount += buildingTotal;
    }

    // Determine if single or grouped booking
    const isSingleRoom = roomBookings.length === 1;

    if (isSingleRoom) {
      // Create single booking
      const roomData = roomBookings[0];

      const booking = await prisma.booking.create({
        data: {
          roomId: roomData.roomId,
          source: 'WEBSITE',
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone || null,
          guestCount: roomData.guestCount,
          checkIn,
          checkOut,
          arrivalTime: data.arrivalTime || null,
          status: 'INCOMING',
          paymentStatus: 'PENDING',
          notes: data.notes || null,
          totalAmount: roomData.totalAmount,
          additionalPrices: {
            create: roomData.additionalPrices.map((p) => ({
              title: p.title,
              priceEur: p.priceEur,
              quantity: p.quantity,
            })),
          },
        },
        include: {
          room: {
            include: {
              roomType: {
                include: {
                  building: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        type: 'single',
        bookingId: booking.id,
        totalAmount: calculatedTotalAmount,
      }, { status: 201 });
    } else {
      // Create booking group
      const group = await prisma.bookingGroup.create({
        data: {
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone || null,
          source: 'WEBSITE',
          checkIn,
          checkOut,
          arrivalTime: data.arrivalTime || null,
          notes: data.notes || null,
          status: 'INCOMING',
          paymentStatus: 'PENDING',
          calculatedTotalAmount,
          totalAmount: calculatedTotalAmount,
          hasCustomFinalAmount: false,
          bookings: {
            create: roomBookings.map((roomData) => ({
              roomId: roomData.roomId,
              guestCount: roomData.guestCount,
              guestName: data.guestName,
              guestEmail: data.guestEmail,
              guestPhone: data.guestPhone || null,
              source: 'WEBSITE',
              checkIn,
              checkOut,
              arrivalTime: data.arrivalTime || null,
              status: 'INCOMING',
              paymentStatus: 'PENDING',
              totalAmount: roomData.totalAmount,
              additionalPrices: {
                create: roomData.additionalPrices.map((p) => ({
                  title: p.title,
                  priceEur: p.priceEur,
                  quantity: p.quantity,
                })),
              },
            })),
          },
        },
        include: {
          bookings: {
            include: {
              room: {
                include: {
                  roomType: {
                    include: {
                      building: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        type: 'group',
        bookingGroupId: group.id,
        totalAmount: calculatedTotalAmount,
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
