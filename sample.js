// expressを読み込み
var express = require("express");
const line = require('@line/bot-sdk');
var moment = require('moment');
var Kotoha = require('./lib/Kotoha');
var ConvertNumber = require('./lib/ConvertNumber');
var app = express();
console.log(process.env.channelAccessToken);
const config = {
  channelAccessToken : process.env.channelAccessToken,
  channelSecret : process.env.channelSecret
};

// サーバーの設定
var server = app.listen(process.env.PORT || 5000);


app.post('/line', line.middleware(config), function(req, res) {
  Promise
  .all(req.body.events.map(handleEvent))
  .then(function(result) {
    res.json(result)
  });
});

//呪文のようなもの。今はこんなもんということで気にしなくて良い
const client = new line.Client(config);
function handleEvent(event) {
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }
  return createReplyMessage(event);
}

function findTime(now, array, searchTrainIndex) {
  var ymd = now.format('YYYYMMDD');
  var index = array.findIndex(function(train) {
    var time = moment(ymd + train,'YYYYMMDDHH:mm');
    if(parseInt(now.format('YYYMMDDHHmm'),10) < parseInt(time.format('YYYMMDDHHmm'),10)) {
      return true;
    }
  })
  if(index < 0) return undefined;
  if(array.length >= index + searchTrainIndex + 1) index += searchTrainIndex;
  return array[index];
}

function createReplyMessage(event) {
  //もしテキストを送ってきたら
  var replyMessage = '';
  if (event.message.type == 'text') {
    var text = event.message.text;
    if(text.match(/(何ができる|何ができますか|出来ること|できること|機能)/)) {
      replyMessage = [
        'まだ機能は多くないのですが、こんなことをきいてみてください！',
        '学校の地図',
        '（アニメ名）の名言',
        '電車の時間',
        '',
        '[アップデートしました(2018/03/08)]',
        '「次の次の電車」や「2つ先の電車」とすることで、2つ先以降の電車の時間も返せるようになりました。',
        '応答内容に浪江行きを加えました。',
      ].join('\n');
    }
    else if(text.match(/学校の地図|学校の場所/)) {
      return client.replyMessage(event.replyToken, {
        type: 'location',
        "title": "福島県立小高産業技術高校",
        "address": "〒979-2157 福島県南相馬市小高区吉名玉ノ木平７８",
        "latitude": 37.5580927,
        "longitude": 140.9796601
      });
    } else if(text.match(/次の電車|電車の時間|つ先の電車/)) {
      text = ConvertNumber.toNumber(text);
      //もし次が含まれるなら
      var searchTrainIndex = 0;
      var nextIndex = text.split('次').length -2 || parseInt(text, 10) -1;
      if(nextIndex > 0) {
        searchTrainIndex = nextIndex;
      }

      var trains = {
        up : ['06:17','07:15','08:04','10:02','11:58','13:53','16:14','17:05','18:43','19:45','20:53'],
        down: ['06:42','07:39','08:35','10:30','12:30','14:26','16:40','17:43','19:20','20:20','21:20']
      };
      var now = moment().utcOffset("+09:00");

      var upNext = findTime(now, trains.up, searchTrainIndex);
      var downNext = findTime(now, trains.down, searchTrainIndex);

      replyMessage += ['電車の時刻はこちらです', '---------------','原ノ町駅行き','',''].join('\n');
      if(downNext) {
        replyMessage += '次の電車は' + moment(downNext, 'HH:mm').format('HH時mm分') + 'です';
      } else {
        replyMessage += '終電は終わってしまいました';
      }
      replyMessage += ['','---------------','浪江駅行き','',''].join('\n');
      if(upNext) {
        replyMessage += '次の電車は' + moment(upNext, 'HH:mm').format('HH時mm分') + 'です';
      } else {
        replyMessage += '終電は終わってしまいました';
      }
      replyMessage += ['','','----------------',
       '「次の次の電車」や「2つ先の電車」とすることで、2つ先以降の電車の時間も返せるようになりました。'].join('\n');
    } else if(text.match(/の名言|のセリフ/)) {
      var title = text.split('の名言')[0];
      Kotoha.query(title).then(function(res) {
        phrases = JSON.parse(res);
        if(phrases && phrases.length) {
          var phraseTexts = phrases.map(function(p) {
            return p.text;
          });
          replyMessage = 'こんなセリフが見つかりましたよ\n' + phraseTexts.join('\n');
        } else {
          replyMessage = 'そのアニメのセリフはまだデータベースに登録されてないようです'
        }
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyMessage
        });
      })
    }
      else {
      replyMessage = ['やっほー！',event.message.text, 'っていった？'].join('\n');
    }

  }
  // //今の時間を取得
  // var now = moment();
  // //何時何分の部分を取得
  // var ht = parseInt(now.format('HHmm'),10);
  // var replyMessage = '';
  // if(ht <= 1000) {
  //   replyMessage = 'おはようございます'
  // } else if(ht <= 1600) {
  //   replyMessage = 'こんにちは';
  // } else {
  //   replyMessage = 'おやすみなさい';
  // }
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyMessage
  });
}
