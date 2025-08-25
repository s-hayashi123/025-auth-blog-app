import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  return (
    <div className="container mx-auto p-4">
      <Link
        href="/post/new"
        className="bg-blue-500 text-white py-2 px-4 rounded inline-block mb-6 hover:bg-blue-700 cursor-pointer"
      >
        New Post
      </Link>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="p-4 border rounded-lg shadow">
            <h2 className="text-2xl font-bold">{post.title}</h2>
            <p className="text-gray-600">by {post.author.name || "Unknown"}</p>
            <p className="mt-2">{post.content?.substring(0, 150)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
