import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createPost } from "../../../../actions";
import { redirect } from "next/navigation";

export default async function NewPostPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div>
      <h1>Create New Post</h1>
      <form action={createPost}>
        <div>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" required />
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea name="content" id="content" rows={10} required></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
