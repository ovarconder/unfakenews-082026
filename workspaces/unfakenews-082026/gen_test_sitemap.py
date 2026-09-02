# -*- coding: utf-8 -*-
locales = ["th","hi","ar","ru","en","pt","fr","it","de","ms","vi","ja","ko","zh","es"]

def alt_links(suffix):
    lines = []
    for l in locales:
        lines.append('    <xhtml:link rel="alternate" hreflang="%s" href="https://unfakenews.asia/%s%s" />' % (l, l, suffix))
    lines.append('    <xhtml:link rel="alternate" hreflang="x-default" href="https://unfakenews.asia/th%s" />' % suffix)
    return lines

def url_block(suffix, lastmod, changefreq, priority):
    loc = "https://unfakenews.asia/th" + suffix
    ls = ["  <url>",
          "    <loc>%s</loc>" % loc,
          "    <lastmod>%s</lastmod>" % lastmod,
          "    <changefreq>%s</changefreq>" % changefreq,
          "    <priority>%s</priority>" % priority]
    ls += alt_links(suffix)
    ls.append("  </url>")
    return ls

# บทความ: (suffix, lastmod)
articles = [
    ("/articles/cambodia-unesco-thai-dress-claim-2026", "2026-08-29T05:11:53Z"),
    ("/articles/who-is-the-real-thief-cultural-heritage-truth", "2026-08-22T17:12:03Z"),
    ("/articles/khmer-claims-thai-culture-via-vietnam-mv", "2026-08-18T05:38:35Z"),
    ("/articles/hun-sen-political-game-artillery-attack-thai-civilians-7eleven", "2026-08-18T08:15:58Z"),
    ("/articles/cambodia-violates-hague-convention-temple-military-base", "2026-08-16T18:11:48Z"),
    ("/articles/cambodian-refugees-ungrateful-land-claim-myth", "2026-08-15T19:38:00Z"),
    ("/articles/cambodia-unesco-thai-dress-controversy", "2026-08-06T09:00:30Z"),
    ("/articles/cambodia-opened-fire-in-border-conflict", "2026-08-05T06:57:40Z"),
]

# หน้า static: (suffix, lastmod, changefreq, priority)
pages = [
    ("",                "2026-09-02T00:43:53Z", "daily",   "1.0"),
    ("/about",          "2026-09-02T00:43:53Z", "monthly", "0.5"),
    ("/articles",       "2026-09-02T00:43:53Z", "monthly", "0.5"),
    ("/contact",        "2026-09-02T00:43:53Z", "monthly", "0.5"),
    ("/privacy",        "2026-09-02T00:43:53Z", "monthly", "0.5"),
    ("/terms",          "2026-09-02T00:43:53Z", "monthly", "0.5"),
    ("/articles",       "2026-09-02T00:43:53Z", "daily",   "0.6"),
]

out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
       '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for suffix, lastmod in articles:
    out += url_block(suffix, lastmod, "weekly", "0.8")
for suffix, lastmod, freq, prio in pages:
    out += url_block(suffix, lastmod, freq, prio)
out.append('</urlset>')

content = "\n".join(out) + "\n"
with open("public/test-sitemap.xml", "w", encoding="utf-8") as f:
    f.write(content)
print("OK written len:", len(content))
