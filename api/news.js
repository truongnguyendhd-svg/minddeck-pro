const Parser = require('rss-parser');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { action, source, url } = req.query;
    const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0' } });

    try {
        // 1. LẤY NỘI DUNG BÀI BÁO
        if (action === 'getContent') {
            if (!url) return res.status(400).json({ error: 'URL is required' });
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style, rt, rp, header, footer, nav, aside, .ad').remove();

            let content = $('.article-main__body, #js-article-body, .article_body, .news-text-body, .caSec').text();
            if (!content || content.length < 100) {
                content = '';
                $('p').each((i, el) => { if ($(el).text().length > 25) content += $(el).text() + '\n\n'; });
            }
            return res.status(200).json({ content: content.trim() });
        }

        // 2. LẤY TIN NHK EASY (Bản fix lỗi null/undefined)
        if (source === 'nhk_easy') {
            const response = await fetch('https://www3.nhk.or.jp/news/easy/news-list.json');
            const data = await response.json();
            const articles = [];
            
            // Kiểm tra xem data có tồn tại và có phần tử đầu tiên không
            if (data && data[0]) {
                const dates = Object.keys(data[0]);
                dates.slice(0, 3).forEach(d => {
                    const newsAtDate = data[0][d];
                    if (Array.isArray(newsAtDate)) {
                        newsAtDate.forEach(item => {
                            articles.push({
                                title: item.title,
                                link: `https://www3.nhk.or.jp/news/easy/${item.news_id}/${item.news_id}.html`,
                                date: d
                            });
                        });
                    }
                });
            }
            return res.status(200).json(articles);
        }

        // 3. LẤY TIN RSS (YAHOO / NHK CHUẨN)
        const rssUrl = source === 'yahoo' 
            ? 'https://news.yahoo.co.jp/rss/topics/top-picks.xml' 
            : 'https://www.nhk.or.jp/rss/news/cat0.xml';
        
        const feed = await parser.parseURL(rssUrl);
        const list = (feed.items || []).map(i => ({ 
            title: i.title, 
            link: i.link, 
            date: i.pubDate 
        }));
        return res.status(200).json(list);

    } catch (e) {
        console.error(e);
        return res.status(200).json({ error: "Lỗi dữ liệu: " + e.message, content: "" });
    }
};
