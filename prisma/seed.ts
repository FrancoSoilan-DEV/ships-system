import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Ships ──────────────────────────────────────────────────
  await prisma.ship.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'MV Asunción Star',
        flag: 'PY',
        type: 'CONTAINER',
        status: 'AVAILABLE',
        yearBuilt: 2018,
        capacityTeu: 2400,
        maxWeightTons: 35000,
        basePrice: 4200,
        totalNauticalMiles: 120000,
      },
      {
        name: 'MV Paraná Trader',
        flag: 'PY',
        type: 'BULK_CARRIER',
        status: 'AVAILABLE',
        yearBuilt: 2015,
        capacityTeu: 0,
        maxWeightTons: 52000,
        basePrice: 3100,
        totalNauticalMiles: 280000,
      },
      {
        name: 'MV Iguazú Frost',
        flag: 'PY',
        type: 'REEFER',
        status: 'AVAILABLE',
        yearBuilt: 2020,
        capacityTeu: 800,
        maxWeightTons: 12000,
        basePrice: 5800,
        totalNauticalMiles: 45000,
      },
      {
        name: 'MV Gran Chaco',
        flag: 'PY',
        type: 'TANKER',
        status: 'AVAILABLE',
        yearBuilt: 2016,
        capacityTeu: 0,
        maxWeightTons: 80000,
        basePrice: 6500,
        totalNauticalMiles: 310000,
      },
      {
        name: 'MV Cerro Corá Heavy',
        flag: 'PY',
        type: 'HEAVY_LIFT',
        status: 'MAINTENANCE',
        yearBuilt: 2012,
        capacityTeu: 0,
        maxWeightTons: 25000,
        basePrice: 7200,
        totalNauticalMiles: 520000,
      },
    ],
  });
  console.log('✅ Ships created');

  // ── Users ──────────────────────────────────────────────────
  const superadminHash = await bcrypt.hash('super123', 10);
  const adminHash      = await bcrypt.hash('admin123', 10);
  const captainHash    = await bcrypt.hash('captain123', 10);
  const clientHash     = await bcrypt.hash('client123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@ships.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@ships.com',
      password: superadminHash,
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ships.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ships.com',
      password: adminHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  const captain = await prisma.user.upsert({
    where: { email: 'captain@ships.com' },
    update: {},
    create: {
      name: 'Captain Rodriguez',
      email: 'captain@ships.com',
      password: captainHash,
      role: 'CAPTAIN',
    },
  });
  console.log('✅ Captain created:', captain.email);

  // Crear perfil de capitán
  await prisma.captain.upsert({
    where: { userId: captain.id },
    update: {},
    create: {
      userId: captain.id,
      licenseNumber: 'CAP-2024-001',
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@ships.com' },
    update: {},
    create: {
      name: 'Client User',
      email: 'client@ships.com',
      password: clientHash,
      role: 'CLIENT',
    },
  });
  console.log('✅ Client created:', client.email);

  // Crear perfil de cliente
  await prisma.client.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
    },
  });

  console.log('\n🎉 Seed completado!');
  console.log('─────────────────────────────');
  console.log('superadmin@ships.com / super123');
  console.log('admin@ships.com      / admin123');
  console.log('captain@ships.com    / captain123');
  console.log('client@ships.com     / client123');
  console.log('─────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());