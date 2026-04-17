const Parser = require('rss-parser');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    const { action, source, url } = req.query;
    const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0' } });

    try {
        // --- LẤY NỘI DUNG BÀI BÁO ---
        if (action === 'getContent') {
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Xóa rác
            $('script, style, rt, rp, header, footer, nav, aside, .ad, .sns').remove();

            // Selector chuẩn cho các báo
            let content = $('.article-main__body, #js-article-body, .article_body, .news-text-body, .caSec').text();
            
            // Nếu không ra chữ, lấy tất cả thẻ P
            if (!content || content.length < 100) {
                content = '';
                $('p').each((i, el) => { if($(el).text().length > 20) content += $(el).text() + '\n\n'; });
            }

            return res.status(200).json({ content: content.trim() });
        }

        // --- LẤY DANH SÁCH BÀI (NHK EASY) ---
        if (source === 'nhk_easy') {
            const response = await fetch('https://www3.nhk.or.jp/news/easy/news-list.json');
            const data = await response.json();
            const articles = [];
            const dates = Object.keys(data[0]);
            
            dates.slice(0, 3).forEach(d => {
                data[0][d].forEach(item => {
                    articles.push({
                        title: item.title,
                        link: `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
                        date: d
                    });
                });
            });
            return res.status(200).json(articles);
        }

        // --- LẤY DANH SÁCH BÀI (RSS: NHK CHUẨN / YAHOO) ---
        const rssUrl = source === 'yahoo' 
            ? 'https://news.yahoo.co.jp/rss/topics/top-picks.xml' 
            : 'https://www.nhk.or.jp/rss/news/cat0.xml';
        
        const feed = await parser.parseURL(rssUrl);
        const list = feed.items.map(i => ({ title: i.title, link: i.link, date: i.pubDate }));
        return res.status(200).json(list);

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
