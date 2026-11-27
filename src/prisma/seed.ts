import bcrypt from "bcryptjs";
import { db } from "./db";

type PostType = "text" | "image" | "video";

interface SeedPostInput {
  authorUsername: string;
  type: PostType;
  content?: string;
  mediaUrl?: string;
  musicTitle?: string;
  likedByUsernames: string[];
  minutesAgo: number;
}

const legacyDemoVideoUrls = new Map([
  ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", "/videos/flower.mp4"],
  ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", "/videos/friday.mp4"],
  ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", "/videos/friday.mp4"],
  ["/videos/flower.webm", "/videos/friday.mp4"],
]);

async function main() {
  const defaultPasswordHash = await bcrypt.hash("SociaPass123!", 10);

  const usersData = [
    {
      fullName: "Rohan Deshmukh",
      email: "rohan.deshmukh@socia.app",
      username: "rohand",
      passwordHash: defaultPasswordHash,
      bio: "Mobile UI tinkerer & street photographer in Pune. Coffee before commits.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
      websiteUrl: "https://rohand.dev",
    },
    {
      fullName: "Meera Nair",
      email: "meera.nair@socia.app",
      username: "meeranair",
      passwordHash: defaultPasswordHash,
      bio: "Indie filmmaker, acoustic loop maker, and monsoon chaser.",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80",
      websiteUrl: "https://meeranair.studio",
    },
    {
      fullName: "Kabir Malhotra",
      email: "kabir.m@socia.app",
      username: "kabirm",
      passwordHash: defaultPasswordHash,
      bio: "Product designer building calm, thumb-friendly mobile tools.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&q=80",
      websiteUrl: null,
    },
    {
      fullName: "Ananya Iyer",
      email: "ananya.iyer@socia.app",
      username: "ananyai",
      passwordHash: defaultPasswordHash,
      bio: "Weekend runner, home barista, and bookshop wanderer.",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&q=80",
      websiteUrl: "https://ananyareads.in",
    },
    {
      fullName: "Vikramaditya Joshi",
      email: "vikram.joshi@socia.app",
      username: "vikramj",
      passwordHash: defaultPasswordHash,
      bio: "Full-stack builder sharing quick SQL & Next.js notes.",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&q=80",
      websiteUrl: "https://vikramj.me",
    },
    {
      fullName: "Zoya Khan",
      email: "zoya.khan@socia.app",
      username: "zoyak",
      passwordHash: defaultPasswordHash,
      bio: "Skater, synth collector, and late-night city walker.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&q=80",
      websiteUrl: null,
    },
  ];

  const userByUsername = new Map<string, { id: string; username: string }>();

  for (const userInput of usersData) {
    const existing = await db.orm.User.where({ username: userInput.username }).first();
    if (existing) {
      userByUsername.set(existing.username, { id: existing.id, username: existing.username });
    } else {
      const created = await db.orm.User.create(userInput);
      userByUsername.set(created.username, { id: created.id, username: created.username });
    }
  }

  const now = Date.now();
  const postsData: SeedPostInput[] = [
    {
      authorUsername: "rohand",
      type: "image",
      content: "Golden hour light cutting straight through the old arcade.",
      mediaUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=80",
      musicTitle: "Late Afternoon - Lo-Fi Tape",
      likedByUsernames: ["meeranair", "kabirm", "zoyak"],
      minutesAgo: 25,
    },
    {
      authorUsername: "meeranair",
      type: "video",
      content: "Rough cut from this morning's coastal rain test—no color grade yet.",
      mediaUrl: "/videos/flower.mp4",
      musicTitle: "Drizzle on Glass - Meera Nair",
      likedByUsernames: ["rohand", "ananyai", "vikramj", "zoyak"],
      minutesAgo: 50,
    },
    {
      authorUsername: "kabirm",
      type: "text",
      content:
        "Hot take for mobile feeds: if a primary action requires stretching your thumb to the top-left corner on a 6.7-inch phone, it's already friction.",
      likedByUsernames: ["vikramj", "rohand"],
      minutesAgo: 90,
    },
    {
      authorUsername: "ananyai",
      type: "image",
      content: "First pour-over after a 10k loop. Beans tasted like dark cacao.",
      mediaUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80",
      musicTitle: "Sunday Kettle - Acoustic Trio",
      likedByUsernames: ["kabirm", "meeranair"],
      minutesAgo: 140,
    },
    {
      authorUsername: "vikramj",
      type: "text",
      content:
        "Compound unique indexes in SQLite are undefeated for toggle endpoints—let the database reject duplicate likes instead of racing in memory.",
      likedByUsernames: ["rohand", "kabirm", "ananyai"],
      minutesAgo: 210,
    },
    {
      authorUsername: "zoyak",
      type: "video",
      content: "Testing a new analog pad loop before packing up for the night.",
      mediaUrl: "/videos/friday.mp4",
      musicTitle: "Midnight Bus 402 - Zoya Khan",
      likedByUsernames: ["meeranair", "rohand", "kabirm"],
      minutesAgo: 280,
    },
    {
      authorUsername: "rohand",
      type: "text",
      content: "Anyone else keep a running list of tiny UI micro-interactions they want to steal?",
      likedByUsernames: ["ananyai", "zoyak"],
      minutesAgo: 360,
    },
    {
      authorUsername: "meeranair",
      type: "image",
      content: "Location scouting near the old lighthouse—windy but worth the hike.",
      mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
      musicTitle: "Salt Air - Field Recording",
      likedByUsernames: ["rohand", "ananyai", "vikramj"],
      minutesAgo: 450,
    },
    {
      authorUsername: "ananyai",
      type: "text",
      content:
        "Finished two short-story collections this month. Reading on a train beats reading in bed every single time.",
      likedByUsernames: ["meeranair", "kabirm"],
      minutesAgo: 560,
    },
    {
      authorUsername: "vikramj",
      type: "image",
      content: "Desk setup before refactoring the feed pagination query.",
      mediaUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&q=80",
      musicTitle: "Terminal Hum - Synthwave",
      likedByUsernames: ["kabirm", "rohand"],
      minutesAgo: 720,
    },
    {
      authorUsername: "zoyak",
      type: "image",
      content: "Empty concrete bowl right after sunset.",
      mediaUrl: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=900&q=80",
      musicTitle: "Concrete Echoes - Dub Mix",
      likedByUsernames: ["rohand", "meeranair", "ananyai", "kabirm"],
      minutesAgo: 900,
    },
    {
      authorUsername: "kabirm",
      type: "video",
      content: "Quick motion check on bottom-sheet spring damping at 60fps.",
      mediaUrl: "/videos/friday.mp4",
      musicTitle: "Spring Physics - Beat Loop",
      likedByUsernames: ["vikramj", "zoyak"],
      minutesAgo: 1100,
    },
  ];

  for (const postInput of postsData) {
    const author = userByUsername.get(postInput.authorUsername);
    if (!author) {
      throw new Error(`Missing seeded author: ${postInput.authorUsername}`);
    }

    const createdAt = new Date(now - postInput.minutesAgo * 60 * 1000);

    const existingPosts = await db.orm.Post.where({ authorId: author.id }).all();
    const existingPost = existingPosts.find(
      (candidate: { type?: string; content?: string | null }) =>
        candidate.type === postInput.type && candidate.content === (postInput.content ?? null)
    );
    const replacementUrl = existingPost ? legacyDemoVideoUrls.get(existingPost.mediaUrl ?? "") : undefined;
    const post = existingPost
      ? replacementUrl
        ? await db.orm.Post.where({ id: existingPost.id }).update({ mediaUrl: replacementUrl })
        : existingPost
      : await db.orm.Post.create({
          authorId: author.id,
          type: postInput.type,
          content: postInput.content ?? null,
          mediaUrl: postInput.mediaUrl ?? null,
          musicTitle: postInput.musicTitle ?? null,
          createdAt,
        });
    if (!post) {
      throw new Error(`Could not save seeded post: ${postInput.content ?? "(empty content)"}`);
    }

    for (const likerUsername of postInput.likedByUsernames) {
      const liker = userByUsername.get(likerUsername);
      if (!liker) {
        throw new Error(`Missing seeded liker: ${likerUsername}`);
      }

      const existingLike = await db.orm.PostLike.where({
        userId: liker.id,
        postId: post.id,
      }).first();

      if (!existingLike) {
        await db.orm.PostLike.create({
          userId: liker.id,
          postId: post.id,
        });
      }
    }
  }

  console.log("Seeded Socia users, posts, and likes.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
