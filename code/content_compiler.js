// ============================================================
// content_compiler.js — Wild Agency Full Audit Content Compiler
// Senior++ v1.0 | 12.04.2026
//
// PURPOSE: Transform raw FA pipeline phaseMap into a structured
// content_map for the HTML Generator (fa_html.md prompt).
//
// INPUT:  $input.first().json — CHAIN with phaseMap from DB
// OUTPUT: return [{ json: { ...chain, content_map: {...} } }]
//
// CRITICAL: All extractors use safe_get() — no crashes on null.
// All pains MUST be specific: numbers, percentages, real facts.
// ============================================================

// ---- UTILITIES ----

function safe_get(obj, path, fallback) {
  if (fallback === undefined) fallback = null;
  try {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur != null ? cur : fallback;
  } catch(e) { return fallback; }
}

function safe_json(str, fallback) {
  if (fallback === undefined) fallback = {};
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    const clean = str.replace(/^```json\s*/i,'').replace(/```\s*$/,'').trim();
    return JSON.parse(clean);
  } catch(e) { return fallback; }
}

function safe_arr(val) {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  return [val];
}

function score_label(score) {
  if (score == null) return 'Немає даних';
  const n = parseInt(score);
  if (n >= 80) return 'Добре';
  if (n >= 60) return 'Задовільно';
  if (n >= 40) return 'Є проблеми';
  return 'Критично';
}

function score_emoji(score) {
  if (score == null) return '⚪';
  const n = parseInt(score);
  if (n >= 80) return '🟢';
  if (n >= 60) return '🟡';
  if (n >= 40) return '🟠';
  return '🔴';
}

function score_meaning(channel, score) {
  if (score == null) return '';
  const n = parseInt(score);
  const M = {
    smm:  ['алгоритм ховає контент, підписники не купують',
            'є охоплення, але конверсія низька',
            'соцмережі активно приводять клієнтів'],
    seo:  ['сайт не знаходять у пошуку, трафік близький до нуля',
            'базовий трафік є, але конкуренти попереду',
            'добре ранжується за ключовими запитами'],
    maps: ['мало відгуків або низький рейтинг — Google Maps ховає',
            'присутність є, але рейтинг нижче конкурентів',
            'Google Maps активно приводить нових клієнтів'],
    ads:  ['реклама відсутня або зливає бюджет без результату',
            'реклама є, але ROAS нижчий за ринковий',
            'платна реклама рентабельна і масштабується'],
    brand:['бренд не впізнаваний, немає позиціонування',
            'впізнаваність є в локальному ринку',
            'сильний бренд, клієнти рекомендують'],
    overall:['бізнес невидимий онлайн, щодня втрачає клієнтів',
             'цифрова присутність є, але не конвертує',
             'ефективна цифрова екосистема'],
  };
  const arr = M[channel] || M.overall;
  if (n < 50) return arr[0];
  if (n < 70) return arr[1];
  return arr[2];
}

function fmt_num(n) {
  if (n == null) return null;
  return parseInt(n).toLocaleString('uk-UA');
}

// ---- MAIN ----

const chain = $input.first().json;
const phaseMap = chain.phaseMap || {};

const p1  = safe_json(phaseMap.phase1  || '{}');
const p2a = safe_json(phaseMap.phase2a || '{}');
const p2b = safe_json(phaseMap.phase2b || '{}');
const p3  = safe_json(phaseMap.phase3  || '{}');

// Individual agent outputs
const smm   = safe_json(safe_get(p1, 'smm_analyst'));
const seo   = safe_json(safe_get(p1, 'seo_analyst'));
const maps  = safe_json(safe_get(p1, 'maps_analyst'));
const ads   = safe_json(safe_get(p1, 'ads_analyst'));
const comp  = safe_json(safe_get(p1, 'competitor_analyst'));
const brand = safe_json(safe_get(p1, 'brand_analyst'));
const aud   = safe_json(safe_get(p1, 'audience_analyst'));
const rep   = safe_json(safe_get(p1, 'reputation_analyst'));

const syn_overall = safe_json(safe_get(p2a, 'synthesizer_overall'));
const syn_digital = safe_json(safe_get(p2a, 'synthesizer_digital'));
const syn_comp    = safe_json(safe_get(p2a, 'synthesizer_competitive'));
const psych       = safe_json(safe_get(p2b, 'psychology_analyst'));

const mk_smm   = safe_json(safe_get(p3, 'marketer_smm'));
const mk_seo   = safe_json(safe_get(p3, 'marketer_seo'));
const mk_ads   = safe_json(safe_get(p3, 'marketer_ads'));
const mk_brand = safe_json(safe_get(p3, 'marketer_brand'));
const mk_crm   = safe_json(safe_get(p3, 'marketer_crm'));
const mk_pr    = safe_json(safe_get(p3, 'marketer_pr'));

// ---- IDENTITY ----

const biz_name  = chain.business_name_clean || chain.business_name || 'Бізнес';
const biz_city  = chain.city
  || safe_get(maps, 'city') || safe_get(smm, 'city')
  || safe_get(brand, 'city') || '';
const biz_cat   = safe_get(maps, 'category')
  || safe_get(smm, 'category') || safe_get(brand, 'category') || 'Бізнес';
const biz_url   = chain.website_url || safe_get(seo, 'website_url') || '';
const biz_ig    = chain.instagram_username
  || safe_get(smm, 'instagram_username')
  || safe_get(smm, 'instagram.username') || '';

// ---- SCORES ----

const score_smm     = safe_get(smm,   'score') || safe_get(syn_digital, 'score_smm')  || null;
const score_seo     = safe_get(seo,   'score') || safe_get(syn_digital, 'score_seo')  || null;
const score_maps    = safe_get(maps,  'score') || safe_get(syn_digital, 'score_maps') || null;
const score_ads     = safe_get(ads,   'score') || safe_get(syn_digital, 'score_ads')  || null;
const score_brand   = safe_get(brand, 'score') || safe_get(syn_overall, 'score_brand')|| null;
const score_overall = safe_get(syn_overall, 'overall_score')
  || safe_get(chain, 'overall_score') || null;

// ---- SMM ----

const ig_followers = safe_get(smm, 'instagram.followers')
  || safe_get(smm, 'followers') || null;
const ig_avg_likes = safe_get(smm, 'instagram.avg_likes')
  || safe_get(smm, 'avg_likes') || null;
const ig_er        = safe_get(smm, 'instagram.engagement_rate')
  || safe_get(smm, 'engagement_rate') || null;
const ig_er_bench  = safe_get(smm, 'instagram.er_benchmark')
  || safe_get(smm, 'er_benchmark') || '1-3%';
const ig_posts     = safe_get(smm, 'instagram.posts_count')
  || safe_get(smm, 'posts_count') || null;
const fb_likes     = safe_get(smm, 'facebook.page_likes')
  || safe_get(smm, 'fb_likes') || null;
const smm_pains    = safe_arr(safe_get(smm, 'pains') || safe_get(smm, 'problems') || []);

// ---- SEO ----

const da_score        = safe_get(seo, 'domain_authority') || safe_get(seo, 'da') || null;
const monthly_traffic = safe_get(seo, 'monthly_traffic')  || safe_get(seo, 'traffic') || null;
const keywords_count  = safe_get(seo, 'keywords_count')   || safe_get(seo, 'ranked_keywords') || null;
const top3_keywords   = safe_arr(safe_get(seo, 'top_keywords') || safe_get(seo, 'keywords') || []).slice(0,3);
const seo_pains       = safe_arr(safe_get(seo, 'pains') || safe_get(seo, 'problems') || []);
const backlinks       = safe_get(seo, 'backlinks') || null;

// ---- MAPS ----

const maps_rating  = safe_get(maps, 'rating') || safe_get(maps, 'google_rating') || null;
const maps_reviews = safe_get(maps, 'total_reviews') || safe_get(maps, 'reviews_count') || null;
const maps_address = safe_get(maps, 'address') || '';
const maps_phone   = safe_get(maps, 'phone') || chain.phone || '';
const worst_reviews= safe_arr(
  safe_get(maps, 'worst_reviews') || safe_get(rep, 'worst_reviews') || []
).slice(0,4);
const best_reviews = safe_arr(safe_get(maps, 'best_reviews') || []).slice(0,2);
const maps_pains   = safe_arr(safe_get(maps, 'pains') || safe_get(maps, 'problems') || []);

// ---- ADS ----

const ads_running       = safe_get(ads, 'ads_running') || safe_get(ads, 'has_ads') || false;
const fb_ads_running    = safe_get(ads, 'facebook_ads') || false;
const google_ads_running= safe_get(ads, 'google_ads')   || false;
const ads_spend_est     = safe_get(ads, 'monthly_spend_est') || safe_get(ads, 'spend_estimate') || null;
const ads_platforms     = safe_arr(safe_get(ads, 'platforms') || []);
const ads_pains         = safe_arr(safe_get(ads, 'pains') || safe_get(ads, 'problems') || []);
const any_ads           = ads_running || fb_ads_running || google_ads_running;

// ---- BRAND ----

const brand_positioning = safe_get(brand, 'positioning') || safe_get(brand, 'tagline') || null;
const brand_usp         = safe_get(brand, 'usp') || safe_get(brand, 'unique_value') || null;
const brand_consistency = safe_get(brand, 'visual_consistency') || safe_get(brand, 'consistency') || null;
const brand_voice       = safe_get(brand, 'brand_voice') || null;
const brand_pains       = safe_arr(safe_get(brand, 'pains') || safe_get(brand, 'problems') || []);

// ---- AUDIENCE ----

const aud_segments  = safe_arr(safe_get(aud, 'segments') || safe_get(aud, 'audience_segments') || []);
const aud_primary   = safe_get(aud, 'primary_segment') || aud_segments[0] || null;
const aud_age_range = safe_get(aud, 'age_range') || safe_get(aud, 'age') || null;
const aud_geography = safe_get(aud, 'geography') || biz_city;

// ---- PSYCH ----

const psych_triggers  = safe_arr(safe_get(psych, 'buying_triggers') || safe_get(psych, 'triggers') || []);
const psych_barriers  = safe_arr(safe_get(psych, 'barriers') || safe_get(psych, 'objections') || []);
const psych_hooks     = safe_arr(safe_get(psych, 'emotional_hooks') || safe_get(psych, 'hooks') || []);
const psych_archetype = safe_get(psych, 'brand_archetype') || null;

// ---- SYNTHESIS ----

const key_insights     = safe_arr(safe_get(syn_overall, 'key_insights') || safe_get(syn_overall, 'insights') || []);
const main_problem     = safe_get(syn_overall, 'main_problem') || safe_get(syn_overall, 'summary') || null;
const growth_potential = safe_get(syn_overall, 'growth_potential') || safe_get(syn_overall, 'potential') || null;
const competitive_pos  = safe_get(syn_comp, 'competitive_position') || safe_get(syn_comp, 'position') || null;
const main_competitors = safe_arr(
  safe_get(syn_comp, 'main_competitors') || safe_get(comp, 'top_competitors') || []
).slice(0,3);
const competitor_nearby= safe_arr(
  safe_get(comp, 'nearby_competitors') || safe_get(maps, 'nearby_competitors') || []
).slice(0,3);

// ---- PAIN BUILDERS (specific numbers required) ----

function first_pain(arr) {
  if (!arr || arr.length === 0) return null;
  const p = arr[0];
  if (typeof p === 'string' && p.length > 20) return p;
  if (typeof p === 'object') return p.description || p.text || p.pain || null;
  return null;
}

function build_smm_pain() {
  const fp = first_pain(smm_pains);
  if (fp) return fp;
  if (ig_followers && ig_avg_likes) {
    const er = (parseInt(ig_avg_likes)/parseInt(ig_followers)*100).toFixed(1);
    return `${fmt_num(ig_followers)} підписників і лише ~${fmt_num(ig_avg_likes)} реакцій на пост (ER ${er}% при нормі ${ig_er_bench}) — алгоритм ховає контент`;
  }
  if (ig_followers) {
    return `${fmt_num(ig_followers)} підписників без системного контент-плану — Instagram не конвертує в клієнтів`;
  }
  return 'Соцмережі ведуться непослідовно — немає стратегії конвертації підписників у клієнтів';
}

function build_seo_pain() {
  const fp = first_pain(seo_pains);
  if (fp) return fp;
  if (!biz_url) return 'Відсутній сайт — бізнес не ловить жодного пошукового трафіку';
  if (monthly_traffic && parseInt(monthly_traffic) < 500)
    return `Сайт отримує лише ~${monthly_traffic} відвідувачів/міс — клієнти йдуть до конкурентів з кращим SEO`;
  if (da_score && parseInt(da_score) < 20)
    return `Domain Authority ${da_score}/100 — сайт практично не видно в Google`;
  return 'Сайт не оптимізований під пошукові запити — цільові клієнти не знаходять бізнес у Google';
}

function build_maps_pain() {
  const fp = first_pain(maps_pains);
  if (fp) return fp;
  if (!maps_rating) return 'Відсутня або незаповнена картка Google Мій Бізнес — бізнес не відображається в локальному пошуку';
  const r = parseFloat(maps_rating);
  if (r < 4.0 && maps_reviews)
    return `Рейтинг ${maps_rating}★ (${maps_reviews} відгуків) — Google Maps ховає нижче конкурентів з 4.5+`;
  if (maps_reviews && parseInt(maps_reviews) < 50)
    return `Лише ${maps_reviews} відгуків у Google Maps — мало соціального підтвердження для нових клієнтів`;
  return 'Репутація в Google Maps потребує активної роботи для зростання в локальній видачі';
}

function build_ads_pain() {
  const fp = first_pain(ads_pains);
  if (fp) return fp;
  if (!any_ads)
    return 'Реклама не запущена — конкуренти займають рекламні позиції та перехоплюють готових купити клієнтів';
  return 'Реклама є, але запущена без системної аналітики — бюджет витрачається, ROI невідомий';
}

function build_brand_pain() {
  const fp = first_pain(brand_pains);
  if (fp) return fp;
  if (!brand_usp) return 'Відсутнє чітке позиціонування — клієнти не розуміють чим цей бізнес кращий за конкурентів';
  if (brand_consistency === 'low' || brand_consistency === 'poor')
    return "Непослідовний візуальний стиль — бренд не запам'ятовується";
  return 'Бренд не диференційований на ринку — відсутня унікальна цінність яка утримує клієнтів';
}

// ---- PAINS LIST ----

const pains = [
  { channel:'SMM',   icon:'📱', pain: build_smm_pain()   },
  { channel:'SEO',   icon:'🔍', pain: build_seo_pain()   },
  { channel:'Maps',  icon:'📍', pain: build_maps_pain()  },
  { channel:'Ads',   icon:'🎯', pain: build_ads_pain()   },
  { channel:'Brand', icon:'💎', pain: build_brand_pain() },
].filter(p => p.pain);

// ---- HYPOTHESES BUILDER ----

function build_hyp(agent, channel, label, icon) {
  const defaults_what = {
    SMM:   'Системний контент-план: 3 пости/тиж + Stories + Reels з конверсійними закликами',
    SEO:   'SEO оптимізація: технічний аудит + контент під ключові запити + лінкбілдинг',
    Ads:   'Запуск Meta + Google Ads з A/B тестом креативів і конверсійним пікселем',
    Brand: 'Ребрендинг: USP + tone of voice + єдиний стиль всіх точок контакту',
    CRM:   'Впровадження CRM + автоматизація follow-up: WhatsApp/Telegram бот',
    PR:    'PR кампанія: медіа публікації + партнерства + лідери думок у ніші',
  };
  return {
    channel, label, icon,
    what:    safe_get(agent,'hypothesis') || safe_get(agent,'recommendation') || safe_get(agent,'action') || defaults_what[label] || `Оптимізація ${channel}`,
    budget_uah:       safe_get(agent,'budget_uah')      || safe_get(agent,'budget')      || null,
    budget_usd:       safe_get(agent,'budget_usd')      || null,
    result:           safe_get(agent,'expected_result') || safe_get(agent,'result')       || null,
    timeline_months:  safe_get(agent,'timeline_months') || safe_get(agent,'timeline')     || safe_get(agent,'months') || null,
    kpi:              safe_get(agent,'kpi')              || safe_get(agent,'metric')       || null,
    priority:         safe_get(agent,'priority')         || 'medium',
    roi_estimate:     safe_get(agent,'roi_estimate')     || safe_get(agent,'roi')          || null,
  };
}

const hypotheses = [
  build_hyp(mk_smm,   'SMM',   'SMM',     '📱'),
  build_hyp(mk_seo,   'SEO',   'SEO',     '🔍'),
  build_hyp(mk_ads,   'Ads',   'Реклама', '🎯'),
  build_hyp(mk_brand, 'Brand', 'Бренд',   '💎'),
  build_hyp(mk_crm,   'CRM',   'CRM',     '🔄'),
  build_hyp(mk_pr,    'PR',    'PR',      '📣'),
];

// ---- REVIEWS ----

function fmt_review(r) {
  if (!r) return null;
  if (typeof r === 'string') return { author:'Клієнт', stars:null, text:r, sentiment:'negative' };
  return {
    author: r.author_name || r.author || r.reviewer || 'Клієнт',
    stars:  r.rating      || r.stars  || null,
    text:   r.text        || r.review || r.comment  || r.content || '',
    date:   r.date        || r.published_at || null,
    photo:  r.author_photo || r.photo || null,
  };
}

const reviews_negative = worst_reviews.map(fmt_review).filter(r => r && r.text).slice(0,3);
const reviews_positive = best_reviews.map(fmt_review).filter(r => r && r.text).slice(0,2);
const reviews_display  = [
  ...reviews_positive.slice(0,1).map(r => ({...r, sentiment:'positive'})),
  ...reviews_negative.map(r => ({...r, sentiment:'negative'})),
];

// ---- PRESENCE ----

const presence = {
  instagram: {
    exists:   !!(ig_followers || biz_ig),
    username: biz_ig || null,
    followers: ig_followers,
    avg_likes: ig_avg_likes,
    er:        ig_er,
    posts:     ig_posts,
    er_bench:  ig_er_bench,
    score:        score_smm,
    score_label:  score_label(score_smm),
    score_emoji:  score_emoji(score_smm),
    score_meaning:score_meaning('smm', score_smm),
  },
  facebook: {
    exists: !!fb_likes,
    likes:  fb_likes,
  },
  website: {
    exists:           !!biz_url,
    url:              biz_url,
    monthly_traffic,
    domain_authority: da_score,
    keywords_count,
    top_keywords:     top3_keywords,
    backlinks,
    score:        score_seo,
    score_label:  score_label(score_seo),
    score_emoji:  score_emoji(score_seo),
    score_meaning:score_meaning('seo', score_seo),
  },
  google_maps: {
    exists:        !!(maps_rating || maps_address),
    rating:        maps_rating,
    reviews_total: maps_reviews,
    address:       maps_address,
    phone:         maps_phone,
    score:         score_maps,
    score_label:   score_label(score_maps),
    score_emoji:   score_emoji(score_maps),
    score_meaning: score_meaning('maps', score_maps),
  },
  ads: {
    running:    any_ads,
    platforms:  ads_platforms,
    spend_est:  ads_spend_est,
    score:        score_ads,
    score_label:  score_label(score_ads),
    score_emoji:  score_emoji(score_ads),
    score_meaning:score_meaning('ads', score_ads),
  },
  brand: {
    positioning:  brand_positioning,
    usp:          brand_usp,
    voice:        brand_voice,
    consistency:  brand_consistency,
    score:        score_brand,
    score_label:  score_label(score_brand),
    score_emoji:  score_emoji(score_brand),
    score_meaning:score_meaning('brand', score_brand),
  },
};

// ---- TIMELINE ----

const timeline = (() => {
  const hyps_with_time = hypotheses.filter(h => h.timeline_months);
  if (hyps_with_time.length >= 3) {
    return hyps_with_time.map(h => ({
      period:  String(h.timeline_months),
      title:   `${h.icon} ${h.label}`,
      actions: [h.what],
      kpi:     h.kpi,
      result:  h.result,
    }));
  }
  return [
    { period:'1',   title:'🚀 Сетап і запуск',    actions:['Стратегія і технічна база','Запуск реклами','Контент-план'] },
    { period:'2-3', title:'⚙️ Активація каналів', actions:['SMM: перші Reels','SEO: ключові сторінки','Ads: оптимізація'] },
    { period:'4-6', title:'📈 Зростання',          actions:['Масштабування реклами','Органічний трафік','Репутація і відгуки'] },
    { period:'6+',  title:'🏆 Систематизація',     actions:['CRM автоматизація','Loyalty програма','PR і партнерства'] },
  ];
})();

// ---- AUDIENCE ----

const audience = {
  primary:    aud_primary,
  segments:   aud_segments.slice(0,3),
  age_range:  aud_age_range,
  geography:  aud_geography,
  triggers:   psych_triggers.slice(0,4),
  barriers:   psych_barriers.slice(0,3),
  hooks:      psych_hooks.slice(0,3),
  archetype:  psych_archetype,
};

// ---- COMPETITORS ----

function fmt_competitor(c) {
  if (typeof c === 'string') return { name:c };
  return {
    name:      c.name || c.business_name || 'Конкурент',
    rating:    c.rating || c.google_rating || null,
    followers: c.instagram_followers || c.followers || null,
    strength:  c.strength || c.advantage || null,
    website:   c.website || null,
  };
}

const competitors = {
  position: competitive_pos,
  main:     main_competitors.map(fmt_competitor),
  nearby:   competitor_nearby.map(c => typeof c==='string' ? {name:c} : {name:c.name||c,rating:c.rating||null,distance:c.distance||null}),
};

// ---- PRICING (Wild Agency fixed) ----

const pricing = {
  audit_only: {
    name:        'Full Audit',
    price_uah:   3500,
    price_usd:   90,
    description: 'Повний аудит цифрової присутності (цей звіт)',
    duration:    '3-5 днів',
    note:        'Зараховується при замовленні Сетапу',
    includes:    ['21 AI-агент аналізу','Повний звіт 26 сторінок','Лендинг з доступом 90 днів','Аудіо-резюме'],
  },
  setup: {
    name:        'Сетап',
    price_uah:   15000,
    price_usd:   380,
    description: 'Стратегія + технічна база + запуск всіх каналів',
    duration:    '1 місяць',
    includes:    ['Контент-стратегія SMM','SEO аудит + оптимізація','Google Мій Бізнес налаштування','Запуск таргетованої реклами','Брендинг: USP + tone of voice'],
    note:        'Full Audit включено',
  },
  retainer: {
    name:        'Wild Retainer',
    price_uah:   8000,
    price_usd:   200,
    period:      'місяць',
    description: 'Щомісячне ведення: SMM + SEO + Ads + аналітика',
    duration:    'від 3 місяців',
    includes:    ['12 постів/міс','SEO моніторинг','Ads менеджмент','Щомісячний звіт','Консультації без ліміту'],
  },
};

// ---- HERO ----

const headline = main_problem
  || (score_overall ? `Digital Score ${biz_name}: ${score_overall}/100 — ${score_meaning('overall',score_overall)}` : null)
  || `Аналіз цифрової присутності: ${biz_name}`;

const tagline = brand_positioning
  || growth_potential
  || 'Детальний аудит 5 каналів: SMM, SEO, Карти, Реклама, Бренд';

// ---- SCORES SECTION ----

const scores = {
  overall: { value:score_overall, label:score_label(score_overall), emoji:score_emoji(score_overall), meaning:score_meaning('overall',score_overall) },
  smm:     { value:score_smm,     label:score_label(score_smm),     emoji:score_emoji(score_smm),     meaning:score_meaning('smm',    score_smm) },
  seo:     { value:score_seo,     label:score_label(score_seo),     emoji:score_emoji(score_seo),     meaning:score_meaning('seo',    score_seo) },
  maps:    { value:score_maps,    label:score_label(score_maps),    emoji:score_emoji(score_maps),    meaning:score_meaning('maps',   score_maps) },
  ads:     { value:score_ads,     label:score_label(score_ads),     emoji:score_emoji(score_ads),     meaning:score_meaning('ads',    score_ads) },
  brand:   { value:score_brand,   label:score_label(score_brand),   emoji:score_emoji(score_brand),   meaning:score_meaning('brand',  score_brand) },
};

// ---- CONTENT MAP ----

const content_map = {

  meta: {
    version:              '1.0',
    compiled_at:          new Date().toISOString(),
    session_id:           chain.session_id            || null,
    discovery_session_id: chain.discovery_session_id  || null,
    business_name:        biz_name,
    city:                 biz_city,
    category:             biz_cat,
    phases_available: {
      phase1:  Object.keys(p1).length  > 0,
      phase2a: Object.keys(p2a).length > 0,
      phase2b: Object.keys(p2b).length > 0,
      phase3:  Object.keys(p3).length  > 0,
    },
  },

  hero: {
    business_name:        biz_name,
    city:                 biz_city,
    category:             biz_cat,
    website:              biz_url,
    instagram:            biz_ig ? `@${biz_ig}` : null,
    phone:                maps_phone,
    address:              maps_address,
    headline,
    tagline,
    overall_score:        score_overall,
    overall_score_label:  score_label(score_overall),
    overall_score_emoji:  score_emoji(score_overall),
    overall_score_meaning:score_meaning('overall', score_overall),
  },

  scores,
  pains,
  presence,

  reviews: {
    google_rating:  maps_rating,
    total_reviews:  maps_reviews,
    display:        reviews_display,
    negative:       reviews_negative,
    positive:       reviews_positive,
    key_insight:    safe_get(rep,'reputation_summary') || safe_get(rep,'insight') || null,
  },

  audience,
  hypotheses,
  competitors,
  timeline,

  synthesis: {
    main_problem,
    key_insights:          key_insights.slice(0,5),
    growth_potential,
    competitive_position:  competitive_pos,
    quick_wins:            safe_arr(safe_get(syn_overall,'quick_wins') || []).slice(0,3),
    strategic_priorities:  safe_arr(safe_get(syn_overall,'strategic_priorities') || safe_get(syn_overall,'priorities') || []).slice(0,4),
  },

  pricing,

  contact: {
    telegram:      '@wild_makss',
    telegram_bot:  '@wildagency_bot',
    email:         'mark.wild.dma@gmail.com',
    website:       'wildagency.pro',
    cta_primary:   `Хочу Сетап для ${biz_name}`,
    cta_secondary: 'Поговорити про стратегію',
    cta_audit:     'Замовити Full Audit',
  },

};

// ---- RETURN ----

const debug = {
  pains_count:        pains.length,
  hypotheses_count:   hypotheses.length,
  reviews_count:      reviews_display.length,
  scores_available:   Object.values(scores).filter(s => s.value != null).length,
  phases_ok:          content_map.meta.phases_available,
  has_competitors:    competitors.main.length + competitors.nearby.length,
  has_audience:       !!(audience.primary || audience.segments.length),
};

return [{ json: { ...chain, content_map, content_compiler_debug: debug } }];
