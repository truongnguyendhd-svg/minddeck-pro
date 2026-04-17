const Parser = require('rss-parser');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
    // Cho phép CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { action, source, url } = req.query;

    // --- CHỨC NĂNG 1: LẤY NỘI DUNG BÀI BÁO (ĐỌC BÁO) ---
    if (action === 'getContent') {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            let content = '';

            // Xóa rác (menu, quảng cáo, script) trước khi bóc chữ
            $('script, style, nav, footer, header, aside, .related, .ad').remove();

            // Nhắm mục tiêu bóc chữ theo từng trang báo
            if (url.includes('yahoo')) {
                content = $('#uamods, .article_body').text();
            } else if (url.includes('nhk')) {
                // Lấy thẻ span chứa text (loại bỏ ruby/furigana dư thừa của NHK Easy)
                $('rt').remove(); 
                content = $('.content--detail-main, .article-main__body, #js-article-body, #newsarticle').text();
            }

            // Nếu không tìm thấy class chuẩn, vét cạn tất cả thẻ <p>
            if (!content || content.trim().length < 50) {
                $('p').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 20) content += text + '\n\n';
                });
            }

            // Xóa khoảng trắng thừa
            content = content.replace(/\n\s*\n/g, '\n\n').trim();
            return res.status(200).json({ content });
        } catch (e) {
            return res.status(500).json({ error: 'Không thể tải nội dung bài viết.' });
        }
    }

    // --- CHỨC NĂNG 2: LẤY DANH SÁCH BÀI BÁO MỚI NHẤT ---
    const parser = new Parser();
    let articles = [];

    try {
        if (source === 'nhk_easy') {
            // NHK Easy dùng JSON đặc biệt
            const response = await fetch('https://www3.nhk.or.jp/news/easy/news-list.json');
            const data = await response.json();
            const dateKeys = data[0] ? Object.keys(data[0]) : [];
            
            // Lấy tin của 2-3 ngày gần nhất
            dateKeys.slice(0, 3).forEach(date => {
                data[0][date].forEach(item => {
                    articles.push({
                        title: item.title,
                        link: `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
                        date: date
                    });
                });
            });
        } 
        else if (source === 'nhk') {
            const feed = await parser.parseURL('https://www.nhk.or.jp/rss/news/cat0.xml');
            articles = feed.items.map(item => ({ title: item.title, link: item.link, date: item.pubDate }));
        } 
        else if (source === 'yahoo') {
            const feed = await parser.parseURL('https://news.yahoo.co.jp/rss/topics/top-picks.xml');
            articles = feed.items.map(item => ({ title: item.title, link: item.link, date: item.pubDate }));
        }

        return res.status(200).json(articles.slice(0, 15)); // Trả về 15 tin mới nhất
    } catch (e) {
        return res.status(500).json({ error: 'Không thể tải danh sách tin tức.' });
    }
}
