import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.ship.createMany({
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());