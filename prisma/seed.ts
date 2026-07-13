import { PrismaClient, Tariff } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── 1. Ships ───────────────────────────────────────────────
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

  const ships = await prisma.ship.findMany();
  const shipByName = (name: string) => ships.find((s) => s.name === name)!;

  // ── 2. Users (Superadmin, Admin, Captains, Client) ─────────
  const superadminHash = await bcrypt.hash('super123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const captainHash = await bcrypt.hash('captain123', 10);
  const clientHash = await bcrypt.hash('client123', 10);

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

  // Dos capitanes: uno con barco asignado (Asunción Star), otro sin barco
  const captainUser = await prisma.user.upsert({
    where: { email: 'captain@ships.com' },
    update: {},
    create: {
      name: 'Captain Rodriguez',
      email: 'captain@ships.com',
      password: captainHash,
      role: 'CAPTAIN',
    },
  });
  console.log('✅ Captain created:', captainUser.email);

  const captainNoShipUser = await prisma.user.upsert({
    where: { email: 'captain2@ships.com' },
    update: {},
    create: {
      name: 'Captain Benitez',
      email: 'captain2@ships.com',
      password: captainHash,
      role: 'CAPTAIN',
    },
  });
  console.log('✅ Captain (sin barco) created:', captainNoShipUser.email);

  const captain = await prisma.captain.upsert({
    where: { userId: captainUser.id },
    update: {},
    create: {
      userId: captainUser.id,
      licenseNumber: 'CAP-2024-001',
    },
  });

  await prisma.captain.upsert({
    where: { userId: captainNoShipUser.id },
    update: {},
    create: {
      userId: captainNoShipUser.id,
      licenseNumber: 'CAP-2024-002',
    },
  });

  // Asignar Captain Rodriguez al MV Asunción Star
  const asuncionStar = shipByName('MV Asunción Star');
  await prisma.ship.update({
    where: { id: asuncionStar.id },
    data: { captainId: captain.id },
  });
  console.log('✅ Captain Rodriguez asignado a MV Asunción Star');

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@ships.com' },
    update: {},
    create: {
      name: 'Client User',
      email: 'client@ships.com',
      password: clientHash,
      role: 'CLIENT',
    },
  });
  console.log('✅ Client created:', clientUser.email);

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      companyName: 'Exportadora del Este S.A.',
      phone: '+595 981 000 000',
      country: 'PY',
    },
  });

  // ── 3. Crew members (tripulación de cada barco) ────────────
  const crewData = [
    // MV Asunción Star
    { shipName: 'MV Asunción Star', name: 'Diego Martínez', role: 'Chief Engineer', nationality: 'PY' },
    { shipName: 'MV Asunción Star', name: 'Laura Fernández', role: 'First Officer', nationality: 'PY' },
    { shipName: 'MV Asunción Star', name: 'Carlos Duarte', role: 'Sailor', nationality: 'PY' },
    { shipName: 'MV Asunción Star', name: 'Miguel Torres', role: 'Cook', nationality: 'AR' },
    // MV Paraná Trader
    { shipName: 'MV Paraná Trader', name: 'Ricardo Gómez', role: 'Chief Engineer', nationality: 'PY' },
    { shipName: 'MV Paraná Trader', name: 'Ana Benítez', role: 'Sailor', nationality: 'BR' },
    // MV Iguazú Frost
    { shipName: 'MV Iguazú Frost', name: 'Pedro Cáceres', role: 'Refrigeration Technician', nationality: 'PY' },
    { shipName: 'MV Iguazú Frost', name: 'Sofía Ayala', role: 'Sailor', nationality: 'PY' },
    // MV Gran Chaco
    { shipName: 'MV Gran Chaco', name: 'Jorge Villalba', role: 'Chief Engineer', nationality: 'AR' },
    { shipName: 'MV Gran Chaco', name: 'Elena Ríos', role: 'Safety Officer', nationality: 'PY' },
  ];

  for (const c of crewData) {
    const ship = shipByName(c.shipName);
    const exists = await prisma.crewMember.findFirst({
      where: { shipId: ship.id, name: c.name },
    });
    if (!exists) {
      await prisma.crewMember.create({
        data: {
          name: c.name,
          role: c.role,
          nationality: c.nationality,
          shipId: ship.id,
        },
      });
    }
  }
  console.log('✅ Crew members created');

  // ── 4. Tariffs (reglas de precio base por combinación) ─────
  const tariffsData = [
    {
      name: 'Contenedor General — Regional',
      shipType: 'CONTAINER' as const,
      shipTypeMultiplier: 1.0,
      cargoType: 'GENERAL' as const,
      cargoMultiplier: 1.0,
      destinationRegion: 'South America',
      distanceMultiplier: 1.15,
    },
    {
      name: 'Contenedor a Europa — Hazardous',
      shipType: 'CONTAINER' as const,
      shipTypeMultiplier: 1.0,
      cargoType: 'HAZARDOUS' as const,
      cargoMultiplier: 1.6,
      destinationRegion: 'Europe',
      distanceMultiplier: 2.1,
    },
    {
      name: 'Granelero — Carga a granel',
      shipType: 'BULK_CARRIER' as const,
      shipTypeMultiplier: 1.1,
      cargoType: 'BULK' as const,
      cargoMultiplier: 1.1,
      destinationRegion: 'South America',
      distanceMultiplier: 1.2,
    },
    {
      name: 'Tanquero Internacional',
      shipType: 'TANKER' as const,
      shipTypeMultiplier: 1.3,
      cargoType: 'HAZARDOUS' as const,
      cargoMultiplier: 1.6,
      destinationRegion: 'North America',
      distanceMultiplier: 1.75,
    },
    {
      name: 'Frigorífico Refrigerada — Regional',
      shipType: 'REEFER' as const,
      shipTypeMultiplier: 1.5,
      cargoType: 'REFRIGERATED' as const,
      cargoMultiplier: 1.4,
      destinationRegion: 'South America',
      distanceMultiplier: 1.15,
    },
  ];

  const tariffs: Tariff[] = [];
  for (const t of tariffsData) {
    const existing = await prisma.tariff.findFirst({
      where: { shipType: t.shipType, cargoType: t.cargoType, destinationRegion: t.destinationRegion },
    });
    const tariff = existing ?? (await prisma.tariff.create({ data: t }));
    tariffs.push(tariff);
  }
  console.log('✅ Tariffs created');

  // ── 5. Voyages + Cargo (historial de ejemplo) ──────────────
  const voyagesData = [
    {
      shipName: 'MV Asunción Star',
      tariff: tariffs[0],
      origin: 'Asunción, PY',
      destination: 'Buenos Aires, AR',
      country: 'AR',
      region: 'South America',
      durationDays: 5,
      distanceKm: 1500,
      status: 'COMPLETED' as const,
      daysAgoDeparture: 20,
      cargo: { type: 'GENERAL' as const, weightTons: 8000, teuCount: 400 },
    },
    {
      shipName: 'MV Asunción Star',
      tariff: tariffs[1],
      origin: 'Santos, BR',
      destination: 'Rotterdam, NL',
      country: 'NL',
      region: 'Europe',
      durationDays: 22,
      distanceKm: 11000,
      status: 'IN_PROGRESS' as const,
      daysAgoDeparture: 3,
      cargo: { type: 'HAZARDOUS' as const, weightTons: 15000, teuCount: 900 },
    },
    {
      shipName: 'MV Paraná Trader',
      tariff: tariffs[2],
      origin: 'Asunción, PY',
      destination: 'Montevideo, UY',
      country: 'UY',
      region: 'South America',
      durationDays: 8,
      distanceKm: 2100,
      status: 'COMPLETED' as const,
      daysAgoDeparture: 45,
      cargo: { type: 'BULK' as const, weightTons: 40000, teuCount: 0 },
    },
    {
      shipName: 'MV Gran Chaco',
      tariff: tariffs[3],
      origin: 'Buenos Aires, AR',
      destination: 'Houston, US',
      country: 'US',
      region: 'North America',
      durationDays: 16,
      distanceKm: 8600,
      status: 'SCHEDULED' as const,
      daysAgoDeparture: -7,
      cargo: { type: 'HAZARDOUS' as const, weightTons: 60000, teuCount: 0 },
    },
    {
      shipName: 'MV Iguazú Frost',
      tariff: tariffs[4],
      origin: 'Asunción, PY',
      destination: 'Santos, BR',
      country: 'BR',
      region: 'South America',
      durationDays: 6,
      distanceKm: 1800,
      status: 'CANCELLED' as const,
      daysAgoDeparture: 10,
      cargo: { type: 'REFRIGERATED' as const, weightTons: 6000, teuCount: 350 },
    },
  ];

  for (const v of voyagesData) {
    const ship = shipByName(v.shipName);

    const existing = await prisma.voyage.findFirst({
      where: { shipId: ship.id, origin: v.origin, destination: v.destination, clientId: client.id },
    });
    if (existing) continue;

    const departureAt = new Date();
    departureAt.setDate(departureAt.getDate() - v.daysAgoDeparture);
    const arrivalAt = new Date(departureAt);
    arrivalAt.setDate(arrivalAt.getDate() + v.durationDays);

    const distanceMultiplier = 1 + v.distanceKm / 10000;
    const finalCost =
      ship.basePrice * v.durationDays * v.tariff.shipTypeMultiplier * v.tariff.cargoMultiplier * distanceMultiplier;

    const voyage = await prisma.voyage.create({
      data: {
        origin: v.origin,
        destination: v.destination,
        country: v.country,
        region: v.region,
        durationDays: v.durationDays,
        status: v.status,
        departureAt,
        arrivalAt,
        finalCost: Math.round(finalCost * 100) / 100,
        shipId: ship.id,
        clientId: client.id,
        tariffId: v.tariff.id,
      },
    });

    await prisma.cargo.create({
      data: {
        type: v.cargo.type,
        weightTons: v.cargo.weightTons,
        teuCount: v.cargo.teuCount,
        voyageId: voyage.id,
      },
    });

    if (v.status === 'COMPLETED') {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          totalVoyages: { increment: 1 },
          totalSpent: { increment: voyage.finalCost },
        },
      });
    }
  }
  console.log('✅ Voyages + Cargo created');

  // ── 6. Maintenance record (sin el campo `type`, que no existe
  //       en el modelo Maintenance) ───────────────────────────
  const cerroCora = shipByName('MV Cerro Corá Heavy');
  const existingMaintenance = await prisma.maintenance.findFirst({
    where: { shipId: cerroCora.id },
  });
  if (!existingMaintenance) {
    await prisma.maintenance.create({
      data: {
        description: 'Revisión general de motores y casco',
        performedAt: new Date(),
        nextDueAt: (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 6);
          return d;
        })(),
        cost: 45000,
        notes: 'Mantenimiento programado por antigüedad de la embarcación (2012).',
        shipId: cerroCora.id,
      },
    });
  }
  console.log('✅ Maintenance record created');

  // ── 7. Escalation job de ejemplo (para probar el panel admin) ──
  const existingEscalation = await prisma.escalationJob.findFirst({
    where: { reason: 'Cliente solicita descuento por volumen en contrato anual' },
  });
  if (!existingEscalation) {
    const session = await prisma.chatSession.create({
      data: {
        type: 'AI_AGENT',
        status: 'ESCALATED',
        visitorName: 'Empresa Importadora S.A.',
        visitorEmail: 'compras@importadora.com',
        messages: {
          create: [
            { content: 'Hola, quiero cotizar 12 viajes anuales a Europa.', isFromAI: false },
            { content: 'Con gusto te ayudo. ¿Podrías darme más detalles del tipo de carga?', isFromAI: true },
            { content: 'Necesito un descuento especial por volumen, ¿es posible?', isFromAI: false },
          ],
        },
      },
    });

    await prisma.escalationJob.create({
      data: {
        sessionId: session.id,
        reason: 'Cliente solicita descuento por volumen en contrato anual',
        status: 'PENDING',
      },
    });
  }
  console.log('✅ Escalation job created');

  console.log('\n🎉 Seed completado!');
  console.log('─────────────────────────────────────');
  console.log('superadmin@ships.com  / super123');
  console.log('admin@ships.com       / admin123');
  console.log('captain@ships.com     / captain123  (con barco: MV Asunción Star)');
  console.log('captain2@ships.com    / captain123  (sin barco asignado)');
  console.log('client@ships.com      / client123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());