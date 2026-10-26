// ================= 最初から入っているフレーズ集 =================
// よく行く国の言葉だけ、PHRASE_LIST（75個）の順に「現地の表現|カタカナの読み方」で持つ。
// AI を使わずに使えるように、アプリに同梱する（訳は Claude が作成。発音は目安）。
const BUILTIN_PHRASE_DATA = {
  "英語": ["en-US", `Excuse me.|エクスキューズ ミー
Thank you.|サンキュー
Yes.|イエス
No.|ノー
I don't understand.|アイ ドント アンダースタンド
Do you speak English?|ドゥー ユー スピーク イングリッシュ？
Good morning.|グッド モーニング
Hello.|ハロー
Good evening.|グッド イブニング
Good night.|グッド ナイト
Nice to meet you.|ナイス トゥ ミート ユー
Pleased to meet you.|プリーズド トゥ ミート ユー
How are you?|ハウ アー ユー？
And you?|アンド ユー？
What's your name?|ワッツ ユア ネーム？
Where are you from?|ウェア アー ユー フロム？
Where do you live?|ウェア ドゥー ユー リヴ？
What do you do?|ワット ドゥー ユー ドゥー？
What are your hobbies?|ワット アー ユア ホビーズ？
Do you speak ○○?|ドゥー ユー スピーク ○○？
Why are you learning ○○?|ワイ アー ユー ラーニング ○○？
Because ○○.|ビコーズ ○○
How long have you been learning ○○?|ハウ ロング ハヴ ユー ビーン ラーニング ○○？
Have you ever ○○?|ハヴ ユー エヴァー ○○？
Do you like ○○?|ドゥー ユー ライク ○○？
What does ○○ mean?|ワット ダズ ○○ ミーン？
That's right.|ザッツ ライト
I see.|アイ シー
I'd rather not…|アイド ラザー ノット…
Could you say that again?|クッジュー セイ ザット アゲイン？
Could you speak more slowly?|クッジュー スピーク モア スローリー？
Just a moment, please.|ジャスト ア モーメント プリーズ
May I ○○?|メイ アイ ○○？
Could you ○○?|クッジュー ○○？
Is it possible to ○○?|イズ イット ポッシブル トゥ ○○？
Do you have ○○?|ドゥー ユー ハヴ ○○？
When did you ○○?|ウェン ディッド ユー ○○？
What time is it?|ワット タイム イズ イット？
Who is that person?|フー イズ ザット パーソン？
Where is ○○?|ウェア イズ ○○？
I want to go to ○○.|アイ ワント トゥ ゴー トゥ ○○
How do I get to ○○?|ハウ ドゥー アイ ゲット トゥ ○○？
To ○○, please.|トゥ ○○ プリーズ
Right here is fine.|ライト ヒア イズ ファイン
Which ○○?|ウィッチ ○○？
Left|レフト
Right|ライト
Straight ahead|ストレート アヘッド
One of these, please.|ワン オブ ディーズ プリーズ
I'll have this, please.|アイル ハヴ ディス プリーズ
What do you recommend?|ワット ドゥー ユー レコメンド？
It's delicious.|イッツ デリシャス
Check, please.|チェック プリーズ
I'm vegetarian.|アイム ベジタリアン
No meat, please.|ノー ミート プリーズ
I have an allergy.|アイ ハヴ アン アラジー
How much is it?|ハウ マッチ イズ イット？
Can you give me a discount?|キャン ユー ギヴ ミー ア ディスカウント？
Could you show me this?|クッジュー ショウ ミー ディス？
It's a little small.|イッツ ア リトル スモール
It's a little big.|イッツ ア リトル ビッグ
Do you take credit cards?|ドゥー ユー テイク クレジット カーズ？
Help!|ヘルプ！
Where is the hospital?|ウェア イズ ザ ホスピタル？
Hi, how can I help you?|ハイ、ハウ キャナイ ヘルプ ユー？
one|ワン
two|トゥー
three|スリー
four|フォー
five|ファイブ
six|シックス
seven|セブン
eight|エイト
nine|ナイン
ten|テン`],
  "韓国語": ["ko-KR", `실례합니다|シルレハムニダ
감사합니다|カムサハムニダ
네|ネ
아니요|アニヨ
모르겠어요|モルゲッソヨ
영어 할 줄 아세요?|ヨンオ ハル チュル アセヨ？
안녕하세요|アンニョンハセヨ
안녕하세요|アンニョンハセヨ
안녕하세요|アンニョンハセヨ
안녕히 주무세요|アンニョンヒ チュムセヨ
처음 뵙겠습니다|チョウム プェプケッスムニダ
잘 부탁드립니다|チャル プタクトゥリムニダ
잘 지내세요?|チャル チネセヨ？
그쪽은요?|クッチョグンニョ？
이름이 뭐예요?|イルミ ムォエヨ？
어디에서 왔어요?|オディエソ ワッソヨ？
어디에 살아요?|オディエ サラヨ？
무슨 일 하세요?|ムスン イル ハセヨ？
취미가 뭐예요?|チュィミガ ムォエヨ？
○○어 할 줄 아세요?|○○オ ハル チュル アセヨ？
왜 ○○어를 공부해요?|ウェ ○○オルル コンブヘヨ？
○○이기 때문이에요|○○イギ テムニエヨ
○○을 얼마나 배웠어요?|○○ウル オルマナ ペウォッソヨ？
○○한 적 있어요?|○○ハン チョク イッソヨ？
○○ 좋아해요?|○○ チョアヘヨ？
○○은 무슨 뜻이에요?|○○ウン ムスン トゥシエヨ？
그렇네요|クロンネヨ
아, 그렇군요|ア、クロックンニョ
좀…|チョム…
다시 한번 말해 주세요|タシ ハンボン マレ ジュセヨ
천천히 말해 주세요|チョンチョニ マレ ジュセヨ
잠깐만요|チャムカンマンニョ
○○해도 돼요?|○○ヘド ドェヨ？
○○해 주실 수 있어요?|○○ヘ ジュシル ス イッソヨ？
○○할 수 있어요?|○○ハル ス イッソヨ？
○○ 있어요?|○○ イッソヨ？
언제 ○○했어요?|オンジェ ○○ヘッソヨ？
지금 몇 시예요?|チグム ミョッ シエヨ？
저분은 누구세요?|チョブヌン ヌグセヨ？
○○ 어디예요?|○○ オディエヨ？
○○에 가고 싶어요|○○エ カゴ シポヨ
○○까지 어떻게 가요?|○○カジ オットッケ カヨ？
○○까지 가 주세요|○○カジ カ ジュセヨ
여기서 내릴게요|ヨギソ ネリルケヨ
어느 ○○예요?|オヌ ○○エヨ？
왼쪽|ウェンチョク
오른쪽|オルンチョク
직진|チクチン
이거 하나 주세요|イゴ ハナ ジュセヨ
이거 주세요|イゴ ジュセヨ
뭐가 맛있어요?|ムォガ マシッソヨ？
맛있어요|マシッソヨ
계산해 주세요|ケサネ ジュセヨ
채식주의자예요|チェシクチュイジャエヨ
고기 빼 주세요|コギ ッペ ジュセヨ
알레르기가 있어요|アルレルギガ イッソヨ
얼마예요?|オルマエヨ？
좀 깎아 주세요|チョム カッカ ジュセヨ
이거 보여 주세요|イゴ ボヨ ジュセヨ
좀 작아요|チョム チャガヨ
좀 커요|チョム コヨ
카드 돼요?|カドゥ ドェヨ？
도와주세요!|トワジュセヨ！
병원이 어디예요?|ピョンウォニ オディエヨ？
어서 오세요|オソ オセヨ
하나|ハナ
둘|トゥル
셋|セッ
넷|ネッ
다섯|タソッ
여섯|ヨソッ
일곱|イルゴプ
여덟|ヨドル
아홉|アホプ
열|ヨル`],
  "中国語（繁体字）": ["zh-TW", `不好意思|ブーハオイース
謝謝|シエシエ
是的|シーダ
不是|ブーシー
我聽不懂|ウォー ティンブードン
你會說英文嗎？|ニー ホイ シュオ インウェン マ？
早安|ザオアン
你好|ニーハオ
晚上好|ワンシャン ハオ
晚安|ワンアン
初次見面|チューツー ジエンミエン
請多多指教|チン ドゥオドゥオ ジージャオ
你好嗎？|ニー ハオ マ？
你呢？|ニー ナ？
你叫什麼名字？|ニー ジャオ シェンモ ミンズ？
你是哪裡人？|ニー シー ナーリー レン？
你住在哪裡？|ニー ジュー ザイ ナーリー？
你做什麼工作？|ニー ズオ シェンモ ゴンズオ？
你的興趣是什麼？|ニーダ シンチュー シー シェンモ？
你會說○○嗎？|ニー ホイ シュオ ○○ マ？
你為什麼學○○？|ニー ウェイシェンモ シュエ ○○？
因為○○|インウェイ ○○
你學○○多久了？|ニー シュエ ○○ ドゥオジウ ラ？
你○○過嗎？|ニー ○○グオ マ？
你喜歡○○嗎？|ニー シーホワン ○○ マ？
○○是什麼意思？|○○ シー シェンモ イース？
對啊|ドゥイ ア
原來如此|ユエンライ ルーツー
這個嘛……|ジェイガ マ…
請再說一次|チン ザイ シュオ イーツー
請說慢一點|チン シュオ マン イーディエン
請等一下|チン デン イーシア
可以○○嗎？|クーイー ○○ マ？
可以請你○○嗎？|クーイー チン ニー ○○ マ？
能○○嗎？|ノン ○○ マ？
有○○嗎？|ヨウ ○○ マ？
你什麼時候○○的？|ニー シェンモ シーホウ ○○ ダ？
現在幾點？|シエンザイ ジーディエン？
那位是誰？|ナーウェイ シー シェイ？
○○在哪裡？|○○ ザイ ナーリー？
我想去○○|ウォー シアン チュー ○○
去○○怎麼走？|チュー ○○ ゼンモ ゾウ？
請到○○|チン ダオ ○○
在這裡下車就好|ザイ ジェーリー シアチャー ジウ ハオ
哪一個○○？|ナー イーガ ○○？
左邊|ズオビエン
右邊|ヨウビエン
直走|ジー ゾウ
這個一個|ジェイガ イーガ
我要這個|ウォー ヤオ ジェイガ
有什麼推薦的嗎？|ヨウ シェンモ トゥイジエン ダ マ？
很好吃|ヘン ハオチー
麻煩買單|マーファン マイダン
我吃素|ウォー チー スー
請不要放肉|チン ブーヤオ ファン ロウ
我有過敏|ウォー ヨウ グオミン
多少錢？|ドゥオシャオ チエン？
可以便宜一點嗎？|クーイー ピエンイー イーディエン マ？
請給我看這個|チン ゲイ ウォー カン ジェイガ
有點小|ヨウディエン シアオ
有點大|ヨウディエン ダー
可以刷卡嗎？|クーイー シュアカー マ？
救命！|ジウミン！
醫院在哪裡？|イーユエン ザイ ナーリー？
歡迎光臨|ホワンイン グアンリン
一|イー
二|アル
三|サン
四|スー
五|ウー
六|リウ
七|チー
八|バー
九|ジウ
十|シー`],
  "中国語（簡体字）": ["zh-CN", `打扰一下|ダーラオ イーシア
谢谢|シエシエ
是的|シーダ
不是|ブーシー
我听不懂|ウォー ティンブードン
你会说英语吗？|ニー ホイ シュオ インユー マ？
早上好|ザオシャン ハオ
你好|ニーハオ
晚上好|ワンシャン ハオ
晚安|ワンアン
初次见面|チューツー ジエンミエン
请多关照|チン ドゥオ グアンジャオ
你好吗？|ニー ハオ マ？
你呢？|ニー ナ？
你叫什么名字？|ニー ジャオ シェンマ ミンズ？
你是哪里人？|ニー シー ナーリー レン？
你住在哪里？|ニー ジュー ザイ ナーリー？
你做什么工作？|ニー ズオ シェンマ ゴンズオ？
你的爱好是什么？|ニーダ アイハオ シー シェンマ？
你会说○○吗？|ニー ホイ シュオ ○○ マ？
你为什么学○○？|ニー ウェイシェンマ シュエ ○○？
因为○○|インウェイ ○○
你学○○多久了？|ニー シュエ ○○ ドゥオジウ ラ？
你○○过吗？|ニー ○○グオ マ？
你喜欢○○吗？|ニー シーホワン ○○ マ？
○○是什么意思？|○○ シー シェンマ イース？
是啊|シー ア
原来如此|ユエンライ ルーツー
这个嘛……|ジェイガ マ…
请再说一遍|チン ザイ シュオ イービエン
请说慢一点|チン シュオ マン イーディエン
请等一下|チン デン イーシア
可以○○吗？|クーイー ○○ マ？
能请你○○吗？|ノン チン ニー ○○ マ？
能○○吗？|ノン ○○ マ？
有○○吗？|ヨウ ○○ マ？
你什么时候○○的？|ニー シェンマ シーホウ ○○ ダ？
现在几点？|シエンザイ ジーディエン？
那位是谁？|ナーウェイ シー シェイ？
○○在哪里？|○○ ザイ ナーリー？
我想去○○|ウォー シアン チュー ○○
去○○怎么走？|チュー ○○ ゼンマ ゾウ？
请到○○|チン ダオ ○○
就在这里下车|ジウ ザイ ジェーリー シアチャー
哪个○○？|ナーガ ○○？
左边|ズオビエン
右边|ヨウビエン
直走|ジー ゾウ
这个来一个|ジェイガ ライ イーガ
我要这个|ウォー ヤオ ジェイガ
有什么推荐的吗？|ヨウ シェンマ トゥイジエン ダ マ？
很好吃|ヘン ハオチー
麻烦结账|マーファン ジエジャン
我吃素|ウォー チー スー
请不要放肉|チン ブーヤオ ファン ロウ
我有过敏|ウォー ヨウ グオミン
多少钱？|ドゥオシャオ チエン？
能便宜一点吗？|ノン ピエンイー イーディエン マ？
请给我看一下这个|チン ゲイ ウォー カン イーシア ジェイガ
有点小|ヨウディエン シアオ
有点大|ヨウディエン ダー
可以刷卡吗？|クーイー シュアカー マ？
救命！|ジウミン！
医院在哪里？|イーユエン ザイ ナーリー？
欢迎光临|ホワンイン グアンリン
一|イー
二|アル
三|サン
四|スー
五|ウー
六|リウ
七|チー
八|バー
九|ジウ
十|シー`],
  "タイ語": ["th-TH", `ขอโทษครับ/ค่ะ|コートー クラップ/カー
ขอบคุณครับ/ค่ะ|コープクン クラップ/カー
ใช่|チャイ
ไม่ใช่|マイチャイ
ไม่เข้าใจ|マイ カオチャイ
พูดภาษาอังกฤษได้ไหม|プート パーサー アングリット ダイマイ
อรุณสวัสดิ์|アルン サワット
สวัสดีครับ/ค่ะ|サワッディー クラップ/カー
สวัสดีตอนเย็น|サワッディー トーン イェン
ราตรีสวัสดิ์|ラートリー サワット
ยินดีที่ได้รู้จัก|インディー ティー ダイ ルーチャック
ฝากตัวด้วยนะครับ/คะ|ファーク トゥア ドゥアイ ナ クラップ/カ
สบายดีไหม|サバーイ ディー マイ
แล้วคุณล่ะ|レーオ クン ラ
คุณชื่ออะไร|クン チュー アライ
คุณมาจากไหน|クン マー チャーク ナイ
คุณอยู่ที่ไหน|クン ユー ティー ナイ
คุณทำงานอะไร|クン タム ンガーン アライ
งานอดิเรกของคุณคืออะไร|ンガーン アディレーク コーン クン クー アライ
คุณพูดภาษา○○ได้ไหม|クン プート パーサー ○○ ダイマイ
ทำไมเรียนภาษา○○|タムマイ リアン パーサー ○○
เพราะว่า○○|プロワー ○○
เรียน○○มานานแค่ไหน|リアン ○○ マー ナーン ケー ナイ
เคย○○ไหม|クーイ ○○ マイ
ชอบ○○ไหม|チョープ ○○ マイ
○○แปลว่าอะไร|○○ プレー ワー アライ
ใช่เลย|チャイ ルーイ
อ๋อ เข้าใจแล้ว|オー カオチャイ レーオ
คงไม่สะดวก…|コン マイ サドゥアック…
พูดอีกครั้งได้ไหม|プート イーク クラン ダイマイ
พูดช้าๆ หน่อยได้ไหม|プート チャーチャー ノイ ダイマイ
รอสักครู่|ロー サッククルー
○○ได้ไหม|○○ ダイマイ
ช่วย○○ได้ไหม|チュアイ ○○ ダイマイ
สามารถ○○ได้ไหม|サーマート ○○ ダイマイ
มี○○ไหม|ミー ○○ マイ
○○เมื่อไหร่|○○ ムアライ
กี่โมงแล้ว|ギー モーン レーオ
คนนั้นคือใคร|コン ナン クー クライ
○○อยู่ที่ไหน|○○ ユー ティー ナイ
อยากไป○○|ヤーク パイ ○○
ไป○○ยังไง|パイ ○○ ヤンガイ
ไป○○ครับ/ค่ะ|パイ ○○ クラップ/カー
จอดตรงนี้ครับ/ค่ะ|チョート トロン ニー クラップ/カー
○○ไหน|○○ ナイ
ซ้าย|サーイ
ขวา|クワー
ตรงไป|トロン パイ
เอาอันนี้หนึ่งอัน|アオ アンニー ヌン アン
เอาอันนี้|アオ アンニー
แนะนำอะไรดี|ネナム アライ ディー
อร่อย|アロイ
เช็คบิลด้วย|チェック ビン ドゥアイ
ทานมังสวิรัติ|ターン マンサウィラット
ไม่ใส่เนื้อสัตว์|マイ サイ ヌア サット
แพ้อาหาร|ペー アーハーン
เท่าไหร่|タオライ
ลดได้ไหม|ロット ダイマイ
ขอดูอันนี้หน่อย|コー ドゥー アンニー ノイ
เล็กไปหน่อย|レック パイ ノイ
ใหญ่ไปหน่อย|ヤイ パイ ノイ
ใช้บัตรเครดิตได้ไหม|チャイ バット クレーディット ダイマイ
ช่วยด้วย|チュアイ ドゥアイ
โรงพยาบาลอยู่ที่ไหน|ローン パヤーバーン ユー ティー ナイ
ยินดีต้อนรับ|インディー トーンラップ
หนึ่ง|ヌン
สอง|ソーン
สาม|サーム
สี่|シー
ห้า|ハー
หก|ホック
เจ็ด|チェット
แปด|ペート
เก้า|ガーオ
สิบ|シップ`],
  "ベトナム語": ["vi-VN", `Xin lỗi|シン ロイ
Cảm ơn|カム オン
Vâng|ヴァン
Không|コン
Tôi không hiểu|トイ コン ヒエウ
Bạn có nói tiếng Anh không?|バン コー ノイ ティエン アイン コン？
Chào buổi sáng|チャオ ブオイ サン
Xin chào|シン チャオ
Chào buổi tối|チャオ ブオイ トイ
Chúc ngủ ngon|チュック グー ゴン
Rất vui được gặp bạn|ザット ヴイ ドゥオック ガップ バン
Mong được giúp đỡ|モン ドゥオック ズップ ドー
Bạn khỏe không?|バン コエ コン？
Còn bạn thì sao?|コン バン ティー サオ？
Bạn tên là gì?|バン テン ラー ジー？
Bạn đến từ đâu?|バン デン トゥー ダウ？
Bạn sống ở đâu?|バン ソン オー ダウ？
Bạn làm nghề gì?|バン ラム ゲー ジー？
Sở thích của bạn là gì?|ソー ティック クア バン ラー ジー？
Bạn có nói tiếng ○○ không?|バン コー ノイ ティエン ○○ コン？
Tại sao bạn học tiếng ○○?|タイ サオ バン ホック ティエン ○○？
Vì ○○|ヴィー ○○
Bạn học ○○ bao lâu rồi?|バン ホック ○○ バオ ラウ ゾイ？
Bạn đã từng ○○ chưa?|バン ダー トゥン ○○ チュア？
Bạn có thích ○○ không?|バン コー ティック ○○ コン？
○○ nghĩa là gì?|○○ ギア ラー ジー？
Đúng vậy|ドゥン ヴァイ
À, ra vậy|アー、ザー ヴァイ
Cái đó thì hơi…|カイ ドー ティー ホイ…
Bạn nói lại được không?|バン ノイ ライ ドゥオック コン？
Bạn nói chậm lại được không?|バン ノイ チャム ライ ドゥオック コン？
Chờ một chút|チョー モット チュット
Tôi ○○ được không?|トイ ○○ ドゥオック コン？
Bạn có thể ○○ giúp tôi không?|バン コー テー ○○ ズップ トイ コン？
Có thể ○○ không?|コー テー ○○ コン？
Có ○○ không?|コー ○○ コン？
Bạn ○○ khi nào?|バン ○○ キー ナオ？
Mấy giờ rồi?|マイ ゾー ゾイ？
Người kia là ai?|グオイ キア ラー アイ？
○○ ở đâu?|○○ オー ダウ？
Tôi muốn đi ○○|トイ ムオン ディー ○○
Đi ○○ bằng cách nào?|ディー ○○ バン カック ナオ？
Cho tôi đến ○○|チョー トイ デン ○○
Dừng ở đây được rồi|ズン オー ダイ ドゥオック ゾイ
○○ nào?|○○ ナオ？
Trái|チャイ
Phải|ファイ
Đi thẳng|ディー タン
Cho tôi một cái này|チョー トイ モット カイ ナイ
Cho tôi cái này|チョー トイ カイ ナイ
Món nào ngon?|モン ナオ ゴン？
Ngon quá|ゴン クア
Tính tiền|ティン ティエン
Tôi ăn chay|トイ アン チャイ
Đừng cho thịt nhé|ドゥン チョー ティット ニェ
Tôi bị dị ứng|トイ ビー ジー ウン
Bao nhiêu tiền?|バオ ニエウ ティエン？
Bớt được không?|ボット ドゥオック コン？
Cho tôi xem cái này|チョー トイ セム カイ ナイ
Hơi nhỏ|ホイ ニョー
Hơi to|ホイ トー
Có trả bằng thẻ tín dụng được không?|コー チャー バン テー ティン ズン ドゥオック コン？
Cứu tôi với!|クー トイ ヴォイ！
Bệnh viện ở đâu?|ベン ヴィエン オー ダウ？
Xin mời vào|シン モイ ヴァオ
một|モット
hai|ハイ
ba|バー
bốn|ボン
năm|ナム
sáu|サウ
bảy|バイ
tám|タム
chín|チン
mười|ムオイ`],
  "インドネシア語": ["id-ID", `Permisi|ペルミシ
Terima kasih|トゥリマ カシ
Ya|ヤ
Tidak|ティダッ
Saya tidak mengerti|サヤ ティダッ ムングルティ
Bisa bicara bahasa Inggris?|ビサ ビチャラ バハサ イングリス？
Selamat pagi|スラマッ パギ
Halo|ハロー
Selamat malam|スラマッ マラム
Selamat tidur|スラマッ ティドゥル
Senang bertemu Anda|スナン ブルトゥム アンダ
Mohon bantuannya|モホン バントゥアンニャ
Apa kabar?|アパ カバル？
Bagaimana dengan Anda?|バガイマナ ドゥンガン アンダ？
Siapa nama Anda?|シアパ ナマ アンダ？
Anda dari mana?|アンダ ダリ マナ？
Anda tinggal di mana?|アンダ ティンガル ディ マナ？
Apa pekerjaan Anda?|アパ プクルジャアン アンダ？
Apa hobi Anda?|アパ ホビ アンダ？
Bisa bicara bahasa ○○?|ビサ ビチャラ バハサ ○○？
Kenapa belajar bahasa ○○?|クナパ ブラジャル バハサ ○○？
Karena ○○|カルナ ○○
Sudah berapa lama belajar ○○?|スダ ブラパ ラマ ブラジャル ○○？
Pernah ○○?|プルナ ○○？
Suka ○○?|スカ ○○？
○○ artinya apa?|○○ アルティニャ アパ？
Betul|ブトゥル
Oh, begitu|オー、ブギトゥ
Hmm, agak sulit…|フム、アガッ スリッ…
Tolong ulangi|トロン ウランギ
Tolong bicara pelan-pelan|トロン ビチャラ プランプラン
Tunggu sebentar|トゥング スブンタル
Boleh saya ○○?|ボレ サヤ ○○？
Bisa tolong ○○?|ビサ トロン ○○？
Bisa ○○?|ビサ ○○？
Ada ○○?|アダ ○○？
Kapan Anda ○○?|カパン アンダ ○○？
Jam berapa sekarang?|ジャム ブラパ スカラン？
Siapa orang itu?|シアパ オラン イトゥ？
○○ di mana?|○○ ディ マナ？
Saya mau ke ○○|サヤ マウ ク ○○
Bagaimana cara ke ○○?|バガイマナ チャラ ク ○○？
Ke ○○, ya|ク ○○、ヤ
Berhenti di sini saja|ブルフンティ ディ シニ サジャ
○○ yang mana?|○○ ヤン マナ？
Kiri|キリ
Kanan|カナン
Lurus|ルルス
Ini satu|イニ サトゥ
Saya mau ini|サヤ マウ イニ
Apa yang direkomendasikan?|アパ ヤン ディレコメンダシカン？
Enak|エナッ
Minta bon|ミンタ ボン
Saya vegetarian|サヤ ヴェゲタリアン
Tanpa daging|タンパ ダギン
Saya punya alergi|サヤ プニャ アレルギ
Berapa harganya?|ブラパ ハルガニャ？
Bisa kurang?|ビサ クラン？
Boleh lihat ini?|ボレ リハッ イニ？
Agak kecil|アガッ クチル
Agak besar|アガッ ブサル
Bisa pakai kartu kredit?|ビサ パカイ カルトゥ クレディッ？
Tolong!|トロン！
Rumah sakit di mana?|ルマ サキッ ディ マナ？
Selamat datang|スラマッ ダタン
satu|サトゥ
dua|ドゥア
tiga|ティガ
empat|ウンパッ
lima|リマ
enam|ウナム
tujuh|トゥジュ
delapan|ドゥラパン
sembilan|スンビラン
sepuluh|スプル`],
  "フランス語": ["fr-FR", `Excusez-moi|エクスキュゼ モワ
Merci|メルシー
Oui|ウィ
Non|ノン
Je ne comprends pas|ジュ ヌ コンプラン パ
Vous parlez anglais ?|ヴ パルレ アングレ？
Bonjour|ボンジュール
Bonjour|ボンジュール
Bonsoir|ボンソワール
Bonne nuit|ボンヌ ニュイ
Enchanté(e)|アンシャンテ
Ravi(e) de vous connaître|ラヴィ ドゥ ヴ コネートル
Comment allez-vous ?|コマン タレ ヴ？
Et vous ?|エ ヴ？
Comment vous appelez-vous ?|コマン ヴ ザプレ ヴ？
D'où venez-vous ?|ドゥ ヴネ ヴ？
Où habitez-vous ?|ウ アビテ ヴ？
Que faites-vous dans la vie ?|ク フェット ヴ ダン ラ ヴィ？
Quels sont vos loisirs ?|ケル ソン ヴォ ロワジール？
Vous parlez ○○ ?|ヴ パルレ ○○？
Pourquoi apprenez-vous le ○○ ?|プルクワ アプルネ ヴ ル ○○？
Parce que ○○|パルス ク ○○
Depuis combien de temps apprenez-vous le ○○ ?|ドゥピュイ コンビアン ドゥ タン アプルネ ヴ ル ○○？
Avez-vous déjà ○○ ?|アヴェ ヴ デジャ ○○？
Vous aimez ○○ ?|ヴ ゼメ ○○？
Que veut dire ○○ ?|ク ヴ ディール ○○？
C'est vrai|セ ヴレ
Je vois|ジュ ヴォワ
Euh, c'est un peu difficile…|ウー、セ タン プ ディフィシル…
Pouvez-vous répéter ?|プヴェ ヴ レペテ？
Pouvez-vous parler plus lentement ?|プヴェ ヴ パルレ プリュ ラントマン？
Un instant, s'il vous plaît|アン ナンスタン、シル ヴ プレ
Est-ce que je peux ○○ ?|エス ク ジュ プ ○○？
Pourriez-vous ○○ ?|プリエ ヴ ○○？
Est-ce possible de ○○ ?|エス ポシブル ドゥ ○○？
Avez-vous ○○ ?|アヴェ ヴ ○○？
Quand avez-vous ○○ ?|カン タヴェ ヴ ○○？
Quelle heure est-il ?|ケル ウール エ ティル？
Qui est cette personne ?|キ エ セット ペルソンヌ？
Où est ○○ ?|ウ エ ○○？
Je voudrais aller à ○○|ジュ ヴドレ アレ ア ○○
Comment aller à ○○ ?|コマン アレ ア ○○？
À ○○, s'il vous plaît|ア ○○、シル ヴ プレ
Ici, c'est parfait|イシ、セ パルフェ
Quel ○○ ?|ケル ○○？
À gauche|ア ゴーシュ
À droite|ア ドロワット
Tout droit|トゥ ドロワ
Un de ceux-ci, s'il vous plaît|アン ドゥ ス シ、シル ヴ プレ
Je vais prendre ça|ジュ ヴェ プランドル サ
Qu'est-ce que vous recommandez ?|ケス ク ヴ ルコマンデ？
C'est délicieux|セ デリシュー
L'addition, s'il vous plaît|ラディシオン、シル ヴ プレ
Je suis végétarien(ne)|ジュ スュイ ヴェジェタリアン
Sans viande, s'il vous plaît|サン ヴィアンド、シル ヴ プレ
J'ai une allergie|ジェ ユヌ アレルジー
C'est combien ?|セ コンビアン？
Vous pouvez faire un prix ?|ヴ プヴェ フェール アン プリ？
Je peux voir ceci ?|ジュ プ ヴォワール ススィ？
C'est un peu petit|セ タン プ プティ
C'est un peu grand|セ タン プ グラン
Vous acceptez les cartes de crédit ?|ヴ ザクセプテ レ カルト ドゥ クレディ？
Au secours !|オ スクール！
Où est l'hôpital ?|ウ エ ロピタル？
Bonjour, je peux vous aider ?|ボンジュール、ジュ プ ヴ ゼデ？
un|アン
deux|ドゥ
trois|トロワ
quatre|キャトル
cinq|サンク
six|シス
sept|セット
huit|ユイット
neuf|ヌフ
dix|ディス`],
  "イタリア語": ["it-IT", `Mi scusi|ミ スクーズィ
Grazie|グラッツィエ
Sì|スィ
No|ノ
Non capisco|ノン カピスコ
Parla inglese?|パルラ イングレーゼ？
Buongiorno|ブォンジョルノ
Salve|サルヴェ
Buonasera|ブォナセーラ
Buonanotte|ブォナノッテ
Piacere|ピアチェーレ
Piacere di conoscerla|ピアチェーレ ディ コノシェルラ
Come sta?|コメ スタ？
E lei?|エ レイ？
Come si chiama?|コメ スィ キアーマ？
Di dov'è?|ディ ドヴェ？
Dove abita?|ドーヴェ アービタ？
Che lavoro fa?|ケ ラヴォーロ ファ？
Quali sono i suoi hobby?|クアーリ ソーノ イ スオイ オッビ？
Parla ○○?|パルラ ○○？
Perché studia ○○?|ペルケ ストゥーディア ○○？
Perché ○○|ペルケ ○○
Da quanto tempo studia ○○?|ダ クアント テンポ ストゥーディア ○○？
Ha mai ○○?|ア マイ ○○？
Le piace ○○?|レ ピアーチェ ○○？
Che cosa vuol dire ○○?|ケ コーザ ヴォル ディーレ ○○？
Esatto|エザット
Ho capito|オ カピート
Mah, è un po' difficile…|マー、エ ウン ポ ディッフィーチレ…
Può ripetere?|プオ リペーテレ？
Può parlare più lentamente?|プオ パルラーレ ピウ レンタメンテ？
Un attimo, per favore|ウン アッティモ、ペル ファヴォーレ
Posso ○○?|ポッソ ○○？
Potrebbe ○○?|ポトレッベ ○○？
Si può ○○?|スィ プオ ○○？
Avete ○○?|アヴェーテ ○○？
Quando ha ○○?|クアンド ア ○○？
Che ore sono?|ケ オーレ ソーノ？
Chi è quella persona?|キ エ クエッラ ペルソーナ？
Dov'è ○○?|ドヴェ ○○？
Vorrei andare a ○○|ヴォッレイ アンダーレ ア ○○
Come si arriva a ○○?|コメ スィ アッリーヴァ ア ○○？
A ○○, per favore|ア ○○、ペル ファヴォーレ
Qui va bene|クイ ヴァ ベーネ
Quale ○○?|クアーレ ○○？
A sinistra|ア スィニストラ
A destra|ア デストラ
Sempre dritto|センプレ ドリット
Uno di questi, per favore|ウーノ ディ クエスティ、ペル ファヴォーレ
Prendo questo|プレンド クエスト
Cosa mi consiglia?|コーザ ミ コンスィッリア？
È buonissimo|エ ブォニッスィモ
Il conto, per favore|イル コント、ペル ファヴォーレ
Sono vegetariano/a|ソーノ ヴェジェタリアーノ／ナ
Senza carne, per favore|センツァ カルネ、ペル ファヴォーレ
Ho un'allergia|オ ウナッレルジーア
Quanto costa?|クアント コスタ？
Può fare uno sconto?|プオ ファーレ ウーノ スコント？
Posso vedere questo?|ポッソ ヴェデーレ クエスト？
È un po' piccolo|エ ウン ポ ピッコロ
È un po' grande|エ ウン ポ グランデ
Accettate carte di credito?|アッチェッターテ カルテ ディ クレーディト？
Aiuto!|アイウート！
Dov'è l'ospedale?|ドヴェ ロスペダーレ？
Buongiorno, posso aiutarla?|ブォンジョルノ、ポッソ アイウタールラ？
uno|ウーノ
due|ドゥエ
tre|トレ
quattro|クアットロ
cinque|チンクエ
sei|セイ
sette|セッテ
otto|オット
nove|ノーヴェ
dieci|ディエーチ`],
  "スペイン語": ["es-ES", `Perdón|ペルドン
Gracias|グラシアス
Sí|スィ
No|ノ
No entiendo|ノ エンティエンド
¿Habla inglés?|アブラ イングレス？
Buenos días|ブエノス ディアス
Hola|オラ
Buenas noches|ブエナス ノチェス
Buenas noches|ブエナス ノチェス
Encantado/a|エンカンタード／ダ
Mucho gusto|ムーチョ グスト
¿Cómo está?|コモ エスタ？
¿Y usted?|イ ウステ？
¿Cómo se llama?|コモ セ ヤマ？
¿De dónde es?|デ ドンデ エス？
¿Dónde vive?|ドンデ ビベ？
¿A qué se dedica?|ア ケ セ デディカ？
¿Cuáles son sus aficiones?|クアレス ソン スス アフィシオネス？
¿Habla ○○?|アブラ ○○？
¿Por qué estudia ○○?|ポル ケ エストゥディア ○○？
Porque ○○|ポルケ ○○
¿Cuánto tiempo lleva estudiando ○○?|クアント ティエンポ イェバ エストゥディアンド ○○？
¿Alguna vez ha ○○?|アルグナ ベス ア ○○？
¿Le gusta ○○?|レ グスタ ○○？
¿Qué significa ○○?|ケ シグニフィカ ○○？
Así es|アシ エス
Ya veo|ヤ ベオ
Bueno, es que…|ブエノ、エス ケ…
¿Puede repetirlo?|プエデ レペティルロ？
¿Puede hablar más despacio?|プエデ アブラル マス デスパシオ？
Un momento, por favor|ウン モメント、ポル ファボール
¿Puedo ○○?|プエド ○○？
¿Podría ○○?|ポドリア ○○？
¿Se puede ○○?|セ プエデ ○○？
¿Tiene ○○?|ティエネ ○○？
¿Cuándo ○○?|クアンド ○○？
¿Qué hora es?|ケ オラ エス？
¿Quién es esa persona?|キエン エス エサ ペルソナ？
¿Dónde está ○○?|ドンデ エスタ ○○？
Quiero ir a ○○|キエロ イル ア ○○
¿Cómo se va a ○○?|コモ セ バ ア ○○？
A ○○, por favor|ア ○○、ポル ファボール
Aquí está bien|アキ エスタ ビエン
¿Cuál ○○?|クアル ○○？
A la izquierda|ア ラ イスキエルダ
A la derecha|ア ラ デレチャ
Todo recto|トド レクト
Uno de estos, por favor|ウノ デ エストス、ポル ファボール
Quiero esto|キエロ エスト
¿Qué me recomienda?|ケ メ レコミエンダ？
Está muy rico|エスタ ムイ リコ
La cuenta, por favor|ラ クエンタ、ポル ファボール
Soy vegetariano/a|ソイ ベヘタリアノ／ナ
Sin carne, por favor|シン カルネ、ポル ファボール
Tengo alergia|テンゴ アレルヒア
¿Cuánto cuesta?|クアント クエスタ？
¿Me hace un descuento?|メ アセ ウン デスクエント？
¿Puedo ver esto?|プエド ベル エスト？
Es un poco pequeño|エス ウン ポコ ペケーニョ
Es un poco grande|エス ウン ポコ グランデ
¿Aceptan tarjeta de crédito?|アセプタン タルヘタ デ クレディト？
¡Ayuda!|アユダ！
¿Dónde está el hospital?|ドンデ エスタ エル オスピタル？
Hola, ¿qué desea?|オラ、ケ デセア？
uno|ウノ
dos|ドス
tres|トレス
cuatro|クアトロ
cinco|シンコ
seis|セイス
siete|シエテ
ocho|オチョ
nueve|ヌエベ
diez|ディエス`],
  "ドイツ語": ["de-DE", `Entschuldigung|エントシュルディグング
Danke|ダンケ
Ja|ヤー
Nein|ナイン
Ich verstehe nicht|イッヒ フェアシュテーエ ニヒト
Sprechen Sie Englisch?|シュプレッヒェン ズィー エングリッシュ？
Guten Morgen|グーテン モルゲン
Guten Tag|グーテン ターク
Guten Abend|グーテン アーベント
Gute Nacht|グーテ ナハト
Freut mich|フロイト ミッヒ
Schön, Sie kennenzulernen|シェーン、ズィー ケネンツーレルネン
Wie geht es Ihnen?|ヴィー ゲート エス イーネン？
Und Ihnen?|ウント イーネン？
Wie heißen Sie?|ヴィー ハイセン ズィー？
Woher kommen Sie?|ヴォーヘア コメン ズィー？
Wo wohnen Sie?|ヴォー ヴォーネン ズィー？
Was machen Sie beruflich?|ヴァス マッヘン ズィー ベルーフリッヒ？
Was sind Ihre Hobbys?|ヴァス ズィント イーレ ホビス？
Sprechen Sie ○○?|シュプレッヒェン ズィー ○○？
Warum lernen Sie ○○?|ヴァルム レルネン ズィー ○○？
Weil ○○|ヴァイル ○○
Wie lange lernen Sie schon ○○?|ヴィー ランゲ レルネン ズィー ショーン ○○？
Haben Sie schon einmal ○○?|ハーベン ズィー ショーン アインマール ○○？
Mögen Sie ○○?|メーゲン ズィー ○○？
Was bedeutet ○○?|ヴァス ベドイテット ○○？
Genau|ゲナウ
Ach so|アッハ ゾー
Hm, eher nicht…|フム、エーア ニヒト…
Können Sie das wiederholen?|ケネン ズィー ダス ヴィーダーホーレン？
Können Sie langsamer sprechen?|ケネン ズィー ラングザーマー シュプレッヒェン？
Einen Moment, bitte|アイネン モメント、ビッテ
Darf ich ○○?|ダルフ イッヒ ○○？
Könnten Sie ○○?|ケンテン ズィー ○○？
Kann man ○○?|カン マン ○○？
Haben Sie ○○?|ハーベン ズィー ○○？
Wann haben Sie ○○?|ヴァン ハーベン ズィー ○○？
Wie spät ist es?|ヴィー シュペート イスト エス？
Wer ist das?|ヴェア イスト ダス？
Wo ist ○○?|ヴォー イスト ○○？
Ich möchte nach ○○|イッヒ メヒテ ナーハ ○○
Wie komme ich nach ○○?|ヴィー コンメ イッヒ ナーハ ○○？
Nach ○○, bitte|ナーハ ○○、ビッテ
Hier ist gut|ヒーア イスト グート
Welcher ○○?|ヴェルヒャー ○○？
Links|リンクス
Rechts|レヒツ
Geradeaus|ゲラーデアウス
Einmal das, bitte|アインマール ダス、ビッテ
Ich nehme das|イッヒ ネーメ ダス
Was empfehlen Sie?|ヴァス エンプフェーレン ズィー？
Sehr lecker|ゼーア レッカー
Die Rechnung, bitte|ディー レヒヌング、ビッテ
Ich bin Vegetarier(in)|イッヒ ビン ヴェゲターリアー（リン）
Ohne Fleisch, bitte|オーネ フライシュ、ビッテ
Ich habe eine Allergie|イッヒ ハーベ アイネ アレルギー
Wie viel kostet das?|ヴィー フィール コステット ダス？
Geht es etwas günstiger?|ゲート エス エトヴァス ギュンスティガー？
Kann ich das sehen?|カン イッヒ ダス ゼーエン？
Etwas zu klein|エトヴァス ツー クライン
Etwas zu groß|エトヴァス ツー グロース
Kann ich mit Kreditkarte zahlen?|カン イッヒ ミット クレディートカルテ ツァーレン？
Hilfe!|ヒルフェ！
Wo ist das Krankenhaus?|ヴォー イスト ダス クランケンハウス？
Guten Tag, kann ich Ihnen helfen?|グーテン ターク、カン イッヒ イーネン ヘルフェン？
eins|アインス
zwei|ツヴァイ
drei|ドライ
vier|フィーア
fünf|フュンフ
sechs|ゼクス
sieben|ズィーベン
acht|アハト
neun|ノイン
zehn|ツェーン`],
};
// 上の訳の並び（作ったときの順）。PHRASE_LIST の順を変えても、日本語で引くのでずれない
const BUILTIN_PHRASE_ORDER = [
  "すみません", "ありがとうございます", "はい", "いいえ", "わかりません", "英語が話せますか？", "おはようございます", "こんにちは",
  "こんばんは", "おやすみなさい", "はじめまして", "よろしくお願いします", "元気ですか？", "あなたはどうですか？", "お名前はなんですか？", "出身はどこですか？",
  "どこに住んでいますか？", "お仕事は何をしていますか？", "趣味はなんですか？", "○○語を話しますか？", "なぜ○○語を勉強していますか？", "なぜなら○○だからです", "どのくらい○○を学んでいますか？", "○○したことはありますか？",
  "○○が好きですか？", "○○はどういう意味ですか？", "そうですね", "なるほど", "ちょっと…（遠回しに断る）", "もう一度言ってください", "ゆっくり話してください", "ちょっと待ってください",
  "○○してもいいですか？", "○○していただけますか？", "○○ができますか？", "○○がありますか？", "いつ○○しましたか？", "何時ですか？", "あの方はどなたですか？", "○○はどこですか？",
  "○○に行きたいです", "○○まではどうやって行きますか？", "○○までお願いします（タクシーで）", "ここでいいです（降ります）", "どの○○ですか？", "左", "右", "まっすぐ",
  "これをひとつ", "これをください", "なにがおすすめですか？", "おいしいです", "お会計お願いします", "ベジタリアンです", "肉なしでお願いします", "アレルギーがあります",
  "いくらですか？", "安くなりますか？", "これを見せてください", "ちょっと小さいです", "ちょっと大きいです", "クレジットカードは使えますか？", "助けて！", "病院はどこですか？",
  "いらっしゃいませ（お店で言われる言葉）", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "10",
];
// 言語名 → 旅行データの phrases と同じ形（{ lang, bcp, items:[{cat, ja, local, reading}], builtin: true }）
function builtinPhrases(lang) {
  const d = BUILTIN_PHRASE_DATA[lang];
  if (!d) return null;
  const rows = d[1].split("\n");
  const items = PHRASE_LIST.map(p => { const i = BUILTIN_PHRASE_ORDER.indexOf(p.ja); const [local, reading] = (i < 0 ? "" : rows[i] || "").split("|"); return local ? { cat: p.cat, ja: p.ja, local, reading: reading || "" } : null; }).filter(Boolean);
  return { lang, bcp: d[0], countries: [], items, builtin: true };
}
// 自分で足したフレーズ（t.phraseCustom = [{ id, lang, ja, local, reading }]）を、その言語のフレーズ集の先頭に混ぜる
const PHRASE_CUSTOM_CAT = "自分で足したもの";
function withCustomPhrases(t) {
  const list = (t.phraseCustom || []).filter(c => c && c.lang && c.ja && c.local);
  if (!list.length) return t;
  const ph = { ...(t.phrases || {}) };
  [...new Set(list.map(c => c.lang))].forEach(lang => {
    const mine = list.filter(c => c.lang === lang).map(c => ({ cat: PHRASE_CUSTOM_CAT, ja: c.ja, local: c.local, reading: c.reading || "", custom: c.id }));
    const cur = ph[lang], l = tripLanguages(t).find(x => x.lang === lang) || {};
    ph[lang] = cur ? { ...cur, items: [...mine, ...(cur.items || []).filter(i => !i.custom)] } : { lang, bcp: l.bcp || "", countries: l.countries || [], items: mine, customOnly: true };
  });
  return { ...t, phrases: ph };
}
// 旅行先の言語のうち、まだフレーズ集がないものに、最初から入っている訳を足す
function withBuiltinPhrases(t) {
  const have = t.phrases || {}, add = {};
  tripLanguages(t).forEach(l => { if (!have[l.lang]) { const b = builtinPhrases(l.lang); if (b) add[l.lang] = { ...b, bcp: l.bcp || b.bcp, countries: l.countries }; } });
  return Object.keys(add).length ? { ...t, phrases: { ...have, ...add } } : t;
}
