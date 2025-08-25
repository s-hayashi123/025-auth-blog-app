"use server";

import { auth } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: User is not logged in.");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }

  await prisma.post.create({
    data: {
      title,
      content,
      authorId: session.user.id,
    },
  });

  revalidatePath("/");
  redirect("/");
}
