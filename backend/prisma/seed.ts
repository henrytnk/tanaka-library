import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample books
  const book1 = await prisma.book.create({
    data: {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      tags: ['fiction', 'classic', 'american'],
      rating: 4,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: '1984',
      author: 'George Orwell',
      tags: ['fiction', 'dystopian', 'classic'],
      rating: 4,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg'
    }
  });

  const book3 = await prisma.book.create({
    data: {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      tags: ['fiction', 'classic', 'southern'],
      rating: 4,
      coverUrl: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'
    }
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      bookId: book1.id,
      title: 'A Timeless Classic',
      body: 'Fitzgerald\'s prose is beautiful and the story remains relevant today. The exploration of the American Dream and its corruption is masterfully done.',
      rating: 5,
    }
  });

  await prisma.review.create({
    data: {
      bookId: book2.id,
      title: 'Eerily Prophetic',
      body: 'Orwell\'s vision of totalitarianism is more relevant now than ever. The concepts of doublethink and newspeak are particularly chilling.',
      rating: 5,
    }
  });

  console.log('✅ Created 3 books and 2 reviews');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });