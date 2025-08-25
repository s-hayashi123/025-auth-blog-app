import { createPost } from "../../../../actions";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

export default async function NewPostPage() {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Post</h1>
      <form action={createPost} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-lg font-medium">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-lg font-medium">
            Content
          </label>
          <textarea
            name="content"
            id="content"
            rows={10}
            required
            className="w-full p-2 border rounded"
          ></textarea>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-700 cursor-pointer"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
