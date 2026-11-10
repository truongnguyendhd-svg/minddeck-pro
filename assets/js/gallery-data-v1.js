/* ==========================================================================
 * [EXTRACT DATA] MINDDECK PRO — DỮ LIỆU GALLERY: 12 chủ đề × 12 ảnh 1344×768
 * Tách khỏi index.html (HTML gọn hơn + file này cache immutable 1 năm theo vercel.json).
 * 12 biến: GALLERY_DB 'nhà cửa' [T88/T94] + GALLERY_MARKET_DB [T92] + GALLERY_SCHOOL_DB [T93]
 *   + GALLERY_FOOD_DB [T95] + GALLERY_FUN_DB [T96] + GALLERY_TECH_DB [T97] + GALLERY_HOBBY_DB [T99]
 *   + GALLERY_HEALTH_DB [T100] + GALLERY_CITY_DB [T101] + GALLERY_SPORT_DB [T102]
 *   + GALLERY_WEATHER_DB [T103] + GALLERY_CLOTHES_DB [T104] — 876 từ vựng có kanji + kana + nghĩa Việt.
 * Nạp: <script src="assets/js/gallery-data-v1.js"></script> TRƯỚC script chính trong index.html
 *   (GALLERY_THEMES + dgwSetTheme chọn chủ đề ngẫu nhiên lúc init cần dữ liệu ngay lúc parse).
 * ⚠ SỬA DỮ LIỆU → BUMP TÊN FILE v1→v2 + sửa <script src> trong index.html
 *   (Cache-Control immutable 1 năm — trình duyệt không hỏi lại bản cũ).
 * ========================================================================== */
/* ---------- [T94] ĐỒNG BỘ THIẾT KẾ CHỦ ĐỀ 'nhà cửa' THEO CHUẨN 'trường học' ([T93c]) ----------
   Làm lại 12 ảnh nhà cửa theo pipeline gốc (AI art → VLM grounding → PIL compose):
   AI edit xóa nhãn cũ GIỮ NGUYÊN cảnh quen thuộc → VLM định vị lại sự vật → PIL vẽ chip
   kiểu sơ đồ khoa học T93c: chip trắng viền teal 2.5px bo góc 8px XẾP Ở 4 CẠNH ẢNH,
   3 DÒNG kanji đậm #1F2937 / kana teal #0D9488 / nghĩa Việt xám #4B5563 (font M PLUS
   Rounded 1c — cùng họ rounded gothic bộ trường học), đường nối teal 3px, pin đồng tâm
   20px (viền teal + vòng trắng + lõi 12px), không đè sự vật. Bộ từ tối ưu theo T92b:
   nâng từ thuần kana lên dạng kanji chuẩn N5 (窓/冷蔵庫/鍋/流し/包丁/まな板/茶碗/時計/枕/毛布/鏡/石鹸/
   洗面台/靴箱/傘/傘立て/靴/鉛筆/本/机/椅子/本棚/箸/皿/洗剤/洗濯機/絵本/布団/畳/座布団/花瓶/木/草/
   犬小屋/屋根/煙突/庭/壁), thay từ mất vật sau edit (障子+こたつ→テーブル+花, bỏ 鳥/門, +洗濯物/
   炊飯器), đủ 6-8 từ/ảnh; QA VLM 12/12 PASS (pin đúng vật + chip sát mép + chữ sạch). */
/* [T105] words: [[jp, kana, vi], ...] mỗi entry = DANH SÁCH TỪ VỰNG chip CÓ TRÊN ẢNH
   (VLM OCR 144/144 ảnh — đếm từ khớp nhãn '— N từ vựng' 144/144, tổng 876 từ khớp
   commit pipeline T94-T104, bộ từ khớp 72/72 ở T96/T97/T103/T104) — lightbox hiển thị
   #dgwLbWords để bôi đen từ vựng → selection popover tra từ/AI/đọc phát âm. */
var GALLERY_DB = [
    { jp: 'リビング', kana: '', romaji: 'ribingu', vi: 'Phòng khách — 8 từ vựng', words: [['エアコン','','máy điều hòa'], ['窓','まど','cửa sổ'], ['ランプ','','đèn'], ['ドア','','cửa'], ['テレビ','','ti vi'], ['ソファ','','ghế sofa'], ['テーブル','','cái bàn'], ['カーペット','','thảm']], img: 'assets/gallery/nha-cua-01.jpg' },
    { jp: '台所', kana: 'だいどころ', romaji: 'daidokoro', vi: 'Nhà bếp — 8 từ vựng', words: [['流し','ながし','bồn rửa'], ['鍋','なべ','cái nồi'], ['冷蔵庫','れいぞうこ','tủ lạnh'], ['炊飯器','すいはんき','nồi cơm điện'], ['コンロ','','bếp gas'], ['茶碗','ちゃわん','cái bát'], ['包丁','ほうちょう','con dao'], ['まな板','まないた','thớt']], img: 'assets/gallery/nha-cua-02.jpg' },
    { jp: '寝室', kana: 'しんしつ', romaji: 'shinshitsu', vi: 'Phòng ngủ — 8 từ vựng', words: [['窓','まど','cửa sổ'], ['ランプ','','đèn'], ['カーテン','','rèm cửa'], ['たんす','','tủ quần áo'], ['時計','とけい','đồng hồ'], ['枕','まくら','cái gối'], ['ベッド','','cái giường'], ['毛布','もうふ','cái chăn']], img: 'assets/gallery/nha-cua-03.jpg' },
    { jp: 'お風呂', kana: 'おふろ', romaji: 'ofuro', vi: 'Phòng tắm — 6 từ vựng', words: [['鏡','かがみ','cái gương'], ['シャワー','','vòi sen'], ['タオル','','khăn tắm'], ['洗面台','せんめんだい','bồn rửa mặt'], ['バスタブ','','bồn tắm'], ['石鹸','せっけん','xà phòng']], img: 'assets/gallery/nha-cua-04.jpg' },
    { jp: '玄関', kana: 'げんかん', romaji: 'genkan', vi: 'Lối vào nhà — 6 từ vựng', words: [['ドア','','cửa'], ['傘','かさ','cây ô'], ['靴箱','くつばこ','tủ giày'], ['傘立て','かさたて','giá ô'], ['靴','くつ','đôi giày'], ['マット','','thảm chùi chân']], img: 'assets/gallery/nha-cua-05.jpg' },
    { jp: '書斎', kana: 'しょさい', romaji: 'shosai', vi: 'Phòng học — 7 từ vựng', words: [['ランプ','','đèn'], ['パソコン','','máy tính'], ['鉛筆','えんぴつ','bút chì'], ['本棚','ほんだな','giá sách'], ['本','ほん','quyển sách'], ['机','つくえ','bàn học'], ['椅子','いす','cái ghế']], img: 'assets/gallery/nha-cua-06.jpg' },
    { jp: 'ダイニング', kana: '', romaji: 'dainingu', vi: 'Phòng ăn — 7 từ vựng', words: [['コップ','','cái cốc'], ['スプーン','','cái thìa'], ['椅子','いす','cái ghế'], ['皿','さら','cái đĩa'], ['茶碗','ちゃわん','cái bát'], ['箸','はし','đôi đũa'], ['テーブル','','cái bàn']], img: 'assets/gallery/nha-cua-07.jpg' },
    { jp: '洗面所', kana: 'せんめんしょ', romaji: 'senmensho', vi: 'Phòng giặt — 7 từ vựng', words: [['洗剤','せんざい','bột giặt'], ['ハンガー','','móc áo'], ['洗濯物','せんたくもの','quần áo giặt'], ['洗濯機','せんたくき','máy giặt'], ['タオル','','khăn'], ['かご','','cái giỏ'], ['アイロン','','bàn ủi']], img: 'assets/gallery/nha-cua-08.jpg' },
    { jp: '子供部屋', kana: 'こどもべや', romaji: 'kodomobeya', vi: 'Phòng trẻ em — 7 từ vựng', words: [['ぬいぐるみ','','gấu bông'], ['ベッド','','cái giường'], ['クレヨン','','bút sáp'], ['絵本','えほん','sách tranh'], ['ボール','','quả bóng'], ['おもちゃ','','đồ chơi'], ['ロボット','','robot']], img: 'assets/gallery/nha-cua-09.jpg' },
    { jp: '和室', kana: 'わしつ', romaji: 'washitsu', vi: 'Phòng Nhật — 6 từ vựng', words: [['テーブル','','cái bàn'], ['布団','ふとん','nệm futon'], ['座布団','ざぶとん','đệm ngồi'], ['畳','たたみ','chiếu tatami'], ['花','はな','bông hoa'], ['花瓶','かびん','bình hoa']], img: 'assets/gallery/nha-cua-10.jpg' },
    { jp: '庭', kana: 'にわ', romaji: 'niwa', vi: 'Khu vườn — 6 từ vựng', words: [['フェンス','','hàng rào'], ['木','き','cái cây'], ['花','はな','bông hoa'], ['じょうろ','','bình tưới'], ['犬小屋','いぬごや','nhà cho chó'], ['草','くさ','cỏ']], img: 'assets/gallery/nha-cua-11.jpg' },
    { jp: '家', kana: 'いえ', romaji: 'ie', vi: 'Ngôi nhà — 7 từ vựng', words: [['屋根','やね','mái nhà'], ['煙突','えんとつ','ống khói'], ['窓','まど','cửa sổ'], ['壁','かべ','bức tường'], ['庭','にわ','khu vườn'], ['ドア','','cửa'], ['ポスト','','hộp thư']], img: 'assets/gallery/nha-cua-12.jpg' },
];
/* ---------- [T92] CHỦ ĐỀ GALLERY — 'nhà cửa' + 'chợ' (market) + 'trường học' (school [T93]) ----------
   GALLERY_MARKET_DB: 12 ảnh cảnh chợ/mua sắm 1344x768 (市場/野菜屋/果物屋/魚屋/肉屋/
   パン屋/米屋/花屋/レジ/買い物/弁当屋/スーパー) — 75 từ vựng ƯU TIÊN DẠNG KANJI (34 từ:
   屋台・看板・自転車・大根・魚・氷・牛肉・豚肉・鶏肉・ひき肉・皿・米・袋・秤・花・花瓶・お金・
   財布・硬貨・買い物かご・割引・店・買い物袋・弁当・箸・海苔・お茶・棚・商品・値段・入り口)
   + CÁCH ĐỌC KANA teal trong chip — 3 DÒNG: kanji / kana / nghĩa Việt; từ thuần kana
   giữ chip 2 dòng vì chính từ đã là cách đọc ([T92b] user: 'từ vựng có kanji thì phải
   thêm cách đọc kana') + đường nối teal xuống đúng sự vật (pipeline T88: AI art → VLM
   grounding → PIL compose; QA VLM 12/12 PASS). [T92] lúc tải trang chọn NGẪU NHIÊN 1 chủ đề — nút chủ đề đó ĐẬM
   (is-active); bấm nút chủ đề để đổi gallery (dgwSetTheme). */
/* ---------- [T94] ĐỒNG BỘ THIẾT KẾ CHỦ ĐỀ 'chợ' THEO CHUẨN 'trường học' ([T93c]) ----------
   Làm lại 12 ảnh chợ cùng pipeline T94: AI edit xóa nhãn cũ giữ nguyên cảnh sạp/chợ →
   VLM grounding lại → PIL compose chip 4 cạnh kiểu T93c (3 dòng kanji/kana teal/nghĩa Việt,
   đường nối teal 3px, pin đồng tâm 20px, không đè vật — hết kiểu chip thả giữa trời và đè
   bánh xe xe đạp/thùng hàng của bản cũ T92). Bộ từ tối ưu: giữ khối từ kanji ưu tiên (屋台/看板/
   自転車/大根/魚/氷/牛肉/豚肉/鶏肉/ひき肉/皿/米/袋/秤/花/花瓶/お金/財布/硬貨/買い物かご/割引/店/買い物袋/
   弁当/海苔/棚/商品/値段/入り口...), thay từ mất vật sau edit (ハム→ステーキ, レシート→お札,
   バゲット→ロールパン, bỏ 箸, +りんご/重り), đủ 6-8 từ/ảnh; QA VLM 12/12 PASS. */
var GALLERY_MARKET_DB = [
    { jp: '市場', kana: 'いちば', romaji: 'ichiba', vi: 'Khu chợ — 7 từ vựng', words: [['テント','','mái bạt'], ['看板','かんばん','biển hiệu'], ['屋台','やたい','quầy hàng'], ['りんご','','quả táo'], ['自転車','じてんしゃ','xe đạp'], ['箱','はこ','cái thùng'], ['かご','','cái giỏ']], img: 'assets/gallery/cho-01.jpg' },
    { jp: '野菜屋', kana: 'やおや', romaji: 'yaoya', vi: 'Sạp rau củ — 7 từ vựng', words: [['きゃべつ','','bắp cải'], ['トマト','','cà chua'], ['にんじん','','cà rốt'], ['大根','だいこん','củ cải'], ['ピーマン','','ớt chuông'], ['たまねぎ','','hành tây'], ['じゃがいも','','khoai tây']], img: 'assets/gallery/cho-02.jpg' },
    { jp: '果物屋', kana: 'くだものや', romaji: 'kudamono-ya', vi: 'Sạp trái cây — 7 từ vựng', words: [['りんご','','quả táo'], ['バナナ','','quả chuối'], ['オレンジ','','quả cam'], ['いちご','','dâu tây'], ['ぶどう','','chùm nho'], ['すいか','','dưa hấu'], ['みかん','','quả quýt']], img: 'assets/gallery/cho-03.jpg' },
    { jp: '魚屋', kana: 'さかなや', romaji: 'sakana-ya', vi: 'Sạp cá — 7 từ vựng', words: [['魚','さかな','con cá'], ['かに','','con cua'], ['いか','','con mực'], ['えび','','con tôm'], ['たこ','','bạch tuộc'], ['あさり','','con nghêu'], ['氷','こおり','đá lạnh']], img: 'assets/gallery/cho-04.jpg' },
    { jp: '肉屋', kana: 'にくや', romaji: 'niku-ya', vi: 'Sạp thịt — 6 từ vựng', words: [['鶏肉','とりにく','thịt gà'], ['ソーセージ','','xúc xích'], ['ステーキ','','bít tết'], ['豚肉','ぶたにく','thịt lợn'], ['牛肉','ぎゅうにく','thịt bò'], ['ひき肉','ひきにく','thịt băm']], img: 'assets/gallery/cho-05.jpg' },
    { jp: 'パン屋', kana: 'ぱんや', romaji: 'pan-ya', vi: 'Tiệm bánh mì — 6 từ vựng', words: [['クロワッサン','','bánh sừng bò'], ['ケーキ','','bánh kem'], ['ロールパン','','bánh mì cuộn'], ['パン','','bánh mì'], ['トレー','','cái khay'], ['皿','さら','cái đĩa']], img: 'assets/gallery/cho-06.jpg' },
    { jp: '米屋', kana: 'こめや', romaji: 'kome-ya', vi: 'Sạp gạo — 6 từ vựng', words: [['秤','はかり','cái cân'], ['重り','おもり','quả cân'], ['袋','ふくろ','cai bao'], ['米','こめ','gạo'], ['ひしゃく','','muỗng xúc'], ['段ボール','だんボール','thùng carton']], img: 'assets/gallery/cho-07.jpg' },
    { jp: '花屋', kana: 'はなや', romaji: 'hana-ya', vi: 'Sạp hoa — 7 từ vựng', words: [['チューリップ','','hoa tulip'], ['ひまわり','','hoa hướng dương'], ['バラ','','hoa hồng'], ['花瓶','かびん','bình hoa'], ['じょうろ','','bình tưới'], ['花','はな','bông hoa'], ['ブーケ','','bó hoa']], img: 'assets/gallery/cho-08.jpg' },
    { jp: 'レジ', kana: 'れじ', romaji: 'reji', vi: 'Quầy thu ngân — 6 từ vựng', words: [['レジ','','quầy thu ngân'], ['お札','おさつ','tiền giấy'], ['財布','さいふ','cái ví'], ['お金','おかね','tiền'], ['硬貨','こうか','tiền xu'], ['カード','','thẻ']], img: 'assets/gallery/cho-09.jpg' },
    { jp: '買い物', kana: 'かいもの', romaji: 'kaimono', vi: 'Mua sắm — 6 từ vựng', words: [['店','みせ','cửa hàng'], ['割引','わりびき','giảm giá'], ['買い物袋','かいものぶくろ','túi mua hàng'], ['エコバッグ','','túi vải'], ['買い物かご','かいものかご','giỏ mua hàng'], ['メモ','','ghi chú']], img: 'assets/gallery/cho-10.jpg' },
    { jp: '弁当屋', kana: 'べんとうや', romaji: 'bentou-ya', vi: 'Quầy cơm hộp — 6 từ vựng', words: [['おにぎり','','cơm nắm'], ['コロッケ','','bánh croquette'], ['お茶','おちゃ','trà'], ['テーブル','','cái bàn'], ['弁当','べんとう','cơm hộp'], ['海苔','のり','rong biển']], img: 'assets/gallery/cho-11.jpg' },
    { jp: 'スーパー', kana: 'すーぱー', romaji: 'suupaa', vi: 'Siêu thị — 6 từ vựng', words: [['冷蔵ケース','れいぞうケース','tủ mát'], ['入り口','いりぐち','lối vào'], ['カート','','xe đẩy'], ['商品','しょうひん','hàng hóa'], ['値段','ねだん','cái giá'], ['棚','たな','kệ hàng']], img: 'assets/gallery/cho-12.jpg' },
];
/* ---------- [T93] CHỦ ĐỀ GALLERY 'trường học' (school) ----------
   GALLERY_SCHOOL_DB: 12 ảnh cảnh trường học 1344x768 (教室/校門/グラウンド/図書室/
   音楽室/理科室/美術室/保健室/給食/下駄箱/プール/通学路) — 69 từ vựng (43 từ kanji,
   chip ảnh 3 DÒNG kèm CÁCH ĐỌC KANA teal như [T92b] — user: 'từ vựng có kanji thì
   phải thêm cách đọc kana') + đường nối teal tới sự vật (pipeline T88/T92:
   AI art → VLM grounding → PIL compose). [T93c] chip XẾP Ở CÁC CẠNH ẢNH (cột mép
   trái/phải + hàng mép trên/dưới) rồi nối bezier tới pin — kiểu sơ đồ khoa học,
   không đè sự vật, không chồng lấn (user: 'ô từ vựng xếp ở các cạnh của ảnh rồi
   nối đến hình thì nhìn khoa học hơn'); pin 門 koumon re-ground (672,245) đúng
   khung cổng; đường nối đậm 3px + chấm pin to; QA VLM lại 12/12 ảnh PASS
   (pin đúng vật + chip sát mép + sạch). Nút chủ đề
   thứ 3 'trường học' trong #dgwThemes; lúc tải chọn NGẪU NHIÊN 1 trong 12 chủ đề. */
var GALLERY_SCHOOL_DB = [
    { jp: '教室', kana: 'きょうしつ', romaji: 'kyoushitsu', vi: 'Lớp học — 6 từ vựng', words: [['時計','とけい','đồng hồ'], ['黒板','こくばん','bảng đen'], ['チョーク','','viên phấn'], ['掃除用具','そうじようぐ','dụng cụ vệ sinh'], ['机','つくえ','bàn học'], ['椅子','いす','ghế']], img: 'assets/gallery/truong-hoc-01.jpg' },
    { jp: '校門', kana: 'こうもん', romaji: 'koumon', vi: 'Cổng trường — 6 từ vựng', words: [['鳥','とり','chim'], ['門','もん','cổng'], ['桜','さくら','hoa anh đào'], ['看板','かんばん','biển tên trường'], ['木','き','cây'], ['石段','いしだん','bậc thang đá']], img: 'assets/gallery/truong-hoc-02.jpg' },
    { jp: 'グラウンド', kana: '', romaji: 'guraundo', vi: 'Sân trường — 6 từ vựng', words: [['旗','はた','cờ'], ['鉄棒','てつぼう','xà đơn'], ['ベンチ','','ghế dài'], ['笛','ふえ','còi'], ['バット','','gậy bóng chày'], ['サッカーボール','','bóng đá']], img: 'assets/gallery/truong-hoc-03.jpg' },
    { jp: '図書室', kana: 'としょしつ', romaji: 'toshoshitsu', vi: 'Thư viện trường — 6 từ vựng', words: [['本棚','ほんだな','kệ sách'], ['パソコン','','máy tính'], ['カウンター','','quầy mượn sách'], ['本','ほん','sách'], ['辞書','じしょ','từ điển'], ['ベル','','chuông thư viện']], img: 'assets/gallery/truong-hoc-04.jpg' },
    { jp: '音楽室', kana: 'おんがくしつ', romaji: 'ongakushitsu', vi: 'Phòng âm nhạc — 6 từ vựng', words: [['太鼓','たいこ','trống taiko'], ['楽譜','がくふ','bản nhạc'], ['ピアノ','','dàn piano'], ['トランペット','','kèn trumpet'], ['バイオリン','','dàn violin'], ['リコーダー','','sáo recorder']], img: 'assets/gallery/truong-hoc-05.jpg' },
    { jp: '理科室', kana: 'りかしつ', romaji: 'rikashitsu', vi: 'Phòng thí nghiệm — 6 từ vựng', words: [['地球儀','ちきゅうぎ','quả địa cầu'], ['顕微鏡','けんびきょう','kính hiển vi'], ['試験管','しけんかん','ống nghiệm'], ['消火器','しょうかき','bình cứu hỏa'], ['フラスコ','','bình cầu'], ['ロウソク','','nến']], img: 'assets/gallery/truong-hoc-06.jpg' },
    { jp: '美術室', kana: 'びじゅつしつ', romaji: 'bijutsushitsu', vi: 'Phòng mỹ thuật — 6 từ vựng', words: [['彫刻','ちょうこく','tượng điêu khắc'], ['画用紙','がようし','giấy vẽ'], ['筆','ふで','cọ vẽ'], ['エプロン','','tạp dề'], ['イーゼル','','khung giá vẽ'], ['絵の具','えのぐ','màu vẽ']], img: 'assets/gallery/truong-hoc-07.jpg' },
    { jp: '保健室', kana: 'ほけんしつ', romaji: 'hokenshitsu', vi: 'Phòng y tế — 6 từ vựng', words: [['枕','まくら','gối'], ['救急箱','きゅうきゅうばこ','hộp cứu thương'], ['ベッド','','giường'], ['ばんそうこう','','băng dán'], ['体温計','たいおんけい','nhiệt kế'], ['体重計','たいじゅうけい','cân sức khỏe']], img: 'assets/gallery/truong-hoc-08.jpg' },
    { jp: '給食', kana: 'きゅうしょく', romaji: 'kyuushoku', vi: 'Bữa ăn trường học — 6 từ vựng', words: [['パン','','bánh mì'], ['皿','さら','đĩa'], ['牛乳','ぎゅうにゅう','sữa'], ['コップ','','cốc'], ['スプーン','','thìa'], ['フォーク','','nĩa']], img: 'assets/gallery/truong-hoc-09.jpg' },
    { jp: '下駄箱', kana: 'げたばこ', romaji: 'getabako', vi: 'Tủ giày — 5 từ vựng', words: [['帽子','ぼうし','mũ'], ['傘','かさ','ô / dù'], ['靴','くつ','giày'], ['傘立て','かさたて','giá ô'], ['上履き','うわばき','dép trong trường']], img: 'assets/gallery/truong-hoc-10.jpg' },
    { jp: 'プール', kana: '', romaji: 'puuru', vi: 'Bể bơi trường — 5 từ vựng', words: [['タオル','','khăn tắm'], ['水着','みずぎ','đồ bơi'], ['浮き輪','うきわ','phao bơi'], ['ボード','','ván bơi'], ['ゴーグル','','kính bơi']], img: 'assets/gallery/truong-hoc-11.jpg' },
    { jp: '通学路', kana: 'つうがくろ', romaji: 'tsuugakuro', vi: 'Đường đến trường — 5 từ vựng', words: [['信号','しんごう','đèn giao thông'], ['バス','','xe buýt'], ['横断歩道','おうだんほどう','vạch sang đường'], ['花壇','かだん','luống hoa'], ['ランドセル','','balo học sinh']], img: 'assets/gallery/truong-hoc-12.jpg' },
];
/* ---------- [T95] CHỦ ĐỀ 'ĂN UỐNG' — 12 ảnh cảnh ẩm thực Nhật (GALLERY_FOOD_DB) ----------
   Thêm chủ đề thứ 4 theo pipeline T93/T94: z-ai SDK generate 12 cảnh irasutoya-style
   'no text' 1344x768 → VLM grounding tọa độ từng vật (71/71 pin, AI edit bổ sung 3 vật
   generator bỏ sót: 日本酒+揚げ物 izakaya, あんこ wagashiya) → PIL compose chuẩn T93c
   (chip trắng viền teal 2.5px bo góc 8px XẾP 4 CẠNH ẢNH, 3 dòng kanji đậm #1F2937 /
   kana teal #0D9488 / nghĩa Việt xám #4B5563, đường nối teal 3px, pin đồng tâm 20px,
   font M PLUS Rounded 1c) → QA VLM 12/12 PASS (pin đúng vật + chip sát mép + sạch).
   12 cảnh: レストラン nhà hàng・寿司屋 quán sushi・ラーメン屋 quán mì・食堂 quán cơm・
   カフェ quán cà phê・焼肉屋 quán nướng・お好み焼き屋 quán okonomiyaki・そば屋 quán soba・
   居酒屋 quán nhậu・ファストフード đồ ăn nhanh・和菓子屋 bánh ngọt Nhật・土鍋 lẩu Nhật.
   71 từ JLPT N5-N4, 30 từ kanji đều kèm cách đọc kana trong chip 3 dòng; tránh trùng từ
   3 chủ đề cũ (không dùng テーブル/鍋/皿/ケーキ/お茶/箸... đã có ở nhà cửa-chợ-trường học). */
var GALLERY_FOOD_DB = [
    { jp: 'レストラン', kana: 'れすとらん', romaji: 'resutoran', vi: 'Nhà hàng — 6 từ vựng', words: [['蝋燭','ろうそく','nến'], ['グラス','','cốc nước'], ['ナプキン','','khăn ăn'], ['ナイフ','','dao ăn'], ['フォーク','','nĩa'], ['メニュー','','thực đơn']], img: 'assets/gallery/an-uong-01.jpg' },
    { jp: '寿司屋', kana: 'すしや', romaji: 'sushiya', vi: 'Quán sushi — 6 từ vựng', words: [['しゃり','','cơm sushi'], ['いくら','','trứng cá hồi'], ['まぐろ','','cá ngừ'], ['寿司','すし','món sushi'], ['醤油','しょうゆ','nước tương'], ['わさび','','mù tạt wasabi']], img: 'assets/gallery/an-uong-02.jpg' },
    { jp: 'ラーメン屋', kana: 'らーめんや', romaji: 'raamenya', vi: 'Quán mì ramen — 6 từ vựng', words: [['のれん','','màn cửa hiệu'], ['卵','たまご','quả trứng'], ['スープ','','nước dùng'], ['チャーシュー','','thịt xá xíu'], ['ラーメン','','mì ramen'], ['丼','どんぶり','tô lớn']], img: 'assets/gallery/an-uong-03.jpg' },
    { jp: '食堂', kana: 'しょくどう', romaji: 'shokudou', vi: 'Quán cơm Nhật — 6 từ vựng', words: [['味噌汁','みそしる','súp miso'], ['漬物','つけもの','dưa muối'], ['ご飯','ごはん','cơm'], ['湯呑み','ゆのみ','cốc trà'], ['定食','ていしょく','cơm dinh dưỡng'], ['焼き魚','やきざかな','cá nướng']], img: 'assets/gallery/an-uong-04.jpg' },
    { jp: 'カフェ', kana: 'かふぇ', romaji: 'kafe', vi: 'Quán cà phê — 6 từ vựng', words: [['ミルク','','sữa'], ['紅茶','こうちゃ','trà đen'], ['カップ','','cái tách'], ['パフェ','','parfait'], ['コーヒー','','cà phê'], ['砂糖','さとう','đường']], img: 'assets/gallery/an-uong-05.jpg' },
    { jp: '焼肉屋', kana: 'やきにくや', romaji: 'yakinikuya', vi: 'Quán thịt nướng — 6 từ vựng', words: [['焼肉','やきにく','thịt nướng'], ['サラダ','','salad'], ['タレ','','nước chấm'], ['唐辛子','とうがらし','ớt'], ['カルビ','','thịt sườn bò'], ['網','あみ','lưới nướng']], img: 'assets/gallery/an-uong-06.jpg' },
    { jp: 'お好み焼き屋', kana: 'おこのみやきや', romaji: 'okonomiyakiya', vi: 'Quán bánh xèo Nhật — 6 từ vựng', words: [['コテ','','xẻng lật bánh'], ['マヨネーズ','','sốt mayonnaise'], ['ソース','','nước sốt'], ['お好み焼き','おこのみやき','bánh okonomiyaki'], ['鰹節','かつおぶし','bông cá ngừ sấy'], ['キャベツ','','bắp cải']], img: 'assets/gallery/an-uong-07.jpg' },
    { jp: 'そば屋', kana: 'そばや', romaji: 'sobaya', vi: 'Quán mì soba — 5 từ vựng', words: [['うどん','','mì udon'], ['そば','','mì soba'], ['つゆ','','nước chấm mì'], ['薬味','やくみ','rau gia vị'], ['天ぷら','','món tempura']], img: 'assets/gallery/an-uong-08.jpg' },
    { jp: '居酒屋', kana: 'いざかや', romaji: 'izakaya', vi: 'Quán nhậu Nhật — 6 từ vựng', words: [['ビール','','bia'], ['灯籠','ちょうちん','đèn lồng'], ['日本酒','にほんしゅ','rượu sake'], ['揚げ物','あげもの','món chiên'], ['串','くし','xiên nướng'], ['枝豆','えだまめ','đậu edamame']], img: 'assets/gallery/an-uong-09.jpg' },
    { jp: 'ファストフード', kana: 'ふぁすとふーど', romaji: 'fasutofuudo', vi: 'Đồ ăn nhanh — 6 từ vựng', words: [['シェイク','','sinh tố'], ['コーラ','','nước cola'], ['ケチャップ','','tương cà'], ['ポテト','','khoai tây chiên'], ['ハンバーガー','','bánh mì kẹp thịt'], ['チキン','','gà rán']], img: 'assets/gallery/an-uong-10.jpg' },
    { jp: '和菓子屋', kana: 'わがしや', romaji: 'wagashiya', vi: 'Quán bánh ngọt Nhật — 6 từ vựng', words: [['餅','もち','bánh gạo nếp'], ['和菓子','わがし','bánh ngọt Nhật'], ['抹茶','まっちゃ','trà xanh bột'], ['あんこ','','nhân đậu đỏ'], ['団子','だんご','bánh dango'], ['たいやき','','bánh cá tai']], img: 'assets/gallery/an-uong-11.jpg' },
    { jp: '土鍋', kana: 'どんなべ', romaji: 'donabe', vi: 'Bữa lẩu Nhật — 6 từ vựng', words: [['豆腐','とうふ','đậu phụ'], ['白菜','はくさい','cải trắng'], ['土鍋','どんなべ','nồi lẩu đất'], ['きのこ','','nấm'], ['ポン酢','','nước chấm ponzu'], ['だし','','nước dashi']], img: 'assets/gallery/an-uong-12.jpg' },
];
/* ---------- [T96] CHỦ ĐỀ 'KHU VUI CHƠI VÀ DU LỊCH' — 12 ảnh cảnh (GALLERY_FUN_DB) ----------
   Thêm chủ đề thứ 5 theo pipeline T93/T94/T95: z-ai SDK generate 12 cảnh irasutoya-style
   'no text' 1344x768 → VLM grounding tọa độ từng vật (72/72 pin) → PIL compose chuẩn T93c
   (chip trắng viền teal 2.5px bo góc 8px XẾP 4 CẠNH ẢNH, 3 dòng kanji đậm #1F2937 /
   kana teal #0D9488 / nghĩa Việt xám #4B5563, đường nối teal 3px, pin đồng tâm 20px,
   font M PLUS Rounded 1c) → QA VLM 12/12 PASS (pin đúng vật + chip sát mép + sạch).
   12 cảnh: 遊園地 công viên giải trí・動物園 sở thú・水族館 thủy cung・海水浴場 bãi tắm biển・
   温泉 suối nước nóng・お祭り lễ hội Nhật・旅行 du lịch・駅 nhà ga tàu・キャンプ cắm trại・
   スキー場 khu trượt tuyết・映画館 rạp phim・観光地 điểm du lịch.
   72 từ JLPT N5-N4, 47 từ kanji kèm cách đọc kana trong chip 3 dòng; 0 trùng với 232 từ
   của 4 chủ đề cũ (không dùng バス/テント/花/看板/門/木/鏡/タオル đã có). */
var GALLERY_FUN_DB = [
    { jp: '遊園地', kana: 'ゆうえんち', romaji: 'yuuenchi', vi: 'Công viên giải trí — 6 từ vựng', words: [['観覧車','かんらんしゃ','vòng quay quan sát'], ['ジェットコースター','','tàu lượn siêu tốc'], ['風船','ふうせん','bóng bay'], ['回転木馬','かいてんもくば','đu quay ngựa gỗ'], ['売店','ばいてん','quầy bán đồ'], ['綿菓子','わたがし','kẹo bông gòn']], img: 'assets/gallery/vui-choi-01.jpg' },
    { jp: '動物園', kana: 'どうぶつえん', romaji: 'doubutsuen', vi: 'Sở thú — 6 từ vựng', words: [['きりん','','con hươu cao cổ'], ['さる','','con khỉ'], ['象','そう','con voi'], ['パンダ','','gấu trúc'], ['飼育員','しいいくいん','nhân viên chăm sóc thú'], ['ペンギン','','chim cánh cụt']], img: 'assets/gallery/vui-choi-02.jpg' },
    { jp: '水族館', kana: 'すいぞくかん', romaji: 'suizokukan', vi: 'Thủy cung — 6 từ vựng', words: [['くじら','','cá voi'], ['サメ','','cá mập'], ['亀','かめ','con rùa'], ['くらげ','','con sứa'], ['イルカ','','cá heo'], ['アザラシ','','hải cẩu']], img: 'assets/gallery/vui-choi-03.jpg' },
    { jp: '海水浴場', kana: 'かいすいよくじょう', romaji: 'kaisuiyokujou', vi: 'Bãi tắm biển — 6 từ vựng', words: [['浮き輪','うきわ','phao bơi'], ['パラソル','','dù che nắng'], ['波','なみ','sóng biển'], ['貝殻','かいがら','vỏ ốc'], ['砂の城','すなのしろ','lâu đài cát'], ['水着','みずぎ','đồ bơi']], img: 'assets/gallery/vui-choi-04.jpg' },
    { jp: '温泉', kana: 'おんせん', romaji: 'onsen', vi: 'Suối nước nóng — 6 từ vựng', words: [['湯気','ゆげ','hơi nước nóng'], ['浴衣','ゆかた','váng yukata'], ['竹','たけ','cây tre'], ['岩','いわ','tảng đá'], ['桶','おけ','thùng gỗ'], ['露天風呂','ろてんぶろ','bồn tắm ngoài trời']], img: 'assets/gallery/vui-choi-05.jpg' },
    { jp: 'お祭り', kana: 'おまつり', romaji: 'omatsuri', vi: 'Lễ hội Nhật — 6 từ vựng', words: [['花火','はなび','pháo hoa'], ['仮面','かめん','mặt nạ'], ['太鼓','たいこ','cái trống'], ['射的','しゃてき','bắn bía trò chơi'], ['金魚','きんぎょ','cá vàng'], ['りんご飴','りんごあめ','táo keo']], img: 'assets/gallery/vui-choi-06.jpg' },
    { jp: '旅行', kana: 'りょこう', romaji: 'ryokou', vi: 'Du lịch — 6 từ vựng', words: [['飛行機','ひこうき','máy bay'], ['お土産','おみやげ','quà lưu niệm'], ['荷物','にもつ','hành lý'], ['カメラ','','máy ảnh'], ['パスポート','','hộ chiếu'], ['航空券','こうくうけん','vé máy bay']], img: 'assets/gallery/vui-choi-07.jpg' },
    { jp: '駅', kana: 'えき', romaji: 'eki', vi: 'Nhà ga tàu — 6 từ vựng', words: [['案内板','あんないばん','bảng chỉ dẫn'], ['駅員','えきいん','nhân viên ga'], ['時刻表','じこくひょう','bảng giờ tàu'], ['改札','かいさつ','cửa soát vé'], ['新幹線','しんかんせん','tàu Shinkansen'], ['切符','きっぷ','vé tàu']], img: 'assets/gallery/vui-choi-08.jpg' },
    { jp: 'キャンプ', kana: 'きゃんぷ', romaji: 'kyanpu', vi: 'Cắm trại — 6 từ vựng', words: [['川','かわ','dòng sông'], ['マシュマロ','','kẹo dẻo nướng'], ['釣り竿','つりざお','cần câu cá'], ['リュックサック','','ba lô'], ['薪','まき','củi đốt'], ['焚き火','たきび','lửa trại']], img: 'assets/gallery/vui-choi-09.jpg' },
    { jp: 'スキー場', kana: 'スキーじょう', romaji: 'sukiijou', vi: 'Khu trượt tuyết — 6 từ vựng', words: [['リフト','','cáp treo'], ['雪だるま','ゆきだるま','người tuyết'], ['スキー','','ván trượt tuyết'], ['雪','ゆき','tuyết'], ['ゴーグル','','kính trượt tuyết'], ['ソリ','','xe trượt tuyết']], img: 'assets/gallery/vui-choi-10.jpg' },
    { jp: '映画館', kana: 'えいがかん', romaji: 'eigakan', vi: 'Rạp phim — 6 từ vựng', words: [['ポップコーン','','bóng nổ'], ['スクリーン','','màn chiếu'], ['ポスター','','áp phích quảng cáo'], ['ジュース','','nước ép'], ['チケット','','vé xem phim'], ['3Dメガネ','','kính 3D']], img: 'assets/gallery/vui-choi-11.jpg' },
    { jp: '観光地', kana: 'かんこうち', romaji: 'kankouchi', vi: 'Điểm du lịch — 6 từ vựng', words: [['鳥居','とりい','cổng torii'], ['お寺','おてら','ngôi chùa'], ['五重塔','ごじゅうのとう','tháp năm tầng'], ['石段','いしだん','bậc thang đá'], ['地図','ちず','bản đồ'], ['観光客','かんこうきゃく','khách du lịch']], img: 'assets/gallery/vui-choi-12.jpg' },
];

/* [T97] CHỦ ĐỀ GALLERY THỨ 6 'CÔNG NGHỆ' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4) theo yêu cầu user
   'thêm tiếp chủ đề công nghệ'. Chuẩn T93c (chip trắng viền teal 2.5px bo góc 8px xếp 4 cạnh ảnh,
   3 dòng kanji đậm #1F2937 / kana teal #0D9488 / nghĩa Việt xám #4B5563, đường nối THẲNG teal 3px — [T98] đổi từ cong-S zic zắc sang đường thẳng theo yêu cầu user (recompose 12 ảnh, QA VLM 12/12 PASS lại),
   pin đồng tâm 20px, font M PLUS Rounded 1c) → QA VLM 12/12 PASS (pin đúng vật + chip sát mép + sạch).
   12 cảnh: 電気街 phố điện tử・家電量販店 siêu thị đồ điện・ゲームセンター trò chơi điện tử・
   ネットカフェ quán Internet・オフィス văn phòng・工場 nhà máy・研究所 viện nghiên cứu・
   修理屋 tiệm sửa chữa・スマホショップ cửa hàng điện thoại・ドローン máy bay không người lái・
   プログラミング教室 lớp học lập trình・テレビ局 đài truyền hình.
   72 từ JLPT N5-N4, 37 từ kanji kèm cách đọc kana trong chip 3 dòng; 0 trùng với 372 từ
   của 5 chủ đề cũ (không dùng テレビ/パソコン/カメラ/ロボット/時計/顕微鏡/試験管/エアコン đã có). */
var GALLERY_TECH_DB = [
    { jp: '電気街', kana: 'でんきがい', romaji: 'denki gai', vi: 'Phố điện tử — 6 từ vựng', words: [['ビル','','tòa nhà cao tầng'], ['ネオン','','đèn neon'], ['広告','こうこく','quảng cáo'], ['ショップ','','cửa hàng'], ['自動販売機','じどうはんばいき','máy bán hàng tự động'], ['歩道','ほどう','vỉa hè']], img: 'assets/gallery/cong-nghe-01.jpg' },
    { jp: '家電量販店', kana: 'かでんりょうはんてん', romaji: 'kaden ryōhanten', vi: 'Siêu thị đồ điện — 6 từ vựng', words: [['扇風機','せんぷうき','quạt điện'], ['電子レンジ','でんしレンジ','lò vi sóng'], ['値札','ねふだ','thẻ giá'], ['売り場','うりば','khu bán hàng'], ['加湿器','かしつき','máy tạo ẩm'], ['掃除機','そうじき','máy hút bụi']], img: 'assets/gallery/cong-nghe-02.jpg' },
    { jp: 'ゲームセンター', kana: 'げーむせんたー', romaji: 'gēmu sentā', vi: 'Trò chơi điện tử — 6 từ vựng', words: [['景品','けいひん','phần thưởng'], ['ジョイスティック','','cần điều khiển'], ['クレーンゲーム','','máy gắp đồ chơi'], ['ゲーム機','ゲームき','máy chơi game'], ['メダル','','huy chương game'], ['ボタン','','nút bấm']], img: 'assets/gallery/cong-nghe-03.jpg' },
    { jp: 'ネットカフェ', kana: 'ねっとかふぇ', romaji: 'netto kafe', vi: 'Quán Internet — 6 từ vựng', words: [['インターネット','','Internet'], ['ヘッドホン','','tai nghe'], ['キーボード','','bàn phím'], ['個室','こしつ','phòng riêng'], ['ドリンク','','đồ uống'], ['マウス','','chuột máy tính']], img: 'assets/gallery/cong-nghe-04.jpg' },
    { jp: 'オフィス', kana: 'おふぃす', romaji: 'ofisu', vi: 'Văn phòng — 6 từ vựng', words: [['名刺','めいし','danh thiếp'], ['社員','しゃいん','nhân viên công ty'], ['書類','しょるい','tài liệu'], ['会議','かいぎ','cuộc họp'], ['コピー機','','máy photocooy'], ['電話','でんわ','điện thoại bàn']], img: 'assets/gallery/cong-nghe-05.jpg' },
    { jp: '工場', kana: 'こうじょう', romaji: 'kōjō', vi: 'Nhà máy — 6 từ vựng', words: [['安全帽','あんぜんぼう','mũ bảo hộ'], ['ロボットアーム','','cánh tay robot'], ['作業員','さぎょういん','công nhân'], ['部品','ぶひん','linh kiện'], ['組み立て','くみたて','lắp ráp'], ['ベルトコンベア','','băng chuyền']], img: 'assets/gallery/cong-nghe-06.jpg' },
    { jp: '研究所', kana: 'けんきゅうじょ', romaji: 'kenkyūjo', vi: 'Viện nghiên cứu — 6 từ vựng', words: [['データ','','dữ liệu'], ['画面','がめん','màn hình'], ['研究者','けんきゅうしゃ','nhà nghiên cứu'], ['実験','じっけん','thí nghiệm'], ['人工知能','じんこうちのう','trí tuệ nhân tạo'], ['センサー','','cảm biến']], img: 'assets/gallery/cong-nghe-07.jpg' },
    { jp: '修理屋', kana: 'しゅうりや', romaji: 'shūriya', vi: 'Tiệm sửa chữa — 6 từ vựng', words: [['修理','しゅうり','sửa chữa'], ['ドライバー','','tua vít'], ['工具','こうぐ','dụng cụ'], ['ねじ','','ốc vít'], ['ピンセット','','nhíp'], ['バッテリー','','pin sạc']], img: 'assets/gallery/cong-nghe-08.jpg' },
    { jp: 'スマホショップ', kana: 'すまほしょっぷ', romaji: 'sumaho shoppu', vi: 'Cửa hàng điện thoại — 6 từ vựng', words: [['ケース','','ốp lưng điện thoại'], ['店員','てんいん','nhân viên cửa hàng'], ['スマートフォン','','điện thoại thông minh'], ['充電器','じゅうでんき','sạc điện'], ['フィルム','','dán màn hình'], ['契約','けいやく','ký hợp đồng']], img: 'assets/gallery/cong-nghe-09.jpg' },
    { jp: 'ドローン', kana: 'どろーん', romaji: 'dorōn', vi: 'Máy bay không người lái — 6 từ vựng', words: [['プロペラ','','cánh quạt'], ['ドローン','','máy bay không người lái'], ['公園','こうえん','công viên'], ['操作','そうさ','điều khiển, thao tác'], ['リモコン','','điều khiển từ xa'], ['電池','でんち','pin']], img: 'assets/gallery/cong-nghe-10.jpg' },
    { jp: 'プログラミング教室', kana: 'ぷろぐらみんぐきょうしつ', romaji: 'puroguramingu kyōshitsu', vi: 'Lớp học lập trình — 6 từ vựng', words: [['先生','せんせい','giáo viên'], ['生徒','せいと','học sinh'], ['プログラミング','','lập trình'], ['タブレット','','máy tính bảng'], ['コード','','mã lệnh'], ['ノートパソコン','','máy tính xách tay']], img: 'assets/gallery/cong-nghe-11.jpg' },
    { jp: 'テレビ局', kana: 'テレビきょく', romaji: 'terebi kyoku', vi: 'Đài truyền hình — 6 từ vựng', words: [['モニター','','màn hình giám sát'], ['マイク','','micro'], ['ヘッドセット','','bộ tai nghe có micro'], ['アナウンサー','','phát thanh viên'], ['スイッチ','','công tắc'], ['放送','ほうそう','phát sóng']], img: 'assets/gallery/cong-nghe-12.jpg' },
];

/* [T99] CHỦ ĐỀ GALLERY THỨ 7 'SỞ THÍCH THÓI QUEN' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4) theo yêu cầu user
   'tiếp tục thêm chủ đề sở thích thói quen'. Chuẩn T93c + [T98] đường nối THẲNG teal 3px (chip trắng viền
   teal 2.5px bo góc 8px xếp 4 cạnh ảnh, 3 dòng kanji đậm #1F2937 / kana teal #0D9488 / nghĩa Việt xám
   #4B5563, pin đồng tâm 20px, font M PLUS Rounded 1c) → QA VLM 12/12 PASS (pin đúng vật + chip sát mép + sạch).
   12 cảnh: 音楽スタジオ phòng tập nhạc・読書 đọc sách・園芸 làm vườn・料理教室 lớp học nấu ăn・
   書道 thư pháp・釣り câu cá・朝のジョギング chạy bộ buổi sáng・ヨガ yoga・カラオケ karaoke・
   編み物 đan len・プラモデル lắp mô hình・日記 viết nhật ký.
   72 từ JLPT N5-N4, 42 từ kanji kèm cách đọc kana trong chip 3 dòng; 0 trùng với 468 từ
   của 6 chủ đề cũ (không dùng ピアノ/楽譜/釣り竿/本棚/筆/絵の具/マット/辞書 đã có). */
var GALLERY_HOBBY_DB = [
    { jp: '音楽スタジオ', kana: 'おんがくスタジオ', romaji: 'ongaku sutajio', vi: 'Phòng tập nhạc — 6 từ vựng', words: [['ギター','','đàn ghi-ta'], ['練習','れんしゅう','luyện tập'], ['弦','げん','dây đàn'], ['ドラム','','bộ trống'], ['ピック','','miếng gảy đàn'], ['アンプ','','loa khuếch đại']], img: 'assets/gallery/so-thich-01.jpg' },
    { jp: '読書', kana: 'どくしょ', romaji: 'dokusho', vi: 'Đọc sách — 6 từ vựng', words: [['メガネ','','kính mắt'], ['小説','しょうせつ','tiểu thuyết'], ['文庫本','ぶんこほん','sách bách khoa túi'], ['しおり','','dấu trang'], ['コミック','','truyện tranh'], ['猫','ねこ','con mèo']], img: 'assets/gallery/so-thich-02.jpg' },
    { jp: '園芸', kana: 'えんげい', romaji: 'engei', vi: 'Làm vườn — 6 từ vựng', words: [['植木鉢','うえきばち','chậu cây'], ['種','たね','hạt giống'], ['手袋','てぶくろ','găng tay'], ['雑草','ざっそう','cỏ dại'], ['苗','なえ','cây giống'], ['スコップ','','xẻng nhỏ']], img: 'assets/gallery/so-thich-03.jpg' },
    { jp: '料理教室', kana: 'りょうりきょうしつ', romaji: 'ryōri kyōshitsu', vi: 'Lớp học nấu ăn — 6 từ vựng', words: [['泡立て器','あわたてき','cái đánh trứng'], ['味見','あじみ','nếm thử'], ['フライパン','','chảo rán'], ['小麦粉','こむぎこ','bột mì'], ['ボウル','','tô trộn'], ['レシピ','','công thức nấu ăn']], img: 'assets/gallery/so-thich-04.jpg' },
    { jp: '書道', kana: 'しょどう', romaji: 'shodō', vi: 'Thư pháp — 6 từ vựng', words: [['硯','すずり','nghiên mực'], ['お手本','おてほん','chữ mẫu'], ['習字','しゅうじ','tập viết thư pháp'], ['半紙','はんし','giấy thư pháp'], ['墨','すみ','mực nho'], ['文鎮','ぶんちん','vật đè giấy']], img: 'assets/gallery/so-thich-05.jpg' },
    { jp: '釣り', kana: 'つり', romaji: 'tsuri', vi: 'Câu cá — 6 từ vựng', words: [['釣り糸','つりいと','dây câu'], ['浮き','うき','phao câu'], ['針','はり','lưỡi câu'], ['エサ','','mồi câu'], ['バケツ','','xô nhựa'], ['クーラーボックス','','thùng giữ lạnh']], img: 'assets/gallery/so-thich-06.jpg' },
    { jp: '朝のジョギング', kana: 'あさのジョギング', romaji: 'asa no jogingu', vi: 'Chạy bộ buổi sáng — 6 từ vựng', words: [['朝','あさ','buổi sáng'], ['ラジオ体操','ラジオたいそう','thể dục phát thanh'], ['汗','あせ','mồ hôi'], ['水筒','すいとう','bình nước'], ['ジョギング','','chạy bộ'], ['スニーカー','','giày thể thao']], img: 'assets/gallery/so-thich-07.jpg' },
    { jp: 'ヨガ', kana: 'よが', romaji: 'yoga', vi: 'Tập yoga — 6 từ vựng', words: [['ポーズ','','tư thế'], ['ヨガ','','yoga'], ['呼吸','こきゅう','hơi thở'], ['ストレッチ','','giãn cơ'], ['瞑想','めいそう','thiền định'], ['クッション','','đệm ngồi']], img: 'assets/gallery/so-thich-08.jpg' },
    { jp: 'カラオケ', kana: 'からおけ', romaji: 'karaoke', vi: 'Karaoke — 6 từ vựng', words: [['曲','きょく','bản nhạc'], ['歌詞','かし','lời bài hát'], ['タン バリン','','trống lục lạc'], ['歌手','かしゅ','ca sĩ'], ['デュエット','','hát song ca'], ['拍手','はくしゅ','vỗ tay']], img: 'assets/gallery/so-thich-09.jpg' },
    { jp: '編み物', kana: 'あみもの', romaji: 'amimono', vi: 'Đan len — 6 từ vựng', words: [['毛糸','けいと','len, sợi len'], ['マフラー','','khăn quàng'], ['編み針','あみばり','kim đan'], ['かぎ針','かぎばり','kim móc'], ['セーター','','áo len'], ['靴下','くつした','đôi tất']], img: 'assets/gallery/so-thich-10.jpg' },
    { jp: 'プラモデル', kana: 'ぷらもでる', romaji: 'puramoderu', vi: 'Lắp mô hình — 6 từ vựng', words: [['接着剤','ぜっちゃくざい','keo dán'], ['模型','もけい','mô hình'], ['塗料','とりょう','son'], ['ニッパー','','kìm cắt'], ['フィギュア','','mô hình nhân vật'], ['パーツ','','chi tiết mô hình']], img: 'assets/gallery/so-thich-11.jpg' },
    { jp: '日記', kana: 'にっき', romaji: 'nikki', vi: 'Viết nhật ký — 6 từ vựng', words: [['カレンダー','','lịch treo tường'], ['ペン','','bút viết'], ['思い出','おもいで','kỷ niệm'], ['シール','','nhãn dán'], ['日記','にっき','nhật ký'], ['スケジュール帳','スケジュールちょう','sổ lịch trình']], img: 'assets/gallery/so-thich-12.jpg' },
];
/* [T100] CHỦ ĐỀ GALLERY THỨ 8 'SỨC KHỎE VÀ Y TẾ' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4)
   theo yêu cầu user 'thêm chủ đề sức khỏe y tế vào widget gallery'. Chuẩn T93c + [T98]
   đường nối THẲNG teal 3px (chip trắng viền teal 2.5px bo 8px, 3 dòng kanji #1F2937 /
   kana teal #0D9488 / nghĩa Việt #4B5563, pin đồng tâm 20px, font M PLUS Rounded 1c,
   2x supersample) — QA VLM 12/12 PASS (pin đúng vật + chip sát mép + không chồng lấn).
   12 cảnh: 病院 bệnh viện・診察室 phòng khám・薬局 nhà thuốc・歯科 nha khoa・
   救急車 xe cấp cứu・病室 phòng bệnh・リハビリ室 phục hồi・風邪 cảm cúm・
   健康的な生活 sống khỏe・乳児健診 khám bé・手術室 phòng mổ・スパ spa thư giãn.
   72 từ JLPT N5-N4, 56 từ kanji kèm cách đọc kana chip 3 dòng; 0 trùng với 544 từ
   của 7 chủ đề cũ (né 体温計/体重計/救急箱/ばんそうこう/メガネ/針/ピンセット/
   汗/呼吸/ジョギング/ヨガ đã dùng). */
var GALLERY_HEALTH_DB = [
    { jp: '病院', kana: 'びょういん', romaji: 'byōin', vi: 'Bệnh viện — 6 từ vựng', words: [['医者','いしゃ','Bác sĩ'], ['看護師','かんごし','Y tá'], ['車椅子','くるまいす','Xe lăn'], ['患者','かんじゃ','Bệnh nhân'], ['診察券','しんさつけん','Thẻ khám bệnh'], ['受付','うけつけ','Quầy tiếp đón']], img: 'assets/gallery/suc-khoe-01.jpg' },
    { jp: '診察室', kana: 'しんさつしつ', romaji: 'shinsasshitsu', vi: 'Phòng khám — 6 từ vựng', words: [['マスク','','Khẩu trang'], ['綿棒','めんぼう','Tăm bông'], ['血圧計','けつあつけい','Máy đo huyết áp'], ['聴診器','ちょうしんき','Ống nghe tim'], ['白衣','はくい','Áo blouse trắng'], ['注射器','ちゅうしゃき','Ống tiêm']], img: 'assets/gallery/suc-khoe-02.jpg' },
    { jp: '薬局', kana: 'やっきょく', romaji: 'yakkyoku', vi: 'Nhà thuốc — 6 từ vựng', words: [['薬','くすり','Thuốc'], ['錠剤','じょうざい','Viên thuốc'], ['薬剤師','やくざいし','Dược sĩ'], ['軟膏','なんこう','Thuốc mỡ'], ['薬袋','やくたい','Túi đựng thuốc'], ['目薬','めぐすり','Thuốc nhỏ mắt']], img: 'assets/gallery/suc-khoe-03.jpg' },
    { jp: '歯科', kana: 'しか', romaji: 'shika', vi: 'Nha khoa — 6 từ vựng', words: [['歯','は','Răng'], ['歯ブラシ','はぶらし','Bàn chải đánh răng'], ['虫歯','むしば','Sâu răng'], ['歯医者','はいしゃ','Nha sĩ'], ['レントゲン','','Phim X-quang'], ['歯磨き粉','はみがきこ','Kem đánh răng']], img: 'assets/gallery/suc-khoe-04.jpg' },
    { jp: '救急車', kana: 'きゅうきゅうしゃ', romaji: 'kyūkyūsha', vi: 'Xe cấp cứu — 6 từ vựng', words: [['ヘリコプター','','Trực thăng cứu thương'], ['救急隊員','きゅうきゅうたいいん','Nhân viên cứu thương'], ['手当て','てあて','Sơ cứu'], ['酸素ボンベ','さんそボンベ','Bình oxy'], ['包帯','ほうたい','Băng gạc'], ['担架','たんか','Cáng cứu thương']], img: 'assets/gallery/suc-khoe-05.jpg' },
    { jp: '病室', kana: 'びょうしつ', romaji: 'byōshitsu', vi: 'Phòng bệnh — 6 từ vựng', words: [['点滴','てんてき','Ống truyền dịch'], ['心電図','しんでんず','Máy điện tim'], ['ナースコール','','Nút gọi y tá'], ['病衣','びょうい','Áo bệnh nhân'], ['お見舞い','おみまい','Thăm bệnh'], ['花束','はなたば','Bó hoa thăm bệnh']], img: 'assets/gallery/suc-khoe-06.jpg' },
    { jp: 'リハビリ室', kana: 'りはびりしつ', romaji: 'rihabiri shitsu', vi: 'Phòng phục hồi — 6 từ vựng', words: [['訓練','くんれん','Luyện tập phục hồi'], ['松葉杖','まつばづえ','Nạng'], ['バランスボール','','Bóng cân bằng'], ['階段','かいだん','Bậc thang tập đi'], ['手すり','てすり','Tay vịn'], ['歩行器','ほこうき','Khung tập đi']], img: 'assets/gallery/suc-khoe-07.jpg' },
    { jp: '風邪', kana: 'かぜ', romaji: 'kaze', vi: 'Cảm cúm — 6 từ vựng', words: [['熱','ねつ','Sốt'], ['ティッシュ','','Giấy vệ sinh'], ['咳','せき','Ho'], ['おかゆ','','Cháo'], ['風邪薬','かぜぐすり','Thuốc cảm'], ['頭痛','ずつう','Đau đầu']], img: 'assets/gallery/suc-khoe-08.jpg' },
    { jp: '健康的な生活', kana: 'けんこうてきなせいかつ', romaji: 'kenkōteki na seikatsu', vi: 'Sống khỏe mạnh — 6 từ vựng', words: [['ビタミン','','Vitamin'], ['運動','うんどう','Vận động'], ['休憩','きゅうけい','Nghỉ ngơi'], ['野菜','やさい','Rau củ'], ['果物','くだもの','Trái cây'], ['睡眠','すいみん','Giấc ngủ']], img: 'assets/gallery/suc-khoe-09.jpg' },
    { jp: '乳児健診', kana: 'にゅうじけんしん', romaji: 'nyūji kenshin', vi: 'Khám sức khỏe trẻ em — 6 từ vựng', words: [['おむつ','','Tã lót'], ['粉ミルク','こなみるく','Sữa bột'], ['予防接種','よぼうせっしゅ','Tiêm phòng'], ['母親','ははおや','Người mẹ'], ['ベビーカー','','Xe đẩy em bé'], ['赤ちゃん','','Em bé']], img: 'assets/gallery/suc-khoe-10.jpg' },
    { jp: '手術室', kana: 'しゅじゅつしつ', romaji: 'shujutsu shitsu', vi: 'Phòng mổ — 6 từ vựng', words: [['手術着','しゅじゅつぎ','Áo phẫu thuật'], ['血液','けつえき','Túi máu'], ['輸血','ゆけつ','Truyền máu'], ['糸','いと','Chỉ khâu'], ['メス','','Dao mổ'], ['手術','しゅじゅつ','Ca phẫu thuật']], img: 'assets/gallery/suc-khoe-11.jpg' },
    { jp: 'スパ', kana: '', romaji: 'supa', vi: 'Spa thư giãn — 6 từ vựng', words: [['アロマ','','Tinh dầu hương liệu'], ['オイル','','Dầu massage'], ['キャンドル','','Nến thơm'], ['リラックス','','Thư giãn'], ['マッサージ','','Massage'], ['音楽','おんがく','Âm nhạc']], img: 'assets/gallery/suc-khoe-12.jpg' }
];
/* [T101] CHỦ ĐỀ GALLERY THỨ 9 'THÀNH PHỐ VÀ DỊCH VỤ CÔNG' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4)
   theo yêu cầu user 'thêm chủ đề "Thành phố & dịch vụ công" cho widget gallery'. Chuẩn T93c + [T98]
   đường nối THẲNG teal 3px (chip trắng viền teal bo góc, 3 dòng kanji #1F2937 / kana teal #0D9488 /
   nghĩa Việt #4B5563, pin đồng tâm 20+12px, font M PLUS Rounded 1c, 2x supersample) — QA VLM 12/12
   PASS (pin đúng vật + chip sát mép + không chồng lấn).
   12 cảnh: 市役所 trụ sở hành chính・交番 trạm cảnh sát khu phố・郵便局 bưu điện・図書館 thư viện・
   消防署 sở cứu hỏa・地下鉄 tàu điện ngầm・バス停 trạm xe buýt・銀行 ngân hàng・美術館 viện bảo tàng
   mỹ thuật・道路工事 công trình đường bộ・ごみ収集 thu gom rác・投票所 điểm bỏ phiếu.
   72 từ JLPT N5-N4, 56 từ kanji kèm cách đọc kana chip 3 dòng + 16 từ kana/katakana chip 2 dòng;
   0 trùng với 544 từ của 8 chủ đề cũ (OCR VLM 96 ảnh). */
var GALLERY_CITY_DB = [
    { jp: '市役所', kana: 'しやくしょ', romaji: 'shiyakusho', vi: 'Trụ sở hành chính — 6 từ vựng', words: [['職員','しょくいん','Nhân viên'], ['窓口','まどぐち','Quầy giao dịch'], ['番号札','ばんごうふだ','Thẻ số thứ tự'], ['待合室','まちあいしつ','Phong chờ'], ['証明書','しょうめいしょ','Giấy chứng nhận'], ['申請書','しんせいしょ','Đơn đăng ký']], img: 'assets/gallery/thanh-pho-01.jpg' },
    { jp: '交番', kana: 'こうばん', romaji: 'kōban', vi: 'Trạm cảnh sát khu phố — 6 từ vựng', words: [['迷子','まいご','Trẻ em lạc'], ['婦警','ふけい','Nữ cảnh sát'], ['パトカー','','Xe tuần tra'], ['警察官','けいさつかん','Cảnh sát'], ['白バイ','しろバイ','Mô tô cảnh sát'], ['落とし物','おとしもの','Đồ thất lạc']], img: 'assets/gallery/thanh-pho-02.jpg' },
    { jp: '郵便局', kana: 'ゆうびんきょく', romaji: 'yūbinkyoku', vi: 'Bưu điện — 6 từ vựng', words: [['はがき','','Bưu thiếp'], ['配達員','はいたついん','Nhân viên giao hàng'], ['手紙','てがみ','Thư'], ['宛名','あてな','Tên người nhận'], ['切手','きって','Tem'], ['小包','こづつみ','Bưu kiện']], img: 'assets/gallery/thanh-pho-03.jpg' },
    { jp: '図書館', kana: 'としょかん', romaji: 'toshokan', vi: 'Thư viện — 6 từ vựng', words: [['司書','ししょ','Thủ thư'], ['返却','へんきゃく','Trả sách'], ['雑誌','ざっし','Tạp chí'], ['漫画','まんが','Truyện tranh'], ['新聞','しんぶん','Báo'], ['図書カード','としょカード','Thẻ thư viện']], img: 'assets/gallery/thanh-pho-04.jpg' },
    { jp: '消防署', kana: 'しょうぼうしょ', romaji: 'shōbōsho', vi: 'Sở cứu hỏa — 6 từ vựng', words: [['サイレン','','Còi báo động'], ['はしご車','はしごしゃ','Xe thang'], ['ホース','','Vòi rồng'], ['消防車','しょうぼうしゃ','Xe cứu hỏa'], ['消防士','しょうぼうし','Lính cứu hỏa'], ['無線機','むせんき','Bộ đàm']], img: 'assets/gallery/thanh-pho-05.jpg' },
    { jp: '地下鉄', kana: 'ちかてつ', romaji: 'chikatetsu', vi: 'Tàu điện ngầm — 6 từ vựng', words: [['吊革','つりかわ','Tay nắm'], ['つり広告','つりこうこく','Quảng cáo treo'], ['網棚','あみだな','Kệ để đồ'], ['路線図','ろせんず','Bản đồ tuyến'], ['乗客','じょうきゃく','Hành khách'], ['ホーム','','Kế sân ga']], img: 'assets/gallery/thanh-pho-06.jpg' },
    { jp: 'バス停', kana: 'ばすてい', romaji: 'basutei', vi: 'Trạm xe buýt — 6 từ vựng', words: [['スピーカー','','Loa thông báo'], ['行き先','ゆきさき','Điểm đến'], ['標識','ひょうしき','Biển báo'], ['運転手','うんてんしゅ','Tài xế'], ['老人','ろうじん','Người cao tuổi'], ['優先席','ゆうせんせき','Ghế ưu tiên']], img: 'assets/gallery/thanh-pho-07.jpg' },
    { jp: '銀行', kana: 'ぎんこう', romaji: 'ginkō', vi: 'Ngân hàng — 6 từ vựng', words: [['金庫','きんこ','Két sắt'], ['ATM','','Máy ATM'], ['両替','りょうがえ','Đổi tiền'], ['現金','げんきん','Tiền mặt'], ['行員','こういん','Nhân viên ngân hàng'], ['通帳','つうちょう','Sổ tiết kiệm']], img: 'assets/gallery/thanh-pho-08.jpg' },
    { jp: '美術館', kana: 'びじゅつかん', romaji: 'bijutsukan', vi: 'Viện bảo tàng mỹ thuật — 6 từ vựng', words: [['絵','え','Bức tranh'], ['ロープ','','Dây chắn'], ['照明','しょうめい','Ánh đèn trưng bày'], ['入場券','にゅうじょうけん','Vé vào cửa'], ['銅像','どうぞう','Tượng đồng'], ['額縁','がくぶち','Khung tranh']], img: 'assets/gallery/thanh-pho-09.jpg' },
    { jp: '道路工事', kana: 'どうろこうじ', romaji: 'dōro kōji', vi: 'Công trình đường bộ — 6 từ vựng', words: [['トラック','','Xe tải'], ['ヘルメット','','Mũ bảo hộ'], ['バリケード','','Rào chắn'], ['コーン','','Cọc nón phản quang'], ['シャベル','','Xẻng'], ['土','つち','Đất']], img: 'assets/gallery/thanh-pho-10.jpg' },
    { jp: 'ごみ収集', kana: 'ごみしゅうしゅう', romaji: 'gomi shūshū', vi: 'Thu gom rác — 6 từ vựng', words: [['空き缶','あきかん','Lon rỗng'], ['集積所','しゅうせきしょ','Điểm tập kết rác'], ['収集車','しゅうしゅうしゃ','Xe thu gom rác'], ['ペットボトル','','Chai nhựa'], ['ごみ','','Rác'], ['リサイクル','','Tái chế']], img: 'assets/gallery/thanh-pho-11.jpg' },
    { jp: '投票所', kana: 'とうひょうじょ', romaji: 'tōhyōjo', vi: 'Điểm bỏ phiếu — 6 từ vựng', words: [['候補者','こうほしゃ','Ứng viên'], ['投票用紙','とうひょうようし','Phiếu bầu'], ['投票箱','とうひょうばこ','Thùng phiếu'], ['記号','きごう','Ký hiệu'], ['投票','とうひょう','Bỏ phiếu'], ['選挙','せんきょ','Bầu cử']], img: 'assets/gallery/thanh-pho-12.jpg' }
];

/* [T102] CHỦ ĐỀ GALLERY THỨ 10 'THỂ THAO' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4) theo yêu cầu
   user 'thêm chủ đề "thể thao" cho gallery'. Chuẩn T93c + [T98] (chip trắng viền teal bo 8px,
   3 dòng kanji #1F2937/kana #0D9488/VI #4B5563, đường nối THẲNG teal 3px, pin đồng tâm
   20+12px, font M PLUS Rounded 1c, 2x supersample); 12 cảnh: サッカー場 sân bóng đá・野球場 sân bóng chày・バスケットボール bóng rổ・テニスコート sân quần vợt・室内プール bể bơi trong nhà・陸上競技 điền kinh・柔道 nhu đạo・剣道 kiếm đạo・卓球 bóng bàn・バドミントン cầu lông・スケートリンク sân trượt băng・表彰式 lễ trao giải;
   30 từ kanji kèm kana chip 3 dòng + 42 từ thuần kana/katakana chip 2 dòng. */
var GALLERY_SPORT_DB = [
    { jp: 'サッカー場', kana: 'サッカーじょう', romaji: 'sakkājō', vi: 'Sân bóng đá — 6 từ vựng', words: [['ゴール','','Khung thành'], ['ユニフォーム','','Áo đồng phục thi đấu'], ['スパイク','','Giày đá bóng'], ['試合','しあい','Trận đấu'], ['サッカー','','Bóng đá'], ['応援','おうえん','Cổ vũ']], img: 'assets/gallery/the-thao-01.jpg' },
    { jp: '野球場', kana: 'やきゅうじょう', romaji: 'yakyūjō', vi: 'Sân bóng chày — 6 từ vựng', words: [['大会','たいかい','Giải đấu'], ['グラブ','','Găng bắt bóng'], ['野球','やきゅう','Bóng chày'], ['ベース','','Gôn (lũy)'], ['バッター','','Cầu thủ đánh bóng'], ['ピッチャー','','Cầu thủ ném bóng']], img: 'assets/gallery/the-thao-02.jpg' },
    { jp: 'バスケットボール', kana: 'バスケットボール', romaji: 'basukettobōru', vi: 'Bóng rổ — 6 từ vựng', words: [['ダンク','','Đập bóng vào rổ'], ['観客','かんきゃく','Khán giả'], ['シュート','','Ném rổ'], ['レフェリー','','Trọng tài'], ['チーム','','Đội bóng'], ['ドリブル','','Dẫn bóng']], img: 'assets/gallery/the-thao-03.jpg' },
    { jp: 'テニスコート', kana: 'テニスコート', romaji: 'tenisu kōto', vi: 'Sân quần vợt — 6 từ vựng', words: [['テニス','','Quần vợt'], ['テニスボール','','Quả bóng tennis'], ['サーブ','','Phát bóng'], ['審判','しんぱん','Trọng tài (ghế cao)'], ['ラケット','','Vợt (quần vợt)'], ['ネット','','Lưới chắn']], img: 'assets/gallery/the-thao-04.jpg' },
    { jp: '室内プール', kana: 'しつないプール', romaji: 'shitsunai pūru', vi: 'Bể bơi trong nhà — 6 từ vựng', words: [['ストップウオッチ','','Đồng hồ bấm giây'], ['飛び込み','とびこみ','Môn nhảy cầu'], ['ライフガード','','Nhân viên cứu hộ'], ['飛び込み台','とびこみだい','Bệ nhảy cầu'], ['スイムキャップ','','Mũ bơi'], ['水泳','すいえい','Bơi lội']], img: 'assets/gallery/the-thao-05.jpg' },
    { jp: '陸上競技', kana: 'りくじょうきょうぎ', romaji: 'rikujō kyōgi', vi: 'Điền kinh — 6 từ vựng', words: [['マラソン','','Mara-tông (chạy马拉松/marathon)'], ['ハードル','','Rào cản'], ['ゴールライン','','Vạch đích'], ['ピストル','','Súng phát lệnh'], ['バトン','','Gậy tiếp sức'], ['リレー','','Chạy tiếp sức']], img: 'assets/gallery/the-thao-06.jpg' },
    { jp: '柔道', kana: 'じゅうどう', romaji: 'jūdō', vi: 'Nhu đạo — 6 từ vựng', words: [['投げ技','なげわざ','Đòn ném (võ thuật)'], ['礼','れい','Lễ chào (võ thuật)'], ['道場','どうじょう','Phòng tập võ'], ['黒帯','くろおび','Dai den'], ['柔道着','じゅうどうぎ','Đồng phục judo'], ['受け身','うけみ','Đòn ngã an toàn']], img: 'assets/gallery/the-thao-07.jpg' },
    { jp: '剣道', kana: 'けんどう', romaji: 'kendō', vi: 'Kiếm đạo — 6 từ vựng', words: [['剣道家','けんどうか','Võ sinh kiếm đạo'], ['的','まと','Bia luyện tập'], ['防具','ぼうぐ','Đồ bảo hộ (võ thuật)'], ['竹刀','しない','Kiếm tre (võ thuật)'], ['稽古','けいこ','Luyện tập (võ)'], ['小手','こて','Găng bảo hộ']], img: 'assets/gallery/the-thao-08.jpg' },
    { jp: '卓球', kana: 'たっきゅう', romaji: 'takkyū', vi: 'Bóng bàn — 6 từ vựng', words: [['回転','かいてん','Quay, xoáy (bóng)'], ['コーチ','','Huấn luyện viên'], ['選手','せんしゅ','Vận động viên'], ['卓球台','たっきゅうだい','Bàn bóng bàn'], ['ラバー','','Mặt vợt (cao su)'], ['レシーブ','','Đỡ bóng']], img: 'assets/gallery/the-thao-09.jpg' },
    { jp: 'バドミントン', kana: 'バドミントン', romaji: 'badominton', vi: 'Cầu lông — 6 từ vựng', words: [['体育館','たいいくかん','Nhà thi đấu'], ['スマッシュ','','Đập bóng'], ['シャトルコック','','Quả cầu lông'], ['ラリー','','Đánh qua lại'], ['シューズ','','Giày thể thao'], ['ダブルス','','Đánh đôi']], img: 'assets/gallery/the-thao-10.jpg' },
    { jp: 'スケートリンク', kana: 'スケートリンク', romaji: 'sukēto rinku', vi: 'Sân trượt băng — 6 từ vựng', words: [['ミトン','','Găng tay len'], ['ジャンプ','','Cú nhảy'], ['スケート','','Trượt băng'], ['スケート靴','スケートぐつ','Giày trượt băng'], ['リンク','','Sân băng'], ['氷','こおり','Băng']], img: 'assets/gallery/the-thao-11.jpg' },
    { jp: '表彰式', kana: 'ひょうしょうしき', romaji: 'hyōshōshiki', vi: 'Lễ trao giải — 6 từ vựng', words: [['優勝','ゆうしょう','Quán quân'], ['トロフィー','','Cúp vô địch'], ['インタビュー','','Phỏng vấn'], ['ステージ','','Sân khấu'], ['賞状','しょうじょう','Bằng khen'], ['順位','じゅんい','Thứ hạng']], img: 'assets/gallery/the-thao-12.jpg' }
];
/* ---------- [T103] CHỦ ĐỀ GALLERY THỨ 11 'THỜI TIẾT VÀ MÙA' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4)
   theo yêu cầu user 'thêm chủ đề "thời tiết và mùa" vào gallery'. Chuẩn T93c + [T98] (chip trắng
   viền teal bo 8px, 3 dòng kanji #1F2937/kana #0D9488/VI #4B5563 — 62 từ kanji kèm kana chip
   3 dòng + 10 từ thuần kana/katakana chip 2 dòng, đường nối THẲNG teal 3px, pin đồng tâm
   20+12px, font M PLUS Rounded 1c, 2x supersample); 12 cảnh: 春 mùa xuân・夏 mùa hè・秋 mùa thu・
   冬 mùa đông・晴れ trời nắng・雨 trời mưa・虹 cầu vồng・風 trời gió・雷 sấm sét・台風 cơn bão・
   梅雨 mùa mưa・天気予報 dự báo thời tiết (AI irasutoya-style 1344x768 — pipeline AI art → VLM
   grounding → PIL compose; QA VLM 12/12 PASS: pin đúng vật + chip không chồng + chữ sạch). */
var GALLERY_WEATHER_DB = [
    { jp: '春', kana: 'はる', romaji: 'haru', vi: 'Mùa xuân — 6 từ vựng', words: [['桜','さくら','Hoa anh đào'], ['花','はな','Bông hoa'], ['木','き','Cái cây'], ['船','ふね','Chiếc thuyền'], ['帽子','ぼうし','Chiếc mũ'], ['弁当','べんとう','Hộp cơm']], img: 'assets/gallery/thoi-tiet-01.jpg' },
    { jp: '夏', kana: 'なつ', romaji: 'natsu', vi: 'Mùa hè — 6 từ vựng', words: [['海','うみ','Biển'], ['ボート','','Thuyền buồm'], ['貝殻','かいがら','Vỏ ốc'], ['波','なみ','Con sóng'], ['砂','すな','Cát'], ['水着','みずぎ','Đồ bơi']], img: 'assets/gallery/thoi-tiet-02.jpg' },
    { jp: '秋', kana: 'あき', romaji: 'aki', vi: 'Mùa thu — 6 từ vựng', words: [['落ち葉','おちば','Lá rụng'], ['山','やま','Ngọn núi'], ['栗','くり','Hạt dẻ'], ['柿','かき','Quả hồng'], ['リス','','Con sóc'], ['紅葉','もみじ','Lá đỏ']], img: 'assets/gallery/thoi-tiet-03.jpg' },
    { jp: '冬', kana: 'ふゆ', romaji: 'fuyu', vi: 'Mùa đông — 6 từ vựng', words: [['手袋','てぶくろ','Găng tay'], ['雪だるま','ゆきだるま','Người tuyết'], ['マフラー','','Khăn quàng'], ['氷','こおり','Băng'], ['子供','こども','Đứa trẻ'], ['雪','ゆき','Tuyết']], img: 'assets/gallery/thoi-tiet-04.jpg' },
    { jp: '晴れ', kana: 'はれ', romaji: 'hare', vi: 'Trời nắng — 6 từ vựng', words: [['太陽','たいよう','Mặt trời'], ['空','そら','Bầu trời'], ['雲','くも','Đám mây'], ['パラソル','','Chiếc dù'], ['芝生','しばふ','Bãi cỏ'], ['サングラス','','Kính râm']], img: 'assets/gallery/thoi-tiet-05.jpg' },
    { jp: '雨', kana: 'あめ', romaji: 'ame', vi: 'Trời mưa — 6 từ vựng', words: [['傘','かさ','Cây ô'], ['長靴','ながぐつ','Đôi ủng'], ['水たまり','みずたまり','Vũng nước'], ['雨','あめ','Mưa'], ['カエル','','Con ếch'], ['雨雲','あまぐも','Mây mưa']], img: 'assets/gallery/thoi-tiet-06.jpg' },
    { jp: '虹', kana: 'にじ', romaji: 'niji', vi: 'Cầu vồng — 6 từ vựng', words: [['空','そら','Bầu trời'], ['虹','にじ','Cầu vồng'], ['花','はな','Bông hoa'], ['家','いえ','Ngôi nhà'], ['川','かわ','Dòng sông'], ['鳥','とり','Con chim']], img: 'assets/gallery/thoi-tiet-07.jpg' },
    { jp: '風', kana: 'かぜ', romaji: 'kaze', vi: 'Trời gió — 6 từ vựng', words: [['風','かぜ','Gió'], ['凧','たこ','Con diều'], ['髪','かみ','Mái tóc'], ['草','くさ','Bãi cỏ'], ['犬','いぬ','Con chó'], ['風車','かざぐるま','Chong chóng']], img: 'assets/gallery/thoi-tiet-08.jpg' },
    { jp: '雷', kana: 'かみなり', romaji: 'kaminari', vi: 'Sấm sét — 6 từ vựng', words: [['雷','かみなり','Sấm sét'], ['稲妻','いなずま','Tia chớp'], ['窓','まど','Cửa sổ'], ['雲','くも','Đám mây đen'], ['家','いえ','Ngôi nhà'], ['猫','ねこ','Con mèo']], img: 'assets/gallery/thoi-tiet-09.jpg' },
    { jp: '台風', kana: 'たいふう', romaji: 'taifū', vi: 'Cơn bão — 6 từ vựng', words: [['木','き','Cái cây'], ['台風','たいふう','Cơn bão'], ['雨','あめ','Mưa lớn'], ['屋根','やね','Mái nhà'], ['新聞','しんぶん','Tờ báo'], ['店','みせ','Cửa hàng']], img: 'assets/gallery/thoi-tiet-10.jpg' },
    { jp: '梅雨', kana: 'つゆ', romaji: 'tsuyu', vi: 'Mùa mưa — 6 từ vựng', words: [['玄関','げんかん','Cửa vào'], ['カタツムリ','','Ốc sên'], ['紫陽花','あじさい','Hoa cẩm tú cầu'], ['傘','かさ','Cây ô'], ['梅雨','つゆ','Mùa mưa'], ['靴','くつ','Đôi giày']], img: 'assets/gallery/thoi-tiet-11.jpg' },
    { jp: '天気予報', kana: 'てんきよほう', romaji: 'tenkiyohō', vi: 'Dự báo thời tiết — 6 từ vựng', words: [['テレビ','','Tivi'], ['天気予報','てんきよほう','Dự báo thời tiết'], ['地図','ちず','Bản đồ'], ['リモコン','','Điều khiển'], ['マイク','','Micro'], ['お姉さん','おねえさん','Chị gái']], img: 'assets/gallery/thoi-tiet-12.jpg' }
];
/* ---------- [T104] CHỦ ĐỀ GALLERY THỨ 12 'TRANG PHỤC' — 12 ảnh cảnh (72 từ vựng JLPT N5-N4)
   theo yêu cầu user 'thêm chủ đề "trang phục" cho gallery'. Chuẩn T93c + [T98] (chip trắng
   viền teal bo 8px, 3 dòng kanji #1F2937/kana #0D9488/VI #4B5563 — 36 từ kanji kèm kana chip
   3 dòng + 36 từ thuần kana/katakana chip 2 dòng, đường nối THẲNG teal 3px, pin đồng tâm
   20+12px, font M PLUS Rounded 1c, 2x supersample LANCZOS, JPEG ≤168KB q≥78, solver chip
   4 cạnh + chống che vật); 12 cảnh: 洋服 quần áo thường ngày・着物 kimono truyền thống・制服 đồng phục học sinh・冬服 trang phục mùa đông・夏服 trang phục mùa hè・靴屋 cửa hàng giày・アクセサリー phụ kiện trang sức・かばん túi xách và ba lô・洗濯 giặt và phơi đồ・試着 thử đồ ở cửa hàng・着替え thay đồ buổi sáng・ファッションショー trình diễn thời trang (AI irasutoya-style 1344x768 — pipeline AI
   art → VLM grounding → PIL compose; QA VLM 3 vòng 12/12 PASS: pin đúng vật + chip không
   chồng + chữ sạch; fix pin sau QA: 着物 lên ngực trên obi・ブラウス tránh nơ・手袋 đúng găng
   đỏ・靴/スニーカー/靴ひも theo kệ・ハンガー đúng móc trống・ベッド vào giữa chăn・ステージ
   sang runway phải né váy ドレス). */
var GALLERY_CLOTHES_DB = [
    { jp: '洋服', kana: 'ようふく', romaji: 'yōfuku', vi: 'Quần áo thường ngày — 6 từ vựng', words: [['ズボン','','quần dài'], ['ワンピース','','đầm liền'], ['シャツ','','áo sơ mi'], ['スカート','','váy ngắn'], ['上着','うわぎ','áo khoác'], ['ベスト','','áo gilê']], img: 'assets/gallery/trang-phuc-01.jpg' },
    { jp: '着物', kana: 'きもの', romaji: 'kimono', vi: 'Kimono truyền thống — 6 từ vựng', words: [['着物','きもの','kimono'], ['扇子','せんす','quạt giấy'], ['浴衣','ゆかた','yukata'], ['下駄','げた','guốc gỗ'], ['帯','おび','đai obi'], ['草履','ぞうり','sandal zōri']], img: 'assets/gallery/trang-phuc-02.jpg' },
    { jp: '制服', kana: 'せいふく', romaji: 'seifuku', vi: 'Đồng phục học sinh — 6 từ vựng', words: [['リボン','','nơ ruy băng'], ['学生帽','がくせいぼう','mũ học sinh'], ['ブラウス','','áo voan'], ['ネクタイ','','cà vạt'], ['制服','せいふく','đồng phục'], ['靴下','くつした','đôi tất']], img: 'assets/gallery/trang-phuc-03.jpg' },
    { jp: '冬服', kana: 'ふゆふく', romaji: 'fuyufuku', vi: 'Trang phục mùa đông — 6 từ vựng', words: [['帽子','ぼうし','mũ len'], ['マフラー','','khăn quàng'], ['スカーフ','','khăn choàng'], ['セーター','','áo len'], ['手袋','てぶくろ','găng tay'], ['コート','','áo khoác ngoài']], img: 'assets/gallery/trang-phuc-04.jpg' },
    { jp: '夏服', kana: 'なつふく', romaji: 'natsufuku', vi: 'Trang phục mùa hè — 6 từ vựng', words: [['Tシャツ','','áo thun'], ['麦わら帽子','むぎわらぼうし','mũ rơm'], ['半ズボン','はんズボン','quần sooc'], ['サンダル','','đôi sandal'], ['浮き輪','うきわ','phao bơi'], ['水着','みずぎ','đồ bơi']], img: 'assets/gallery/trang-phuc-05.jpg' },
    { jp: '靴屋', kana: 'くつや', romaji: 'kutsuya', vi: 'Cửa hàng giày — 6 từ vựng', words: [['ブーツ','','đôi bốt'], ['靴','くつ','giày da'], ['スリッパ','','đôi dép lông'], ['スニーカー','','giày thể thao'], ['靴ひも','くつひも','dây giày'], ['ハイヒール','','giày cao gót']], img: 'assets/gallery/trang-phuc-06.jpg' },
    { jp: 'アクセサリー', kana: 'アクセサリー', romaji: 'akusesarī', vi: 'Phụ kiện trang sức — 6 từ vựng', words: [['イヤリング','','bông tai'], ['指輪','ゆびわ','chiếc nhẫn'], ['ネックレス','','dây chuyền'], ['腕時計','うでどけい','đồng hồ đeo tay'], ['眼鏡','めがね','cặp kính'], ['ブレスレット','','vòng tay']], img: 'assets/gallery/trang-phuc-07.jpg' },
    { jp: 'かばん', kana: 'かばん', romaji: 'kaban', vi: 'Túi xách và ba lô — 6 từ vựng', words: [['手提げ袋','てさげぶくろ','túi giấy'], ['ハンカチ','','khăn tay'], ['かばん','','cặp học sinh'], ['財布','さいふ','chiếc ví'], ['リュックサック','','chiếc ba lô'], ['スーツケース','','chiếc vali']], img: 'assets/gallery/trang-phuc-08.jpg' },
    { jp: '洗濯', kana: 'せんたく', romaji: 'sentaku', vi: 'Giặt và phơi đồ — 6 từ vựng', words: [['洗濯バサミ','せんたくバサミ','kẹp quần áo'], ['洗剤','せんざい','bột giặt'], ['洗濯機','せんたくき','máy giặt'], ['物干し竿','ものぼしざお','sào phơi'], ['アイロン','','cái bàn ủi'], ['バケツ','','cái thau']], img: 'assets/gallery/trang-phuc-09.jpg' },
    { jp: '試着', kana: 'しちゃく', romaji: 'shichaku', vi: 'Thử đồ ở cửa hàng — 6 từ vựng', words: [['店員','てんいん','nhân viên'], ['試着室','しちゃくしつ','phòng thử đồ'], ['値段','ねだん','giá tiền'], ['鏡','かがみ','tấm gương'], ['ハンガー','','móc áo'], ['マネキン','','ma-nơ-canh']], img: 'assets/gallery/trang-phuc-10.jpg' },
    { jp: '着替え', kana: 'きがえ', romaji: 'kigae', vi: 'Thay đồ buổi sáng — 6 từ vựng', words: [['ベッド','','chiếc giường'], ['パジャマ','','bộ đồ ngủ'], ['下着','したぎ','đồ lót'], ['引き出し','ひきだし','ngăn kéo'], ['目覚まし時計','めざましどけい','đồng hồ báo thức'], ['洋服ダンス','ようふくダンス','tủ quần áo']], img: 'assets/gallery/trang-phuc-11.jpg' },
    { jp: 'ファッションショー', kana: 'ファッションショー', romaji: 'fasshonshō', vi: 'Trình diễn thời trang — 6 từ vựng', words: [['モデル','','người mẫu'], ['ステージ','','sân diễn'], ['カメラ','','máy quay'], ['スポットライト','','đèn chiếu sáng'], ['ドレス','','váy dạ hội'], ['観客','かんきゃく','khán giả']], img: 'assets/gallery/trang-phuc-12.jpg' }
];
