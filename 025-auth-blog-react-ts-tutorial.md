# 【Next.js & Prisma】NextAuth.jsで作る！認証付きブログ開発チュートリアル (025)

![完成形デモ](https://storage.googleapis.com/gemini-prod/images/2024/05/15/auth_blog_demo.gif)

## 🚀 はじめに (The "Why")

おめでとうございます！あなたは今、Web開発者として次のレベルへ進むための扉の前に立っています。このチュートリアルでは、これまでに作成した静的なブログを、**ユーザーがログインし、記事を投稿できる動的なフルスタックWebアプリケーション**へと進化させます。

この課題を乗り越えれば、あなたは単に情報を表示するだけのサイトではなく、ユーザーとインタラクションする、より価値の高いサービスを開発する力を手に入れることができます。

### ✨ このチュートリアルで得られること

1.  **本格的な認証機能:** `NextAuth.js`を使い、GoogleやGitHubアカウントを利用した安全なログイン機能を驚くほど簡単に追加する方法を学びます。
2.  **データベースとの対話:** `Prisma`というモダンなORM（Object-Relational Mapper）を使い、TypeScriptの型安全性を保ったまま、データベース（今回はSupabaseのPostgreSQL）を自在に操作するスキルを習得します。
3.  **モダンなフルスタック開発:** Next.js App Routerの強力な機能「**Server Actions**」を使い、フロントエンドからバックエンドの処理をシームレスに呼び出す、最先端の開発スタイルを体験します。
4.  **本番環境へのデプロイ知識:** ローカル環境と本番環境の違いを学び、開発したアプリをVercelにデプロイして公開するまでの一連の流れを理解します。

このチュートリアルは挑戦的ですが、その分得られるものも絶大です。一つ一つのステップを確実にこなし、フルスタックエンジニアとしての大きな一歩を踏み出しましょう！

---

## 🛠 環境構築

このプロジェクトは複数のサービスを連携させるため、環境構築が少し複雑になります。焦らず、一つずつ進めていきましょう。

### 1. Next.jsプロジェクト作成

```bash
npx create-next-app@latest --typescript --tailwind --eslint your-auth-blog
cd your-auth-blog
```

### 2. Supabaseでデータベース準備

a. [Supabase](https://supabase.com/)にサインアップし、新しいプロジェクトを作成します。
b. プロジェクトのダッシュボードで、`Settings` > `Database` に移動します。
c. `Connection string` の下にある `URI` をコピーします。これがデータベースの接続情報です。

### 3. Prismaのセットアップ

a. 必要なライブラリをインストールします。
```bash
npm install prisma --save-dev
npm install @prisma/client
```
b. Prismaを初期化します。
```bash
npx prisma init
```
c. このコマンドにより、`.env`ファイルと`prisma/schema.prisma`ファイルが作成されます。

### 4. NextAuth.jsのセットアップ

必要なライブラリをインストールします。
```bash
npm install next-auth @auth/prisma-adapter
```

### 5. GitHub OAuthアプリの作成【重要: 本番環境対応】

a. [GitHub](https://github.com/)にログインし、`Settings` > `Developer settings` > `OAuth Apps` > `New OAuth App` に進みます。

b. **ローカル環境と本番環境の両方に対応するため、以下のように設定します。**
    - **Application name:** 任意（例: My Auth Blog）
    - **Homepage URL:** `http://localhost:3000`
        - *本番デプロイ後は、そのURL（例: `https://your-app-name.vercel.app`）に変更することを推奨します。*
    - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
        - **【最重要ポイント】** ここには**ローカル開発用のURL**を設定します。本番環境のURLは後ほど「デプロイ」のセクションで追加します。

c. アプリを登録し、`Client ID`をコピーします。`Generate a new client secret`をクリックして`Client Secret`も生成し、コピーしておきます。

### 6. 環境変数ファイル `.env.local` の作成

プロジェクトのルートに`.env`ファイルを**`.env.local`という名前に変更（または新規作成）**し、以下の内容を貼り付けます。

```.env.local
# Prisma
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[HOST]/postgres"

# GitHub OAuth Provider
GITHUB_CLIENT_ID="YOUR_GITHUB_CLIENT_ID"
GITHUB_CLIENT_SECRET="YOUR_GITHUB_CLIENT_SECRET"

# NextAuth.js
# openssl rand -base64 32 コマンドなどで生成したランダムな文字列
NEXTAUTH_SECRET="YOUR_RANDOM_SECRET" 
# ローカル環境のURL
NEXTAUTH_URL="http://localhost:3000"
```

**🤔 なぜ `.env.local` なのか？**
`.env.local`という名前のファイルは、Next.jsの規約で「環境変数をロードするが、Gitの管理下には含めない」という特別な扱われ方をします。APIキーやパスワードなどの秘密情報を含むため、`.gitignore`に最初から記載されており、誤ってGitHubにプッシュしてしまう事故を防げます。

---

## 👨‍💻【最重要】超詳細なステップバイステップ開発手順

### Step 1: Prismaでデータベースの「設計図」を作る

**🎯 このステップのゴール:**
アプリケーションで必要となるデータの構造（ユーザー、投稿など）を`schema.prisma`ファイルに定義します。

**💡 The How: 具体的なコード**

`prisma/schema.prisma`ファイルの内容を以下のように書き換えます。

```prisma:prisma/schema.prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ユーザーモデル
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  posts         Post[]    // ユーザーは複数の投稿を持つ (リレーション)
}

// 投稿モデル
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id]) // 投稿は一人のユーザーに属する
  authorId  String
}

// --- 以下はNextAuth.jsが使用するモデル --- 

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **ORMとは？:** PrismaはORMの一種で、`model User {...}`のようなJavaScript/TypeScriptライクな構文でデータベースのテーブル構造を定義できます。これにより、SQLを直接書かなくても、型安全なコードでデータベースを操作できます。
-   **リレーション:** `@relation`ディレクティブを使い、`User`と`Post`の間の関連（「一人のユーザーが複数の投稿を持つ」）を定義しています。これにより、`prisma.user.findUnique({ where: { id }, include: { posts: true } })` のように、関連するデータを簡単に取得できます。
-   **NextAuth.js用モデル:** `Account`, `Session`, `VerificationToken`は、`@auth/prisma-adapter`がユーザーのログイン情報やセッションをデータベースに保存するために必要なモデルです。公式ドキュメントからコピーして貼り付ければOKです。

### Step 2: データベースにテーブルを作成する (マイグレーション)

**🎯 このステップのゴール:**
Step 1で作成した設計図（スキーマ）を、実際のSupabaseデータベースに反映させます。

**💡 The How: 具体的なコマンド**

ターミナルで以下のコマンドを実行します。

```bash
npx prisma migrate dev --name init
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **マイグレーションとは？:** データベースの構造変更を記録し、適用するプロセスです。`prisma migrate dev`コマンドは、現在のスキーマと前回のスキーマの差分を検出し、その差分を適用するためのSQLファイルを自動生成し、データベースに対して実行してくれます。
-   **`--name init`:** このマイグレーションに`init`（初期化）という名前をつけています。
-   **確認:** コマンドが成功したら、Supabaseのダッシュボードで`Table Editor`を開いてみてください。`User`や`Post`などのテーブルが作成されているのが確認できるはずです。

### Step 3: NextAuth.jsの認証APIをセットアップする

**🎯 このステップのゴール:**
ユーザー認証を処理する中心的なAPIエンドポイントを構築します。

**💡 The How: 具体的なコード**

1.  `lib`フォルダに`prisma.ts`を作成し、PrismaClientのインスタンスを生成するコードを書きます。（開発環境でのインスタンス増加を防ぐための定石です）
    ```typescript:lib/prisma.ts
    import { PrismaClient } from '@prisma/client';

    const prisma = global.prisma || new PrismaClient();

    if (process.env.NODE_ENV === 'development') global.prisma = prisma;

    export default prisma;
    ```

2.  `app/api/auth/[...nextauth]/route.ts`というパスにファイルを作成し、以下のコードを記述します。

    ```typescript:app/api/auth/[...nextauth]/route.ts
    import NextAuth from 'next-auth';
    import GitHub from 'next-auth/providers/github';
    import { PrismaAdapter } from '@auth/prisma-adapter';
    import prisma from '@/lib/prisma';

    export const { handlers, auth, signIn, signOut } = NextAuth({
      adapter: PrismaAdapter(prisma),
      providers: [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
      ],
      secret: process.env.NEXTAUTH_SECRET,
    });
    ```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`[...nextauth]`:** これはNext.jsの「キャッチオール（全てを捕まえる）ルート」です。`signIn`, `signOut`, `callback`など、NextAuth.jsが必要とする複数のURL（例: `/api/auth/signin`, `/api/auth/callback/github`）へのリクエストを、このファイル一つで処理してくれます。
-   **`PrismaAdapter(prisma)`:** これが魔法の1行です。これを設定するだけで、NextAuth.jsはユーザーがOAuthでログインした際に、そのユーザー情報（名前、メール、アイコン画像など）を自動的にPrisma経由でデータベースの`User`テーブルや`Account`テーブルに保存・更新してくれます。
-   **`providers: [GitHub(...)]`:** ここに認証方法を追加していきます。今回はGitHubプロバイダを設定し、`.env.local`からクライアントIDとシークレットを読み込んでいます。Googleや他のプロバイダを追加したければ、ここに追記していくだけです。

### Step 4: ログイン・ログアウト機能をUIに実装する

**🎯 このステップのゴール:**
ヘッダーに、ユーザーのログイン状態に応じて「ログイン」または「ログアウト」ボタンを表示します。

**💡 The How: 具体的なコード**

1.  `app/layout.tsx`を修正し、NextAuth.jsのセッション情報にアクセスできるようにします。
    ```tsx:app/layout.tsx
    import { auth } from '@/app/api/auth/[...nextauth]/route';
    import Header from '@/components/Header'; // 後で作成

    export default async function RootLayout({ children }: { children: React.ReactNode }) {
      const session = await auth(); // サーバーサイドでセッションを取得
      return (
        <html lang="ja">
          <body>
            <Header session={session} /> {/* ヘッダーにセッションを渡す */}
            <main>{children}</main>
          </body>
        </html>
      );
    }
    ```

2.  `components`フォルダを作成し、`Header.tsx`を作成します。
    ```tsx:components/Header.tsx
    import { Session } from 'next-auth';
    import Link from 'next/link';
    import SignInButton from './SignInButton'; // 後で作成
    import SignOutButton from './SignOutButton'; // 後で作成

    export default function Header({ session }: { session: Session | null }) {
      return (
        <header className="bg-gray-800 text-white p-4">
          <nav className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">Auth Blog</Link>
            <div>
              {session ? (
                <div className="flex items-center gap-4">
                  <p>Welcome, {session.user?.name}</p>
                  <SignOutButton />
                </div>
              ) : (
                <SignInButton />
              )}
            </div>
          </nav>
        </header>
      );
    }
    ```

3.  `components/SignInButton.tsx`と`components/SignOutButton.tsx`を作成します。これらは **クライアントコンポーネント** です。
    ```tsx:components/SignInButton.tsx
    'use client';
    import { signIn } from 'next-auth/react';

    export default function SignInButton() {
      return <button onClick={() => signIn('github')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign In with GitHub</button>;
    }
    ```
    ```tsx:components/SignOutButton.tsx
    'use client';
    import { signOut } from 'next-auth/react';

    export default function SignOutButton() {
      return <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Sign Out</button>;
    }
    ```

**🤔 The Why: なぜ、それが必要なのか？**

-   **サーバーでのセッション取得:** `layout.tsx`はサーバーコンポーネントなので、`await auth()`を直接呼び出すことで、レンダリング前にセッション情報を取得できます。
-   **クライアントでのアクション:** `signIn`や`signOut`はユーザーのクリックイベントに応じて実行されるため、クライアントサイドのJavaScriptが必要です。そのため、ボタンコンポーネントは`'use client'`を宣言したクライアントコンポーネントにする必要があります。
-   **`signIn('github')`:** 引数にプロバイダ名（`route.ts`で設定したもの）を渡すことで、そのプロバイダの認証フローを開始します。GitHubのログインページにリダイレクトされるはずです。

**動作確認:**
`npm run dev`でアプリを起動し、ヘッダーの「Sign In」ボタンをクリックしてみてください。GitHubの認証画面に飛ばされ、許可するとアプリにリダイレクトされ、ヘッダーにあなたのGitHub名が表示されれば成功です！Supabaseの`User`テーブルにもあなたの情報が追加されているはずです。

### Step 5: Server Actionで記事を投稿する

**🎯 このステップのゴール:**
ログインしているユーザーだけがアクセスできるページを作成し、そこからデータベースに新しい記事を投稿できるようにします。

**💡 The How: 具体的なコード**

1.  `actions.ts`というファイルをプロジェクトルートに作成します。
    ```typescript:actions.ts
    'use server';

    import { auth } from '@/app/api/auth/[...nextauth]/route';
    import prisma from '@/lib/prisma';
    import { revalidatePath } from 'next/cache';
    import { redirect } from 'next/navigation';

    export async function createPost(formData: FormData) {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error('Unauthorized: User is not logged in.');
      }

      const title = formData.get('title') as string;
      const content = formData.get('content') as string;

      if (!title || !content) {
        throw new Error('Title and content are required.');
      }

      await prisma.post.create({
        data: {
          title,
          content,
          authorId: session.user.id,
        },
      });

      revalidatePath('/'); // ホームページのキャッシュを無効化
      redirect('/'); // ホームページにリダイレクト
    }
    ```

2.  記事作成ページ`app/posts/new/page.tsx`を作成します。
    ```tsx:app/posts/new/page.tsx
    import { auth } from "@/app/api/auth/[...nextauth]/route";
    import { createPost } from "@/actions";
    import { redirect } from "next/navigation";

    export default async function NewPostPage() {
      const session = await auth();
      if (!session) {
        redirect("/api/auth/signin"); // ログインしてなければサインインページへ
      }

      return (
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">Create New Post</h1>
          <form action={createPost} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-lg font-medium">Title</label>
              <input type="text" id="title" name="title" required className="w-full p-2 border rounded" />
            </div>
            <div>
              <label htmlFor="content" className="block text-lg font-medium">Content (Markdown)</label>
              <textarea id="content" name="content" rows={10} required className="w-full p-2 border rounded"></textarea>
            </div>
            <button type="submit" className="bg-green-500 text-white py-2 px-4 rounded">Submit</button>
          </form>
        </div>
      );
    }
    ```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`'use server'`:** ファイルの先頭にこれを書くことで、エクスポートされた全ての関数が「Server Action」になります。クライアントコンポーネントからでも安全に呼び出せるサーバーサイドの関数です。
-   **`form action={createPost}`:** これがServer Actionの魔法です。`form`の`action`属性に関数を直接渡すだけで、フォームが送信されると、その関数がサーバーサイドで実行されます。`fetch`やAPI Routeを手動で書く必要はありません。
-   **認可チェック:** `createPost`の冒頭で`session`をチェックすることで、ログインしているユーザーだけが記事を投稿できる、という「認可」ロジックを実装しています。
-   **`revalidatePath('/')`:** 記事を投稿した後、記事一覧ページ（ホームページ）の表示を最新の状態に更新する必要があります。これを呼び出すと、Next.jsはそのページのキャッシュを破棄し、次にアクセスがあったときに再レンダリング（DBから最新のデータを再取得）します。
-   **`redirect('/')`:** 処理が終わったら、ユーザーをホームページにリダイレクトさせます。

### Step 6: データベースから記事一覧を表示する

**🎯 このステップのゴール:**
ホームページを、ローカルのファイルではなく、データベースに保存されている投稿の一覧を表示するように変更します。

**💡 The How: 具体的なコード**

`app/page.tsx`を以下のように書き換えます。

```tsx:app/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: true }, // 著者の情報も一緒に取得
  });

  return (
    <div className="container mx-auto p-4">
      <Link href="/posts/new" className="bg-blue-500 text-white py-2 px-4 rounded inline-block mb-6">New Post</Link>
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="p-4 border rounded-lg shadow">
            <h2 className="text-2xl font-bold">{post.title}</h2>
            <p className="text-gray-600">by {post.author.name || 'Unknown'}</p>
            <p className="mt-2">{post.content?.substring(0, 150)}...</p>
            {/* 詳細ページは挑戦課題！ */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**🤔 The Why: なぜ、それが必要なのか？**

-   **`prisma.post.findMany(...)`:** Prisma Clientを使い、`Post`テーブルから全てのレコードを取得します。`orderBy`で作成日時の降順（新しいものが上）に並べ替え、`include: { author: true }`でリレーションを辿って投稿者の情報も一緒に取得しています。
-   **サーバーコンポーネントの強み:** `HomePage`はサーバーコンポーネントなので、`async`にしてトップレベルで`await prisma...`のようにデータベースに直接アクセスできます。これにより、データ取得のロジックが非常にシンプルになります。

---

## 🚀 Vercelへのデプロイと本番環境の注意点

おめでとうございます！ローカル環境でアプリケーションが動作したら、いよいよ世界に公開しましょう。ここでは、Next.jsと相性の良い**Vercel**へのデプロイ方法と、本番環境で注意すべき点を解説します。

### 1. Vercelプロジェクトの作成

a. [Vercel](https://vercel.com/)にGitHubアカウントでサインアップします。
b. ダッシュボードで「Add New...」>「Project」を選択し、作成したGitHubリポジトリをインポートします。
c. フレームワークプリセットで「Next.js」が自動で選択されていることを確認します。

### 2. 環境変数の設定

**【最重要】** `.env.local`ファイルはGitリポジトリに含まれていないため、Vercelはこれらの変数を知りません。手動で設定する必要があります。

a. プロジェクト設定画面の「Environment Variables」セクションを開きます。
b. `.env.local`に記述した**4つの変数**（`DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXTAUTH_SECRET`）を一つずつ追加します。
c. **`NEXTAUTH_URL`** の値は、ローカル用の`http://localhost:3000`から、**Vercelが自動で生成する本番URL**に変更します。URLはプロジェクトのダッシュボードで確認できます（例: `https://your-app-name.vercel.app`）。

### 3. GitHub OAuthアプリのコールバックURLを更新

a. [GitHubのOAuth App設定ページ](https://github.com/settings/developers)に戻ります。
b. 「Authorization callback URL」の「Add URI」をクリックし、**本番用のコールバックURL**を追加します。
    - 例: `https://your-app-name.vercel.app/api/auth/callback/github`
c. これで、あなたのアプリはローカル環境と本番環境の両方でGitHubログインができるようになります。

### 4. デプロイ！

環境変数の設定が終わったら、「Deploy」ボタンをクリックします。Vercelが自動でビルドとデプロイを実行します。

### 5. 本番データベースへのマイグレーション

デプロイが完了しても、本番用のデータベースはまだ空っぽです。Vercelの環境で`prisma migrate`コマンドを実行する必要があります。

a. Vercel CLIをインストールします: `npm i -g vercel`
b. プロジェクトにログインします: `vercel login`
c. プロジェクトをリンクします: `vercel link`
d. **本番環境用のコマンドを実行します:**
   ```bash
   vercel env pull .env.vercel.production
   npx prisma migrate deploy --schema=./prisma/schema.prisma
   ```
   `prisma migrate deploy`は、本番環境でマイグレーションを適用するためのコマンドです。

これで、本番環境のセットアップは完了です！あなたのアプリケーションが世界中の誰からでもアクセスできるようになりました。

---

## 💎 深掘りコラム (Deep Dive)

### 認証 (Authentication) vs 認可 (Authorization)

この二つの言葉は似ていますが、意味は全く異なります。

-   **認証 (Authentication / Authn):** **「あなたは誰ですか？」** を確認するプロセスです。今回のチュートリアルでは、NextAuth.jsがGitHubのログイン情報を元に「このユーザーはSatoshi Hayashiさんです」と確認する部分がこれにあたります。

-   **認可 (Authorization / Authz):** **「あなたに何をする権限がありますか？」** を確認するプロセスです。Server Actionの中で`if (!session) { ... }`とチェックしたり、「ログインユーザーIDと投稿の`authorId`が一致する場合のみ削除を許可する」といったロジックがこれにあたります。

NextAuth.jsは「認証」の大部分を自動化してくれますが、「認可」はアプリケーションの要件に合わせて開発者が自分で実装する必要があります。この違いを理解することは、安全なアプリケーションを設計する上で非常に重要です。

---

## 🎯 挑戦課題 (Challenges)

-   **Easy: 記事詳細ページの作成**
    -   `app/posts/[id]/page.tsx`のような動的なルートを作成し、`prisma.post.findUnique()`を使って特定の記事を表示するページを作ってみましょう。
-   **Medium: 記事の削除機能**
    -   自分の投稿にのみ「削除」ボタンを表示させます。
    -   ボタンが押されたら、Server Action (`deletePost`) を呼び出します。
    -   Actionの中で、セッションユーザーIDと投稿の`authorId`が一致することを必ず確認してから、`prisma.post.delete()`を実行します。
-   **Hard: 記事の編集機能**
    -   削除機能と同様に、自分の投稿にのみ「編集」ボタンを表示します。
    -   編集ページ (`/posts/[id]/edit`) を作成し、既存のデータをフォームに表示します。
    -   フォーム送信時に`updatePost`のようなServer Actionを呼び出し、`prisma.post.update()`でデータを更新します。

---

## 🎉 結論

本当にお疲れ様でした！この長くて挑戦的なチュートリアルを乗り越えたあなたは、もはや単なるフロントエンド開発者ではありません。認証、データベース、サーバーサイドロジックを組み合わせた、完全なフルスタックアプリケーションを構築するスキルを身につけました。

ここで学んだ`NextAuth.js`, `Prisma`, `Server Actions`の組み合わせは、現代的なWebアプリケーション開発における非常に強力なパターンです。この知識を土台に、あなたのアイデアを形にしていってください。

次のステップとしては、ファイルアップロード（S3など）、決済機能（Stripe）、より複雑な権限管理（ロールベースアクセス制御）などに挑戦してみるのも良いでしょう。あなたの開発者としての旅は、まだ始まったばかりです！
