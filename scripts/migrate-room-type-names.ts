/**
 * Migration script: Convert RoomType names from String to multilingual JSON
 *
 * Run with: npx ts-node scripts/migrate-room-type-names.ts
 * Or: npx tsx scripts/migrate-room-type-names.ts
 *
 * This script converts existing room type names from plain strings to
 * multilingual JSON objects: { en: "name", hu: "name", de: "name" }
 */

import prisma from '../src/lib/prisma';

async function migrateRoomTypeNames() {
  console.log('Starting RoomType name migration...');

  // Get all room types
  const roomTypes = await prisma.$queryRaw<Array<{ id: string; name: unknown }>>`
    SELECT id, name FROM room_types
  `;

  console.log(`Found ${roomTypes.length} room types to check`);

  let migrated = 0;
  let skipped = 0;

  for (const roomType of roomTypes) {
    const { id, name } = roomType;

    // Check if already migrated (is a JSON object with language keys)
    if (typeof name === 'object' && name !== null && ('en' in name || 'hu' in name || 'de' in name)) {
      console.log(`Skipping ${id}: already multilingual`);
      skipped++;
      continue;
    }

    // Convert string to multilingual JSON
    const stringName = typeof name === 'string' ? name : String(name);
    const multilingualName = {
      en: stringName,
      hu: stringName,
      de: stringName,
    };

    await prisma.roomType.update({
      where: { id },
      data: { name: multilingualName },
    });

    console.log(`Migrated ${id}: "${stringName}" -> multilingual`);
    migrated++;
  }

  console.log(`\nMigration complete!`);
  console.log(`- Migrated: ${migrated}`);
  console.log(`- Skipped (already multilingual): ${skipped}`);
}

migrateRoomTypeNames()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
