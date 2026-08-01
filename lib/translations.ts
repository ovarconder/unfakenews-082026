// ============================================================
// UI Translations (6 Languages)
// ============================================================
// Supported: English, Thai, Chinese, Japanese, Spanish, Portuguese
// Static UI text only — article translations use Gemini API.
// ============================================================

import type { Locale } from "./locales";

export type TranslationKey =
  | "nav.home"
  | "nav.about"
  | "nav.articles"
  | "nav.contact"
  | "hero.title"
  | "hero.subtitle"
  | "hero.cta"
  | "about.title"
  | "about.description"
  | "about.mission"
  | "about.vision"
  | "about.values"
  | "contact.title"
  | "contact.description"
  | "contact.name"
  | "contact.email"
  | "contact.message"
  | "contact.send"
  | "contact.sent"
  | "footer.copyright"
  | "footer.powered"
  | "articles.latest"
  | "articles.readMore"
  | "articles.noArticles"
  | "articles.category"
  | "home.featured"
  | "home.latestArticles"
  | "about.missionDesc"
  | "about.visionDesc"
  | "about.value1Title"
  | "about.value1Desc"
  | "about.value2Title"
  | "about.value2Desc"
  | "about.value3Title"
  | "about.value3Desc"
  | "articles.title"
  | "articles.published"
  | "articles.by"
  | "common.loading"
  | "common.translating"
  | "lang.switchTo"
  | "hero.learnMore"
  | "hero.tagline";

const DEFAULT_LOCALE: Locale = "en";

const translations: Record<TranslationKey, Partial<Record<Locale, string>>> = {
  "nav.home": {
    en: "Home",
    th: "หน้าแรก",
    zh: "首页",
    ja: "ホーム",
    es: "Inicio",
    pt: "Início",
  },
  "nav.about": {
    en: "About Us",
    th: "เกี่ยวกับเรา",
    zh: "关于我们",
    ja: "私たちについて",
    es: "Sobre nosotros",
    pt: "Sobre nós",
  },
  "nav.articles": {
    en: "Articles",
    th: "บทความ",
    zh: "文章",
    ja: "記事",
    es: "Artículos",
    pt: "Artigos",
  },
  "nav.contact": {
    en: "Contact",
    th: "ติดต่อเรา",
    zh: "联系我们",
    ja: "お問い合わせ",
    es: "Contacto",
    pt: "Contato",
  },
  "hero.title": {
    en: process.env.NEXT_PUBLIC_SITE_NAME_EN || process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage",
    th: process.env.NEXT_PUBLIC_SITE_NAME_TH || "สยามเฮอริเทจ",
    zh: process.env.NEXT_PUBLIC_SITE_NAME_ZH || "暹罗遗产",
    ja: process.env.NEXT_PUBLIC_SITE_NAME_JA || "サイアムヘリテージ",
    es: process.env.NEXT_PUBLIC_SITE_NAME_ES || "Siam Heritage",
    pt: process.env.NEXT_PUBLIC_SITE_NAME_PT || "Siam Heritage",
  },
  "hero.subtitle": {
    en: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Discover stories that matter.",
    th: "พื้นที่ของคุณ — ค้นพบเรื่องราวที่ใช่สำหรับคุณ",
    zh: "你的空间 — 发现重要的故事",
    ja: "あなたの空間 — 大切なストーリーを見つけよう",
    es: "Tu espacio — descubre historias que importan.",
    pt: "Seu espaço — descubra histórias que importam.",
  },
  "hero.cta": {
    en: "Read Latest Articles",
    th: "อ่านบทความล่าสุด",
    zh: "阅读最新文章",
    ja: "最新記事を読む",
    es: "Leer artículos recientes",
    pt: "Ler artigos recentes",
  },
  "hero.learnMore": {
    en: "Learn More",
    th: "เรียนรู้เพิ่มเติม",
    zh: "了解更多",
    ja: "もっと知る",
    es: "Más información",
    pt: "Saiba mais",
  },
  "about.title": {
    en: `About ${process.env.NEXT_PUBLIC_SITE_NAME_EN || process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage"}`,
    th: `เกี่ยวกับ${process.env.NEXT_PUBLIC_SITE_NAME_TH || "สยามเฮอริเทจ"}`,
    zh: `关于${process.env.NEXT_PUBLIC_SITE_NAME_ZH || "暹罗遗产"}`,
    ja: `${process.env.NEXT_PUBLIC_SITE_NAME_JA || "サイアムヘリテージ"}について`,
    es: `Sobre ${process.env.NEXT_PUBLIC_SITE_NAME_ES || "Siam Heritage"}`,
    pt: `Sobre ${process.env.NEXT_PUBLIC_SITE_NAME_PT || "Siam Heritage"}`,
  },
  "about.description": {
    en: "We share stories, insights, and perspectives that inspire and connect.",
    th: "เราแบ่งปันเรื่องราว มุมมอง และแรงบันดาลใจที่เชื่อมโยงผู้คนเข้าด้วยกัน",
    zh: "我们分享启发人心、连接彼此的故事、见解与观点。",
    ja: "感動と繋がりを生むストーリー、洞察、視点を共有します。",
    es: "Compartimos historias, perspectivas e ideas que inspiran y conectan.",
    pt: "Compartilhamos histórias, perspectivas e ideias que inspiram e conectam.",
  },
  "about.mission": {
    en: "Mission",
    th: "พันธกิจ",
    zh: "使命",
    ja: "ミッション",
    es: "Misión",
    pt: "Missão",
  },
  "about.vision": {
    en: "Vision",
    th: "วิสัยทัศน์",
    zh: "愿景",
    ja: "ビジョン",
    es: "Visión",
    pt: "Visão",
  },
  "about.values": {
    en: "Values",
    th: "ค่านิยม",
    zh: "价值观",
    ja: "価値観",
    es: "Valores",
    pt: "Valores",
  },
  "about.missionDesc": {
    en: "To deliver authentic stories that resonate and create meaningful connections.",
    th: "ส่งมอบเรื่องราวที่แท้จริง สะท้อนจิตวิญญาณ และสร้างความเชื่อมโยงที่มีความหมาย",
    zh: "传递真实的故事，引发共鸣，建立有意义的连接。",
    ja: "共感を呼び、意味のある繋がりを生み出す本物のストーリーをお届けします。",
    es: "Entregar historias auténticas que resuenen y creen conexiones significativas.",
    pt: "Entregar histórias autênticas que ressoem e criem conexões significativas.",
  },
  "about.visionDesc": {
    en: "To be a space where voices are heard and stories come alive.",
    th: "เป็นพื้นที่ที่เสียงของผู้คนได้รับการรับฟัง และเรื่องราวมีชีวิตขึ้นมา",
    zh: "成为一个声音被倾听、故事活起来的空间。",
    ja: "声が届き、物語が生き生きとする空間を目指します。",
    es: "Ser un espacio donde las voces sean escuchadas y las historias cobren vida.",
    pt: "Ser um espaço onde as vozes são ouvidas e as histórias ganham vida.",
  },
  "about.value1Title": {
    en: "Authenticity",
    th: "ความจริงแท้",
    zh: "真实",
    ja: "信憑性",
    es: "Autenticidad",
    pt: "Autenticidade",
  },
  "about.value1Desc": {
    en: "We share real stories, told with honesty and integrity.",
    th: "เราแบ่งปันเรื่องจริง ด้วยความซื่อสัตย์และมี integrity",
    zh: "我们以诚实和正直分享真实的故事。",
    ja: "誠実さと誠意を持って、本当のストーリーを共有します。",
    es: "Compartimos historias reales, contadas con honestidad e integridad.",
    pt: "Compartilhamos histórias reais, contadas com honestidade e integridade.",
  },
  "about.value2Title": {
    en: "Creativity",
    th: "ความคิดสร้างสรรค์",
    zh: "创意",
    ja: "創造性",
    es: "Creatividad",
    pt: "Criatividade",
  },
  "about.value2Desc": {
    en: "We embrace creative expression in every form.",
    th: "เราเปิดรับการแสดงออกทางความคิดสร้างสรรค์ในทุกรูปแบบ",
    zh: "我们拥抱各种形式的创意表达。",
    ja: "あらゆる形の創造的表現を受け入れます。",
    es: "Aceptamos la expresión creativa en todas sus formas.",
    pt: "Aceitamos a expressão criativa em todas as formas.",
  },
  "about.value3Title": {
    en: "Connection",
    th: "การเชื่อมโยง",
    zh: "连接",
    ja: "繋がり",
    es: "Conexión",
    pt: "Conexão",
  },
  "about.value3Desc": {
    en: "Building a community through shared stories and experiences.",
    th: "สร้างชุมชนผ่านเรื่องราวและประสบการณ์ร่วมกัน",
    zh: "通过分享的故事和经历建立社区。",
    ja: "共有された物語と経験を通じてコミュニティを築く。",
    es: "Construir una comunidad a través de historias y experiencias compartidas.",
    pt: "Construir uma comunidade através de histórias e experiências compartilhadas.",
  },
  "contact.title": {
    en: "Contact Us",
    th: "ติดต่อเรา",
    zh: "联系我们",
    ja: "お問い合わせ",
    es: "Contáctenos",
    pt: "Fale Conosco",
  },
  "contact.description": {
    en: "Have questions or suggestions? Send us a message here.",
    th: "มีคำถามหรือข้อเสนอแนะ? ส่งข้อความถึงเราได้ที่นี่",
    zh: "有问题或建议？请在此留言。",
    ja: "ご質問やご提案がありましたら、こちらからメッセージをお送りください。",
    es: "¿Tienes preguntas o sugerencias? Envíanos un mensaje aquí.",
    pt: "Tem perguntas ou sugestões? Envie-nos uma mensagem aqui.",
  },
  "contact.name": {
    en: "Name",
    th: "ชื่อ",
    zh: "姓名",
    ja: "お名前",
    es: "Nombre",
    pt: "Nome",
  },
  "contact.email": {
    en: "Email",
    th: "อีเมล",
    zh: "邮箱",
    ja: "メールアドレス",
    es: "Correo electrónico",
    pt: "E-mail",
  },
  "contact.message": {
    en: "Message",
    th: "ข้อความ",
    zh: "留言",
    ja: "メッセージ",
    es: "Mensaje",
    pt: "Mensagem",
  },
  "contact.send": {
    en: "Send Message",
    th: "ส่งข้อความ",
    zh: "发送留言",
    ja: "送信する",
    es: "Enviar mensaje",
    pt: "Enviar mensagem",
  },
  "contact.sent": {
    en: "Your message has been sent successfully!",
    th: "ส่งข้อความสำเร็จ!",
    zh: "您的留言已成功发送！",
    ja: "メッセージが送信されました！",
    es: "¡Tu mensaje ha sido enviado con éxito!",
    pt: "Sua mensagem foi enviada com sucesso!",
  },
  "footer.copyright": {
    en: "All rights reserved.",
    th: "สงวนลิขสิทธิ์",
    zh: "版权所有",
    ja: "全著作権所有",
    es: "Todos los derechos reservados.",
    pt: "Todos os direitos reservados.",
  },
  "footer.powered": {
    en: `Powered by ${process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage"} — ${process.env.NEXT_PUBLIC_SITE_TAGLINE || "Discover Thai heritage, arts, and history."}`,
    th: `ขับเคลื่อนโดย ${process.env.NEXT_PUBLIC_SITE_NAME || "สยามเฮอริเทจ"} — ค้นพบมรดกไทย ศิลปะ และประวัติศาสตร์`,
    zh: `由 ${process.env.NEXT_PUBLIC_SITE_NAME || "暹罗遗产"} 驱动 — 探索泰国遗产、艺术与历史`,
    ja: `${process.env.NEXT_PUBLIC_SITE_NAME || "サイアムヘリテージ"} が提供 — タイの遺産、芸術、歴史を探求`,
    es: `Impulsado por ${process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage"} — Descubre el patrimonio, arte e historia tailandesa`,
    pt: `Impulsionado por ${process.env.NEXT_PUBLIC_SITE_NAME || "Siam Heritage"} — Descubra a herança, arte e história tailandesa`,
  },
  "articles.latest": {
    en: "Latest Articles",
    th: "บทความล่าสุด",
    zh: "最新文章",
    ja: "最新記事",
    es: "Artículos recientes",
    pt: "Artigos recentes",
  },
  "articles.readMore": {
    en: "Read More",
    th: "อ่านเพิ่มเติม",
    zh: "阅读更多",
    ja: "続きを読む",
    es: "Leer más",
    pt: "Ler mais",
  },
  "articles.noArticles": {
    en: "No articles at the moment. Stay tuned!",
    th: "ยังไม่มีบทความในขณะนี้ โปรดติดตาม!",
    zh: "暂无文章，敬请期待！",
    ja: "現在記事はありません。お楽しみに！",
    es: "No hay artículos en este momento. ¡Estén atentos!",
    pt: "Nenhum artigo no momento. Fique ligado!",
  },
  "articles.category": {
    en: "Category",
    th: "หมวดหมู่",
    zh: "分类",
    ja: "カテゴリー",
    es: "Categoría",
    pt: "Categoria",
  },
  "home.featured": {
    en: "Featured Article",
    th: "บทความแนะนำ",
    zh: "精选文章",
    ja: "注目記事",
    es: "Artículo destacado",
    pt: "Artigo em destaque",
  },
  "home.latestArticles": {
    en: "Latest Articles",
    th: "บทความล่าสุด",
    zh: "最新文章",
    ja: "最新記事",
    es: "Últimos artículos",
    pt: "Últimos artigos",
  },
  "articles.title": {
    en: "All Articles",
    th: "บทความทั้งหมด",
    zh: "所有文章",
    ja: "すべての記事",
    es: "Todos los artículos",
    pt: "Todos os artigos",
  },
  "articles.published": {
    en: "Published",
    th: "เผยแพร่เมื่อ",
    zh: "发布于",
    ja: "公開日",
    es: "Publicado",
    pt: "Publicado",
  },
  "articles.by": {
    en: "By",
    th: "โดย",
    zh: "作者",
    ja: "著者",
    es: "Por",
    pt: "Por",
  },
  "common.loading": {
    en: "Loading...",
    th: "กำลังโหลด...",
    zh: "加载中...",
    ja: "読み込み中...",
    es: "Cargando...",
    pt: "Carregando...",
  },
  "common.translating": {
    en: "Loading...",
    th: "กำลังแปล...",
    zh: "翻译中...",
    ja: "翻訳中...",
    es: "Traduciendo...",
    pt: "Traduzindo...",
  },
  "lang.switchTo": {
    en: "Language",
    th: "ภาษา",
    zh: "语言",
    ja: "言語",
    es: "Idioma",
    pt: "Idioma",
  },
  "hero.tagline": {
    en: "A hub for news, articles, and fact-checking to combat fake news and deliver accurate information.",
    th: "ศูนย์รวมข่าวสาร บทความ และการตรวจสอบข้อเท็จจริง (Fact-Checking) เพื่อแก้ไขข่าวปลอม (Fake News) และนำเสนอข้อมูลที่ถูกต้อง",
    zh: "汇集新闻、文章与事实核查，打击假新闻并传播准确信息。",
    ja: "ニュース、記事、ファクトチェック（事実確認）を集結し、フェイクニュースを防ぎ、正確な情報を提供するハブです。",
    es: "Un centro de noticias, artículos y verificación de hechos para combatir las noticias falsas y brindar información precisa.",
    pt: "Um hub de notícias, artigos e verificação de fatos para combater notícias falsas e fornecer informações precisas.",
  },
};

export function t(key: TranslationKey, locale: Locale): string {
  const map = translations[key];
  if (!map) return key;
  if (map[locale]) return map[locale]!;
  if (map[DEFAULT_LOCALE]) return map[DEFAULT_LOCALE]!;
  return key;
}
