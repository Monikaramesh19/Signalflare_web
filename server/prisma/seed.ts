import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Reset database (optional/force delete)
  await prisma.auditLog.deleteMany({});
  await prisma.emergencyPhoto.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.resourceRequest.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.shelter.deleteMany({});
  await prisma.sOSRequest.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.rescueTeamMember.deleteMany({});
  await prisma.rescueTeam.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users (20 users)
  // Demo Accounts
  const victimDemo = await prisma.user.create({
    data: {
      email: 'victim@signalflare.demo',
      name: 'Rohan Sharma (Demo Victim)',
      phone: '9876543210',
      password: passwordHash,
      role: 'VICTIM',
    },
  });

  const volunteerDemo = await prisma.user.create({
    data: {
      email: 'volunteer@signalflare.demo',
      name: 'Priya Patel (Demo Volunteer)',
      phone: '9876543211',
      password: passwordHash,
      role: 'VOLUNTEER',
    },
  });

  const rescueDemo = await prisma.user.create({
    data: {
      email: 'rescue@signalflare.demo',
      name: 'Inspector Vijay (Demo Rescue)',
      phone: '9876543212',
      password: passwordHash,
      role: 'RESCUE',
    },
  });

  const adminDemo = await prisma.user.create({
    data: {
      email: 'admin@signalflare.demo',
      name: 'Admin Commander (Demo Admin)',
      phone: '9876543213',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  // More users (Total 20)
  // 10 Victims (including Rohan)
  const victims = [victimDemo];
  const victimNames = [
    'Amit Kumar', 'Sneha Reddy', 'Balaji Viswanathan', 'Karthik Raja',
    'Deepa Pillai', 'Manoj Swamy', 'Ananya Hegde', 'Rajesh Gupta', 'Lakshmi Narayanan'
  ];
  for (let i = 0; i < victimNames.length; i++) {
    const v = await prisma.user.create({
      data: {
        email: `victim${i + 1}@signalflare.demo`,
        name: victimNames[i],
        phone: `911223344${i}`,
        password: passwordHash,
        role: 'VICTIM',
      },
    });
    victims.push(v);
  }

  // 5 Volunteers (including Priya)
  const volunteers = [volunteerDemo];
  const volunteerNames = ['Suresh Raina', 'Meera Nair', 'Vikram Seth', 'Aditi Rao'];
  const volunteerSkills = [
    'First Aid, Swimming',
    'Driving, Heavy Vehicle Operations',
    'Cooking, Camp Management',
    'Medical Nursing, Trauma Relief'
  ];
  for (let i = 0; i < volunteerNames.length; i++) {
    const vol = await prisma.user.create({
      data: {
        email: `volunteer${i + 1}@signalflare.demo`,
        name: volunteerNames[i],
        phone: `922334455${i}`,
        password: passwordHash,
        role: 'VOLUNTEER',
      },
    });
    volunteers.push(vol);
  }

  // Set up Volunteer profiles
  const volunteerProfiles = [];
  const skillsList = ['Emergency coordination', ...volunteerSkills];
  for (let i = 0; i < volunteers.length; i++) {
    const vp = await prisma.volunteer.create({
      data: {
        userId: volunteers[i].id,
        status: i % 2 === 0 ? 'AVAILABLE' : 'BUSY',
        skills: skillsList[i],
        currentLat: 13.0827 + (Math.random() - 0.5) * 0.1,
        currentLng: 80.2707 + (Math.random() - 0.5) * 0.1,
      },
    });
    volunteerProfiles.push(vp);
  }

  // 3 Rescue Teams (and associated rescue users)
  const rescueUsers = [rescueDemo];
  const rescueNames = ['Officer Kumar', 'Officer Suresh', 'Officer Ramesh'];
  for (let i = 0; i < rescueNames.length; i++) {
    const ru = await prisma.user.create({
      data: {
        email: `rescue${i + 1}@signalflare.demo`,
        name: rescueNames[i],
        phone: `933445566${i}`,
        password: passwordHash,
        role: 'RESCUE',
      },
    });
    rescueUsers.push(ru);
  }

  const teamA = await prisma.rescueTeam.create({
    data: { name: 'Chennai Alpha Rescuers', status: 'ACTIVE', vehicleType: 'Speed Boat & Ambulance' },
  });
  const teamB = await prisma.rescueTeam.create({
    data: { name: 'Kochi Delta Rescuers', status: 'STANDBY', vehicleType: 'Helicopter & SUV' },
  });
  const teamC = await prisma.rescueTeam.create({
    data: { name: 'Madurai Beta Rescuers', status: 'ACTIVE', vehicleType: 'Truck & Lifesaver Gear' },
  });

  const rescueTeams = [teamA, teamB, teamC];

  // Map rescue members to team
  await prisma.rescueTeamMember.createMany({
    data: [
      { teamId: teamA.id, userId: rescueDemo.id },
      { teamId: teamA.id, userId: rescueUsers[1].id },
      { teamId: teamB.id, userId: rescueUsers[2].id },
      { teamId: teamC.id, userId: rescueUsers[3].id },
    ],
  });

  // 2. Shelters (10 Shelters)
  const cities = [
    { name: 'Chennai Central Shelter', lat: 13.0827, lng: 80.2707, addr: 'Central Railway Station Road, Chennai' },
    { name: 'Kanchipuram Temple Safehouse', lat: 12.8342, lng: 79.7036, addr: 'Sannathy Street, Kanchipuram' },
    { name: 'Chengalpattu Community Hall', lat: 12.6841, lng: 79.9836, addr: 'G.S.T Road, Chengalpattu' },
    { name: 'Tiruvallur Relief Block', lat: 13.1438, lng: 79.9077, addr: 'JN Road, Tiruvallur' },
    { name: 'Madurai College Shelter', lat: 9.9252, lng: 78.1198, addr: 'Alagar Kovil Road, Madurai' },
    { name: 'Coimbatore Corporation School', lat: 11.0168, lng: 76.9558, addr: 'Avinashi Road, Coimbatore' },
    { name: 'Chennai Beach Ground Camp', lat: 13.0427, lng: 80.2822, addr: 'Marina Beach Road, Chennai' },
    { name: 'Adyar Rescue Base', lat: 13.0063, lng: 80.2574, addr: 'Sardar Patel Road, Adyar, Chennai' },
    { name: 'Tambaram Transit Camp', lat: 12.9249, lng: 80.1240, addr: 'Velachery Main Road, Tambaram' },
    { name: 'Tiruvanmiyur Safety Center', lat: 12.9863, lng: 80.2598, addr: 'ECR Road, Tiruvanmiyur, Chennai' },
  ];

  const shelters = [];
  for (const city of cities) {
    const s = await prisma.shelter.create({
      data: {
        name: city.name,
        capacity: 100 + Math.floor(Math.random() * 200),
        occupied: 10 + Math.floor(Math.random() * 80),
        locationLat: city.lat,
        locationLng: city.lng,
        address: city.addr,
        contactPhone: '044-22334455',
      },
    });
    shelters.push(s);
  }

  // 3. Resources (Linked to Shelters)
  const resourceNames = ['Drinking Water', 'Non-Perishable Food Packets', 'First-Aid Kit', 'Blankets', 'Dry Medicines'];
  for (const shelter of shelters) {
    for (const name of resourceNames) {
      await prisma.resource.create({
        data: {
          name,
          description: `Emergency ${name} stockpile`,
          quantity: 200 + Math.floor(Math.random() * 500),
          unit: name.includes('Water') || name.includes('Food') ? 'packets' : 'units',
          locationLat: shelter.locationLat,
          locationLng: shelter.locationLng,
          shelterId: shelter.id,
        },
      });
    }
  }

  // 4. Emergency Events
  const floodEvent = await prisma.emergencyEvent.create({
    data: {
      title: 'Tamil Nadu Monsoon Flooding 2026',
      description: 'Severe monsoon flooding impacting low lying coastal regions, particularly in Chennai and surrounding Chengalpattu, Tiruvallur districts.',
      severity: 'CRITICAL',
      locationLat: 13.0827,
      locationLng: 80.2707,
      active: true,
    },
  });

  // 5. SOS Requests (15 Requests)
  const emergencyTypes = ['FLOOD', 'MEDICAL', 'FIRE', 'COLLAPSE', 'OTHER'];
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses = ['CREATED', 'RECEIVED', 'ASSIGNED', 'RESPONDER_ON_WAY', 'RESCUE_IN_PROGRESS', 'RESOLVED'];

  const sosRequests = [];
  for (let i = 0; i < 15; i++) {
    const victim = victims[i % victims.length];
    // Spread coordinates around Chennai/Indian regions
    const baseCity = cities[i % cities.length];
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;

    const requestStatus = statuses[i % statuses.length];
    const assignedTeam = requestStatus !== 'CREATED' && requestStatus !== 'RECEIVED' ? rescueTeams[i % rescueTeams.length] : null;
    const assignedVol = requestStatus === 'ASSIGNED' ? volunteerProfiles[i % volunteerProfiles.length] : null;

    const sos = await prisma.sOSRequest.create({
      data: {
        victimId: victim.id,
        responderTeamId: assignedTeam?.id,
        volunteerId: assignedVol?.id,
        emergencyType: emergencyTypes[i % emergencyTypes.length],
        severity: severities[i % severities.length],
        status: requestStatus,
        peopleCount: 1 + Math.floor(Math.random() * 6),
        locationLat: baseCity.lat + offsetLat,
        locationLng: baseCity.lng + offsetLng,
        address: `Block-${i + 1}, Near ${baseCity.name}, Tamil Nadu`,
        message: `Need urgent rescue. Water levels rising / family members injured. Please send help immediately.`,
        contactPhone: victim.phone,
      },
    });

    sosRequests.push(sos);

    // Photos
    await prisma.emergencyPhoto.create({
      data: {
        sosRequestId: sos.id,
        photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/><text x="10" y="50" fill="white">EMERGENCY</text></svg>',
      },
    });
  }

  // 6. Resource Requests (20 Requests)
  const reqSupplies = ['Drinking Water', 'Dry Rations', 'Insulin', 'Baby Formula', 'Sanitary Pads'];
  for (let i = 0; i < 20; i++) {
    const victim = victims[i % victims.length];
    const baseCity = cities[i % cities.length];
    const rStatus = i % 3 === 0 ? 'PENDING' : i % 3 === 1 ? 'APPROVED' : 'DELIVERED';
    const assignedVol = rStatus !== 'PENDING' ? volunteerProfiles[i % volunteerProfiles.length] : null;

    await prisma.resourceRequest.create({
      data: {
        victimId: victim.id,
        volunteerId: assignedVol?.id,
        resourceName: reqSupplies[i % reqSupplies.length],
        quantity: 1 + Math.floor(Math.random() * 5),
        status: rStatus,
        locationLat: baseCity.lat + (Math.random() - 0.5) * 0.02,
        locationLng: baseCity.lng + (Math.random() - 0.5) * 0.02,
        address: `Unit-${i + 1}, ${baseCity.addr}`,
        contactPhone: victim.phone,
      },
    });
  }

  // 7. Messages (20 messages)
  for (let i = 0; i < 20; i++) {
    const sender = victims[i % victims.length];
    const receiver = volunteers[i % volunteers.length];
    await prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        content: i % 2 === 0 ? 'Where are you now?' : 'I am on my way with the medicine pack.',
        isRead: i % 3 === 0,
      },
    });
  }

  // 8. Notifications (20 notifications)
  for (let i = 0; i < 20; i++) {
    const user = victims[i % victims.length];
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: i % 2 === 0 ? 'Rescue Dispatch Active' : 'Supply Request Approved',
        message: i % 2 === 0 ? 'Rescue team Alpha was dispatched.' : 'Your request for water was assigned to volunteer Priya.',
        type: i % 2 === 0 ? 'SOS_UPDATE' : 'RESOURCE_DELIVERED',
        isRead: i % 4 === 0,
      },
    });
  }

  // 9. Locations
  for (let i = 0; i < 10; i++) {
    const user = volunteers[i % volunteers.length];
    await prisma.location.create({
      data: {
        userId: user.id,
        lat: 13.0827 + (Math.random() - 0.5) * 0.05,
        lng: 80.2707 + (Math.random() - 0.5) * 0.05,
      },
    });
  }

  // 10. Audit Logs
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        userId: adminDemo.id,
        action: i % 3 === 0 ? 'LOGIN' : i % 3 === 1 ? 'UPDATE_SHELTER' : 'DISPATCH_TEAM',
        details: `Simulated system operation ${i + 1}`,
        ipAddress: '127.0.0.1',
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
