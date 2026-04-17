const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { action, source, url } = req.query;
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' };

    try {
        // --- CHẾ ĐỘ 1: QUÉT DANH SÁCH BÀI VIẾT (BROWSE) ---
        if (action === 'list') {
            let target = "";
            if (source === 'nhk_easy') target = "https://www3.nhk.or.jp/news/easy/";
            else if (source === 'nhk') target = "https://www3.nhk.or.jp/news/";
            else if (source === 'yahoo') target = "https://news.yahoo.co.jp/";

            const response = await fetch(target, { headers });
            const html = await response.text();
            const $ = cheerio.load(html);
            let articles = [];

            if (source === 'nhk_easy') {
                // Quét trang NHK Easy
                $('.news-list__item, article').each((i, el) => {
                    const title = $(el).find('.title, h2, h3').text().trim();
                    let link = $(el).find('a').attr('href');
                    if (title && link) {
                        if (link.startsWith('.')) link = "https://www3.nhk.or.jp/news/easy" + link.substring(1);
                        articles.push({ title, link });
                    }
                });
            } else {
                // Quét NHK Chuẩn hoặc Yahoo
                $('a').each((i, el) => {
                    const title = $(el).text().trim();
                    const link = $(el).attr('href');
                    if (title.length > 20 && link && link.includes('news')) {
                        let fullLink = link.startsWith('http') ? link : new URL(target).origin + link;
                        articles.push({ title, link: fullLink });
                    }
                });
            }
            // Lọc bỏ bài trùng và lấy 20 bài đầu
            return res.status(200).json(articles.filter((v,i,a)=>a.findIndex(t=>(t.title===v.title))===i).slice(0, 20));
        }

        // --- CHẾ ĐỘ 2: ĐỌC NỘI DUNG CHI TIẾT (READ) ---
        if (action === 'read') {
            const response = await fetch(url, { headers });
            const html = await response.text();
            const $ = cheerio.load(html);
            $('script, style, rt, rp, nav, footer, header, aside, .ad').remove();

            let content = $('.article-main__body, #js-article-body, .article_body, .news-text-body, .caSec').text();
            if (!content || content.length < 100) {
                content = "";
                $('p').each((i, el) => { if($(el).text().length > 30) content += $(el).text() + "\n\n"; });
            }
            return res.status(200).json({ title: $('title').text(), content: content.trim() });
        }
    } catch (e) {
        return res.status(200).json({ error: e.message });
    }
};
