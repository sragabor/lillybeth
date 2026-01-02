import { PrismaClient } from '../src/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// Create a PostgreSQL connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lillybeth.hu' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@lillybeth.hu',
      password: hashedPassword,
    },
  })

  console.log('Created admin user:', admin.email)
  console.log('Default password: admin123')
  console.log('')
  console.log('IMPORTANT: Change this password after first login!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
