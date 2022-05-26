## 環境構築
npm install

ディレクトリ直下に.envファイルを作成
```
AWS_PROFILE=YOUR_AWS_CREDENTIAL_PROFILE_NAME
ACCOUNT_EMAIL=YOUR_ACCOUNT_EMAIL
ACCOUNT_PASSWORD=YOUR_ACCOUNT_PASSWORD
```

## ローカルテスト
sls invoke local --function crawl --env IS_LOCAL=true

## リモート実行
sls invoke --function crawl
