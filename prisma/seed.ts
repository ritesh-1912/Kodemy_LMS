import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 12);

  const instructor = await prisma.user.upsert({
    where: { email: "instructor@kodemy.com" },
    update: {},
    create: {
      email: "instructor@kodemy.com",
      name: "Hitesh Choudhary",
      passwordHash: hash,
      role: "INSTRUCTOR",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@kodemy.com" },
    update: {},
    create: {
      email: "student@kodemy.com",
      name: "Jane Student",
      passwordHash: hash,
      role: "STUDENT",
    },
  });

  const subject1 = await prisma.subject.upsert({
    where: { slug: "react-complete-guide" },
    update: {},
    create: {
      title: "React — The Complete Guide",
      slug: "react-complete-guide",
      description:
        "Learn React from scratch. Build modern web applications with hooks, context, routing, and more. Hands-on projects included.",
      category: "Web Development",
      price: 0,
      isPublished: true,
      instructorId: instructor.id,
      sections: {
        create: [
          {
            title: "Getting Started",
            orderIndex: 0,
            videos: {
              create: [
                {
                  title: "What is React?",
                  youtubeUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
                  orderIndex: 0,
                  durationSeconds: 600,
                },
                {
                  title: "Setting Up Your Dev Environment",
                  youtubeUrl: "https://www.youtube.com/watch?v=SqcY0GlETPk",
                  orderIndex: 1,
                  durationSeconds: 840,
                },
              ],
            },
          },
          {
            title: "Core Concepts",
            orderIndex: 1,
            videos: {
              create: [
                {
                  title: "Components and JSX",
                  // Replaced 9YkUCRPnHlo (often "Video unavailable")
                  youtubeUrl:
                    "https://www.youtube.com/watch?v=Ke90Tje7VS0",
                  orderIndex: 0,
                  durationSeconds: 1080,
                },
                {
                  title: "Props and State",
                  youtubeUrl: "https://www.youtube.com/watch?v=IYvD9oBCuJI",
                  orderIndex: 1,
                  durationSeconds: 1320,
                },
              ],
            },
          },
          {
            title: "Advanced Patterns",
            orderIndex: 2,
            videos: {
              create: [
                {
                  title: "Custom Hooks",
                  youtubeUrl: "https://www.youtube.com/watch?v=J-g9ZJha8FE",
                  orderIndex: 0,
                  durationSeconds: 900,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const subject2 = await prisma.subject.upsert({
    where: { slug: "nodejs-masterclass" },
    update: {},
    create: {
      title: "Node.js Masterclass",
      slug: "nodejs-masterclass",
      description:
        "Master Node.js and build scalable server-side applications. Covers Express, middleware, databases, auth, and deployment.",
      category: "Backend Development",
      price: 0,
      isPublished: true,
      instructorId: instructor.id,
      sections: {
        create: [
          {
            title: "Node.js Basics",
            orderIndex: 0,
            videos: {
              create: [
                {
                  title: "Introduction to Node.js",
                  youtubeUrl: "https://www.youtube.com/watch?v=TlB_eWDSMt4",
                  orderIndex: 0,
                  durationSeconds: 720,
                },
                {
                  title: "Modules and the File System",
                  youtubeUrl: "https://www.youtube.com/watch?v=ohIAiuHMKMI",
                  orderIndex: 1,
                  durationSeconds: 960,
                },
              ],
            },
          },
          {
            title: "Building APIs with Express",
            orderIndex: 1,
            videos: {
              create: [
                {
                  title: "Express Basics & Routing",
                  youtubeUrl: "https://www.youtube.com/watch?v=SccSCuHhOw0",
                  orderIndex: 0,
                  durationSeconds: 1200,
                },
              ],
            },
          },
        ],
      },
    },
  });

  const subject3 = await prisma.subject.upsert({
    where: { slug: "python-for-beginners" },
    update: {},
    create: {
      title: "Python for Absolute Beginners",
      slug: "python-for-beginners",
      description:
        "Start your coding journey with Python. Covers variables, loops, functions, OOP, and real projects.",
      category: "Data Science",
      price: 0,
      isPublished: true,
      instructorId: instructor.id,
      sections: {
        create: [
          {
            title: "Python Fundamentals",
            orderIndex: 0,
            videos: {
              create: [
                {
                  title: "Hello World & Variables",
                  youtubeUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
                  orderIndex: 0,
                  durationSeconds: 2700,
                },
                {
                  title: "Control Flow & Loops",
                  youtubeUrl: "https://www.youtube.com/watch?v=HBxCHonP6Ro",
                  orderIndex: 1,
                  durationSeconds: 1800,
                },
              ],
            },
          },
        ],
      },
    },
  });

  for (const subjectId of [subject1.id, subject2.id, subject3.id]) {
    await prisma.enrollment.upsert({
      where: { userId_subjectId: { userId: student.id, subjectId } },
      update: {},
      create: { userId: student.id, subjectId },
    });
  }

  // Fix known dead embeds for DBs seeded before URL updates
  await prisma.video.updateMany({
    where: { title: "Components and JSX" },
    data: {
      youtubeUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
    },
  });

  console.log("Seed done:", {
    instructor: instructor.email,
    student: student.email,
    subjects: [subject1.slug, subject2.slug, subject3.slug],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
