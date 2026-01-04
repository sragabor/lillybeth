-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('MANUAL', 'WEBSITE', 'BOOKING_COM', 'SZALLAS_HU', 'AIRBNB');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('INCOMING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'DEPOSIT_PAID', 'FULLY_PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" JSONB,
    "cancellationPolicy" JSONB,
    "paymentMethods" JSONB,
    "depositInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "buildingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "house_rules" (
    "id" TEXT NOT NULL,
    "key" JSONB NOT NULL,
    "value" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "buildingId" TEXT NOT NULL,

    CONSTRAINT "house_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_amenity_categories" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "buildingId" TEXT NOT NULL,

    CONSTRAINT "building_amenity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_amenities" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "building_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "building_additional_prices" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "priceEur" DOUBLE PRECISION NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "perNight" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "buildingId" TEXT NOT NULL,

    CONSTRAINT "building_additional_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB,
    "capacity" INTEGER NOT NULL,
    "buildingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_type_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_amenity_categories" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roomTypeId" TEXT NOT NULL,

    CONSTRAINT "room_type_amenity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_amenities" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "room_type_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_additional_prices" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "priceEur" DOUBLE PRECISION NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "perNight" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "roomTypeId" TEXT NOT NULL,

    CONSTRAINT "room_type_additional_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_range_prices" (
    "id" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "weekdayPrice" DOUBLE PRECISION NOT NULL,
    "weekendPrice" DOUBLE PRECISION NOT NULL,
    "minNights" INTEGER NOT NULL DEFAULT 1,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_range_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_overrides" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "price" DOUBLE PRECISION,
    "minNights" INTEGER,
    "isInactive" BOOLEAN NOT NULL DEFAULT false,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "source" "BookingSource" NOT NULL DEFAULT 'MANUAL',
    "guestName" TEXT NOT NULL,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "guestCount" INTEGER NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'INCOMING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "totalAmount" DOUBLE PRECISION,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_additional_prices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceEur" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "booking_additional_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_overrides_roomTypeId_date_key" ON "calendar_overrides"("roomTypeId", "date");

-- AddForeignKey
ALTER TABLE "building_images" ADD CONSTRAINT "building_images_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "house_rules" ADD CONSTRAINT "house_rules_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_amenity_categories" ADD CONSTRAINT "building_amenity_categories_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_amenities" ADD CONSTRAINT "building_amenities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "building_amenity_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "building_additional_prices" ADD CONSTRAINT "building_additional_prices_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_images" ADD CONSTRAINT "room_type_images_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenity_categories" ADD CONSTRAINT "room_type_amenity_categories_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenities" ADD CONSTRAINT "room_type_amenities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "room_type_amenity_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_additional_prices" ADD CONSTRAINT "room_type_additional_prices_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_range_prices" ADD CONSTRAINT "date_range_prices_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_overrides" ADD CONSTRAINT "calendar_overrides_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_additional_prices" ADD CONSTRAINT "booking_additional_prices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
