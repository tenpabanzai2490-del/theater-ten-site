# ロリポップ移行用フォルダ

このフォルダは、現在Vercelで動いている本番サイトには一切影響しません。
ロリポップへの移行に備えて、PHP版のサーバー処理をあらかじめ用意してあります。

## 中身

```
lolipop-migration/
├── api/
│   ├── submit.php          投稿窓口の送信を中継する(api/submit.js のPHP版)
│   ├── news.php            スプレッドシートの内容を取得する(api/news.js のPHP版)
│   └── config.example.php  秘密情報の書式サンプル(実際の値は入っていない)
└── .htaccess                /api/submit・/api/news というURLのままPHPに繋ぐための設定
```

## ロリポップにアップロードする時の手順

1. **`config.example.php` をコピーして `config.php` を作る**(このコピー作業はロリポップのファイルマネージャー上、またはSFTP接続後の手元で行う。`config.php` はGitHubには絶対に上げない)
2. `config.php` の中に、実際の `GOOGLE_SHEETS_API_KEY` の値を書き込む(値は別途チャットで確認)
3. `config.php` を、**Webから直接アクセスできない場所**に置く。理想は公開フォルダ(`public_html`など)の外。それが難しい場合は、`.htaccess` で `config.php` へのアクセスを拒否する設定を追加する(このフォルダの `.htaccess` にすでに拒否ルールを入れてあります)
4. `lolipop-migration/` の中身を、実際の公開フォルダのルート直下に配置し直す(フォルダ名の `lolipop-migration` は移行後は不要。中身を `api/` としてそのまま置く)
5. サイト本体のHTML/CSS/JS一式(`about.html`や`css/`など、今のリポジトリのトップレベルにあるもの)も同じ公開フォルダにアップロードする

## 大事な注意点

- `config.php` は **絶対にGitHubにコミットしない**でください(`.gitignore` に追加済みです)
- アップロード後、必ず先に動作確認してから、独自ドメインの向き先(DNS)をロリポップに切り替えてください。それまでは今のVercel版がそのまま動き続けるので、切り替えを急ぐ必要はありません
