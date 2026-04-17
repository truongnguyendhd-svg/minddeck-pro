const Parser = require('rss-parser');
const cheerio = require('cheerio');

// Ngụy trang thành trình duyệt Chrome thật để không bị báo Nhật Bản chặn
const fetchOptions = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    }
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { action, source, url } = req.query;

    // ==========================================
    // CHỨC NĂNG 1: BÓC TÁCH CHỮ TỪ BÀI BÁO
    // ==========================================
    if (action === 'getContent') {
        try {
            const response = await fetch(url, fetchOptions);
            const html = await response.text();
            const $ = cheerio.load(html);
            let content = '';

            // Xóa sạch quảng cáo, menu, furigana (rt) để tránh rác
            $('script, style, nav, footer, header, aside, .related, .ad, rt').remove();

            // Nhắm mục tiêu bóc chữ chuẩn xác
            if (url.includes('yahoo')) {
                content = $('.sc-12tyznb-0, .article_body, .highLightSearchTarget, #uamods').text();
            } else if (url.includes('nhk')) {
                content = $('.content--detail-main, .article-main__body, #js-article-body, .news-text-body, #newsarticle').text();
            }

            // Giải pháp dự phòng tối thượng: Nếu vẫn không tìm thấy, quét toàn bộ thẻ <p>
            if (!content || content.trim().length < 50) {
                $('p').each((i, el) => {
                    const text = $(el).text().trim();
                    // Bỏ qua các đoạn quá ngắn hoặc chứa bản quyền
                    if (text.length > 30 && !text.includes('Copyright') && !text.includes('©')) {
                        content += text + '\n\n';
                    }
                });
            }

            content = content.replace(/\n\s*\n/g, '\n\n').trim();

            if (!content) {
                return res.status(200).json({ error: 'Bài báo này yêu cầu đăng nhập hoặc bị chặn bóc tách.' });
            }

            return res.status(200).json({ content });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi bóc tách: ' + e.message });
        }
    }

    // ==========================================
    // CHỨC NĂNG 2: LẤY DANH SÁCH TIN TỨC
    // ==========================================
    let articles = [];

    try {
        if (source === 'nhk_easy') {
            const response = await fetch('https://www3.nhk.or.jp/news/easy/news-list.json', fetchOptions);
            const data = await response.json();
            
            if (data && data[0]) {
                const dateKeys = Object.keys(data[0]);
                dateKeys.slice(0, 3).forEach(date => {
                    if (Array.isArray(data[0][date])) {
                        data[0][date].forEach(item => {
                            articles.push({
                                title: item.title,
                                link: `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
                                date: date
                            });
                        });
                    }
                });
            }
            return res.status(200).json(articles);
        } 
        else {
            // Dùng Parser cho RSS chuẩn (NHK Chuẩn và Yahoo)
            const parser = new Parser({ headers: fetchOptions.headers });
            
            if (source === 'nhk') {
                const feed = await parser.parseURL('https://www.nhk.or.jp/rss/news/cat0.xml');
                articles = feed.items.map(item => ({ title: item.title, link: item.link, date: item.pubDate }));
            } 
            else if (source === 'yahoo') {
                const feed = await parser.parseURL('https://news.yahoo.co.jp/rss/topics/top-picks.xml');
                articles = feed.items.map(item => ({ title: item.title, link: item.link, date: item.pubDate }));
            }
            return res.status(200).json(articles.slice(0, 15));
        }
    } catch (e) {
        return res.status(500).json({ error: 'Lỗi tải danh sách: ' + e.message });
    }
}
