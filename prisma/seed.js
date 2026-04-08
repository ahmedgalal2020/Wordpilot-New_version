import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'student@wordpilot.app';

  await prisma.savedText.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      fullName: 'Julian Sterling',
      email,
      passwordHash: 'demo-password',
      sessions: {
        create: [
          { dateLabel: 'Oct 24, 2023', title: 'Modern Economics Vol I', language: 'English', score: 96 },
          { dateLabel: 'Oct 22, 2023', title: 'Philosophical Meditations', language: 'German', score: 89 },
          { dateLabel: 'Oct 19, 2023', title: 'Advanced Biology Notes', language: 'English', score: 92 }
        ]
      },
      savedTexts: {
        create: [
          { title: 'The Great Gatsby - Ch 1', level: 'C1', category: 'Literary Narrative', icon: 'book' },
          { title: 'World War II Overview', level: 'B2', category: 'Historical Non-fiction', icon: 'history' }
        ]
      }
    }
  });

  console.log(`Seeded user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
