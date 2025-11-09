import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  console.log('👤 Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const controllerPassword = await bcrypt.hash('controller123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
    },
  });

  const controller = await prisma.user.upsert({
    where: { username: 'controller' },
    update: {},
    create: {
      username: 'controller',
      passwordHash: controllerPassword,
      fullName: 'Station Controller',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Created users: ${admin.username}, ${controller.username}`);

  // Create gas stations
  console.log('⛽ Creating gas stations...');
  const station1 = await prisma.gasStation.create({
    data: {
      name: 'Makpetrol Aerodrom',
      location: 'Aerodrom, Skopje',
      status: 'ACTIVE',
    },
  });

  const station2 = await prisma.gasStation.create({
    data: {
      name: 'OKTA Avtoput',
      location: 'Avtoput, Skopje',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Created stations: ${station1.name}, ${station2.name}`);

  // Create pumps for station 1
  console.log('⛽ Creating pumps...');
  const pump1 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      pumpNumber: 1,
      mainRfidTag: 'MAIN-TAG-001',
      status: 'LOCKED',
      expectedChildTags: {
        create: [
          { tagId: 'CHILD-001-A', description: 'Top seal' },
          { tagId: 'CHILD-001-B', description: 'Middle seal' },
          { tagId: 'CHILD-001-C', description: 'Bottom seal' },
        ],
      },
    },
  });

  const pump2 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      pumpNumber: 2,
      mainRfidTag: 'MAIN-TAG-002',
      status: 'LOCKED',
      expectedChildTags: {
        create: [
          { tagId: 'CHILD-002-A', description: 'Top seal' },
          { tagId: 'CHILD-002-B', description: 'Middle seal' },
          { tagId: 'CHILD-002-C', description: 'Bottom seal' },
          { tagId: 'CHILD-002-D', description: 'Door seal' },
        ],
      },
    },
  });

  const pump3 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      pumpNumber: 3,
      mainRfidTag: 'MAIN-TAG-003',
      status: 'LOCKED',
      expectedChildTags: {
        create: [
          { tagId: 'CHILD-003-A', description: 'Top seal' },
          { tagId: 'CHILD-003-B', description: 'Bottom seal' },
        ],
      },
    },
  });

  // Create pumps for station 2
  const pump4 = await prisma.pump.create({
    data: {
      stationId: station2.id,
      pumpNumber: 1,
      mainRfidTag: 'MAIN-TAG-004',
      status: 'LOCKED',
      expectedChildTags: {
        create: [
          { tagId: 'CHILD-004-A', description: 'Top seal' },
          { tagId: 'CHILD-004-B', description: 'Middle seal' },
          { tagId: 'CHILD-004-C', description: 'Bottom seal' },
        ],
      },
    },
  });

  console.log(`✅ Created ${4} pumps with expected child tags`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
