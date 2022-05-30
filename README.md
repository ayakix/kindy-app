## 環境構築

```sh
aws cloudformation deploy \
  --region ap-northeast-1 \
  --profile YOUR_AWS_CREDENTIAL_PROFILE_NAME \
  --template-file cfn.yml \
  --stack-name kindy-resouce
```

```sh
npm install
```

ディレクトリ直下に.envファイルを作成
```
AWS_PROFILE=YOUR_AWS_CREDENTIAL_PROFILE_NAME
ACCOUNT_EMAIL=YOUR_ACCOUNT_EMAIL
ACCOUNT_PASSWORD=YOUR_ACCOUNT_PASSWORD
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX
```

## ローカルテスト
sls invoke local --function crawl --env IS_LOCAL=true

## リモート実行
sls invoke --function crawl
