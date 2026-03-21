# Claude Code 用指示書：Googleログインのリダイレクト修正と本番環境設定

このプロジェクトのGoogleログイン（Auth.js v5を使用）が本番環境で `localhost` にリダイレクトされる問題を解決し、セキュアな本番設定を完了させてください。

## 1. 目的
- 本番環境（Vercel）でのGoogleログインを正常動作させる。
- 正しいリダイレクトURIを設定し、ローカル/本番の両方で動作を保証する。
- セキュリティ上のベストプラクティス（環境変数の秘匿化）を適用する。
- **ログアウト時の不整合（PWAでログイン状態が残る問題）を解消する。**

## 2. 現状の構成
- **Framework**: Next.js (App Router)
- **Auth**: Auth.js v5 (NextAuth.js)
- **DB**: Prisma + Neon (PostgreSQL)
- **Deploy**: Vercel

## 3. 具体的なタスク

### A. 環境変数の整理
1. **`.env` (ローカル用)**:
   - `NEXTAUTH_URL` を `http://localhost:3000` に設定する。
   - `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` に適切な値を設定する。
2. **Vercel 環境変数 (本番用)**:
   - `NEXTAUTH_URL` が存在する場合は**削除**する（Auth.js v5では自動検出されるため、設定ミスによる誤リダイレクトを防ぐため）。
   - 以下の変数が正しく設定されているか確認する：
     - `AUTH_SECRET` (暗号化用)
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`

### B. Google Cloud Console 設定
- 承認済みのリダイレクトURIに以下を追加する：
  `https://receipt-tracker-livid.vercel.app/api/auth/callback/google`

### C. コードの修正と検証（重要）
1. **`src/components/AuthGuard.tsx`**:
   - コメントアウトされている「認証チェック中の表示ブロック」を有効化する。これにより、PWAでキャッシュされた古い（ログイン済みの）画面が一瞬表示されるのを防ぎます。
2. **`src/auth.ts`**: `trustHost: true` が設定されているか確認。
3. **`src/auth.config.ts`**: `Google` プロバイダーが正しく構成されているか確認。

## 4. セキュリティ要件
- シークレット情報（`Client Secret`, `AUTH_SECRET`）は絶対にソースコードに直接書かない。
- `.gitignore` が `.env*` を除外していることを継続して確認する。

## 5. 動作確認手順
1. 本番の `/login` ページにアクセス。
2. Googleログインボタンをクリックし、Googleの認証画面が表示されることを確認。
3. ログイン完了後、`localhost` ではなく `receipt-tracker-livid.vercel.app` のホーム画面に戻ることを確認。
4. ログアウトボタンを押し、`/login` に戻った後一度アプリを完全に閉じ、再度開いた際も `/login` ページが表示されることを確認。
