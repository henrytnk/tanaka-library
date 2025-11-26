import { prisma } from "./lib/prisma";

async function main() {
  const bookList = await prisma.book.findMany();
  console.log("✅ Fetched books:", bookList);

  console.log("Creating Mistborn trilogy...");

  const mistbornBooks = await prisma.book.createMany({
    data: [
      {
        title: "Mistborn: The Final Empire",
        author: "Brandon Sanderson",
        rating: 4,
        releasedYear: 2006,
        tags: ["fantasy", "mistborn"],
      },
      {
        title: "Mistborn: The Well of Ascension",
        author: "Brandon Sanderson",
        rating: 4,
        releasedYear: 2007,
        tags: ["fantasy", "mistborn"],
      },
      {
        title: "Mistborn: The Hero of Ages",
        author: "Brandon Sanderson",
        rating: 4,
        releasedYear: 2008,
        tags: ["fantasy", "mistborn"],
      },
    ],
  });

  console.log(`✅ Inserted Mistborn books: ${mistbornBooks.count}`);

  console.log("\nFetching books again (newest → oldest) including review...");
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { review: true },
  });

  console.log("\nBooks:", JSON.stringify(books, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
