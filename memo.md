本番環境では vercel cli を使ってプロジェクトとリンクし、本番用の prisma migrate deploy でマイグレーションする必要がある

auth.ts として関数を切り出して
[...nextauth]では

```
import { handlers } from "../../../../../auth";

export const { GET, POST } = handlers;
```

だけでいい。

package.json で
scripts の postingall で prisma generate を記述して Vercel のビルド時に prisma client の生成が必要
