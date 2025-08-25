import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  return (
    <div>
      <Link href="/post/new">New Post</Link>
      <div>
        {posts.map((post) => (
          <div key={post.id}>
            <h2>{post.title}</h2>
            <p>by {post.author.name || "Unknown"}</p>
            <p>{post.content?.substring(0, 150)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
