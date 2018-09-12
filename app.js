// expressを読み込み
var express = require("express");
var app = express();

app.set('view engine', 'ejs');

// サーバーの設定
var server = app.listen(process.env.PORT || 5000);

app.get("/", function(req, res, next){ //追加
  res.render('index.ejs', {text: 'こんにちは!!'}); //追加
}); //追加

app.get("/hello", function(req, res, next){
  var message = 'こんにちは'; //追加
  message = getMessageText(req.query.text);
  res.json(message + '!!!!!'); //'こんばんは'をmessageに書き換え
});

// 今後LINEに接続するときに使います
const line = require('@line/bot-sdk');
const config = {
  channelAccessToken: 'tvbgFlkHHrwE/H7QeFqLDJKdxENw0nDZCc7AW3cZPZ3r8Qsp5JvCGThTg5OU9CTt8BvnBsG64YaQCWD5OZ3Zd4DsgatkuE6eBD7Wr/9HmEMucOy8QF56nrwe4/zAGIkVOdHfaKO565G4NjAIWNDHOwdB04t89/1O/w1cDnyilFU=',
  channelSecret: '8eb7db52792c8fbf3a6f22306e5230ff'
};

app.post('/line', line.middleware(config), function(req, res) {
  Promise
  .all(req.body.events.map(handleEvent))
  .then(function(result) {
    res.json(result)
  });
});

const client = new line.Client(config);
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: getMessageText(event.message.text)
  });
}

//ここまでLINEに接続するコード

//まずはここを触っていきます。
function getMessageText(text) {
  var message = 'おはよう!!「'+text+'」ってあなたは言いましたね';

  if(text.match(/おはよう/)){
    message = 'おはよう';
  }else if(text.match(/こんにちは/)){
    message = 'こんにちは'
  }else{
    message = 'いまは挨拶くらいしかできません';
  }
  return message;
}
