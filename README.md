# Theater TEN Company ホームページ

静的サイト(プレーンHTML/CSS/JS、ビルド不要)。Claude Designのハイファイデザインを再現。

## ファイル構成

```
index.html          トップページ
performances.html   公演情報
about.html           劇団紹介
members.html         メンバー紹介
access.html           アクセス
contact.html         お問い合わせ
css/style.css        共通スタイル
js/nav.js            モバイル用ハンバーガーメニュー
```

## プレースホルダー(実データ差し替えが必要な箇所)

- 舞台写真・メンバー写真・地図 → 現状は斜めストライプのプレースホルダー
- 公演情報(演目名・日付・会場)→ `performances.html`
- メンバー名・役職・プロフィール文 → `members.html`
- アクセスの住所・電話番号・交通案内 → `access.html`
- 沿革の年号 → `about.html`

## 公演情報の更新方法

このサイトは「公演が決まったらClaude Codeに依頼して更新してもらう」運用です。
Claude Codeに「〇〇公演の情報を追加して」のように伝えれば、`performances.html`
(トップページのカードも必要なら)を更新します。

## お問い合わせフォームについて

外部サービス [Formspree](https://formspree.io) を利用する前提で組んであります(独自のサーバー実装は不要)。

### 設定手順

1. https://formspree.io で無料アカウントを作成(Gmailアドレスでよい)
2. 新しいフォームを作成すると「Form ID」が発行される(例: `xrgjabcd`)
3. `contact.html` 内の `https://formspree.io/f/YOUR_FORM_ID` の
   `YOUR_FORM_ID` の部分を、発行されたIDに置き換える
4. これで `contact.html` から送信されたメールが、Formspree登録メールアドレスに届くようになる

未設定の間は送信できません(送信先がプレースホルダーのため)。

## ローカルで確認する方法

ビルド不要ですが、`file://` で直接開くとブラウザによっては動作しない場合があるため、
簡易サーバーで確認するのがおすすめです(Node/Pythonが入っていない環境向けに
PowerShellスクリプトを同梱しています)。

```powershell
powershell -ExecutionPolicy Bypass -File _serve.ps1
# http://localhost:8642 をブラウザで開く
```

`_serve.ps1` は確認用ツールなので、本番公開には使いません(Vercelが自動でホスティングします)。

## 公開(デプロイ)について

ブリーフの想定どおり、GitHub連携 + Vercel(無料アカウント)での公開を想定しています。
GitHubリポジトリの作成・Vercelとの連携は、アカウント操作を伴うため、
利用者(知花さん)側の承認が必要な手順として別途進めます。
