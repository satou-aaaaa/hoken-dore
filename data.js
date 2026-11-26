// どの保険？の問題を作る（ブラウザと node の両方で使う）。
// 中身は、厚生労働省・ハローワーク・協会けんぽ・日本年金機構の公式ページに書いてあることだけ（2026-11-17 に読んだ。要点は共有フォルダ games/hoken-research.md）。
// 1問は、困ったときの場面を読んで、どの社会保険が支えるかを選ぶ。正解したら2段目「保険料はだれが払う？」を選ぶ。
// 扱うのは「どの保険か」の見分けだけ。もらえる額・手続き・年金の計算（年金のしくみ nenkin-shikumi）・失業手当（shitsugyo-teate）・育休（ikukyu-shikumi）の中身と重ねない。
// 場面は「会社で働く人」にそろえる（国民年金・国民健康保険の人は保険料の払い方がちがうため）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    rousai: ["厚生労働省「労災補償」", "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/rousai/index.html"],
    koyou: ["ハローワーク「雇用保険制度の概要」", "https://www.hellowork.mhlw.go.jp/insurance/insurance_summary.html"],
    koyouritsu: ["厚生労働省「雇用保険料率について」", "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000108634.html"],
    kenpo: ["全国健康保険協会（協会けんぽ）「費用の負担」", "https://www.kyoukaikenpo.or.jp/about/business/overview/001/"],
    shobyo: ["全国健康保険協会（協会けんぽ）「傷病手当金」", "https://www.kyoukaikenpo.or.jp/benefit/injury_and_sickness_allowance/"],
    kounen: ["日本年金機構「厚生年金保険の保険料」", "https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20150515-01.html"],
    rourei: ["日本年金機構「老齢年金の手続き」", "https://www.nenkin.go.jp/service/scenebetsu/rourei.html"],
    nenkin: ["厚生労働省「公的年金制度の意義、役割」", "https://www.mhlw.go.jp/stf/nenkin_shikumi_01.html"],
    kaigo: ["厚生労働省「介護保険制度の概要」", "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/kaigo_koureisha/gaiyo/index.html"],
  };

  // 選び肢になる保険
  const LEVELS = ["健康保険", "年金", "雇用保険", "労災保険", "介護保険"];
  // まぎらわしい保険（むずかしいでは1つ必ず入れ、やさしいでは入れない）
  const CONF = { "健康保険": ["労災保険"], "年金": ["介護保険"], "雇用保険": ["健康保険"], "労災保険": ["健康保険"], "介護保険": ["健康保険"] };

  // 2段目「保険料はだれが払う？」（会社で働く人の場合）
  const GROUPS = {
    seppan: { name: "会社と本人で半分ずつ", sub: "入ったときから。年齢で変わらない" },
    kaisha_ooi: { name: "会社と本人。会社が多め", sub: "会社だけが払う分もある" },
    kaisha: { name: "会社だけ", sub: "働く人は払わない" },
    kaigo: { name: "40歳以上の人", sub: "会社員なら会社と半分ずつ。費用の半分は公費" },
    honnin: { name: "本人だけ", sub: "会社は払わない" },
  };
  const GRP_WHY = {
    seppan: "健康保険と厚生年金の保険料は、会社（事業主）と本人（被保険者）が半分ずつ負担します。",
    kaisha_ooi: "雇用保険料は、会社と本人の両方が負担します。雇用保険二事業の分は会社だけが負担するので、会社のほうが多くなります。",
    kaisha: "労災保険は、原則として会社（事業主）が負担する保険料でまかなわれます。働く人は払いません。",
    kaigo: "介護保険は40歳以上の人が保険料を払います。40〜64歳の会社員は健康保険の保険料といっしょに払い、会社と本人で半分ずつ負担します。費用の半分は保険料、半分は公費です。",
    honnin: "会社をやめたあと任意継続で入る健康保険の保険料は、全額本人が負担します。",
  };
  const MEDIA = { iryo: "病気・けが", shigoto: "仕事", kurashi: "くらし", oi: "年をとる" };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  // 選び肢：やさしいは3つ（まぎらわしい保険を入れない）、ふつうは4つ、むずかしいは4つ（まぎらわしい保険を1つ必ず入れる）
  function distract(R, a, lv, cf) {
    const conf = cf.map((x) => LEVELS.indexOf(x));
    const all = LEVELS.map((_, i) => i).filter((i) => i !== a);
    if (lv === 0) return pickN(R, all.filter((i) => !conf.includes(i)), 2);
    if (lv === 1) return pickN(R, all, 3);
    const c = pickN(R, conf, 1), rest = all.filter((i) => !c.includes(i));
    return [...c, ...pickN(R, rest, 2)];
  }
  function lvl(a, sit, cf) {
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), ds = distract(R, a, lv, cf);
      const q = sit[si] + "　どの保険？";
      return { type: "act", q, opts: shuffle(R, [a, ...ds]).map((i) => LEVELS[i]), ans: LEVELS[a], rev: false, v: `${si}:${ds.join(".")}` };
    };
  }
  // id・難しさ・答え・2段目・札・名前・ヒント1・ヒント2・説明・出典・場面・まぎらわしい保険（無ければ CONF）
  const K = (id, lv, ins, grp, col, name, look, key, why, src, sit, cf) => { const a = LEVELS.indexOf(ins), conf = cf || CONF[ins]; return { id, lv, a, ans: ins, grp, col, name, look, key, why, src, conf, make: lvl(a, sit, conf) }; };

  const KINDS = [
    // ---- やさしい ----
    K("e_byoin", 0, "健康保険", "seppan", "iryo", "病院にかかる：健康保険", "病気やけがの治療を支える保険です。", "保険証で病院にかかると、窓口で払うのは一部だけ。",
      "仕事と関係のない病気やけがで病院にかかるときは、健康保険の「療養の給付」が使えます。", ["kenpo"],
      ["会社で働く人が、休みの日にかぜをひいて病院にかかった。", "会社で働く人が、家で転んで、病院で手当てを受けた。", "会社で働く人が、歯がいたくて歯医者に行った。"]),
    K("e_shitsugyo", 0, "雇用保険", "kaisha_ooi", "shigoto", "仕事をなくした：雇用保険", "働く人の仕事と生活を支える保険です。", "失業したときの「失業等給付」がある保険。",
      "会社をやめて次の仕事を探す間の手当は、雇用保険の「失業等給付」です。", ["koyou", "koyouritsu"],
      ["会社をやめて、次の仕事を探しているあいだの手当をもらう。", "会社がつぶれて仕事をなくし、仕事を探す間の手当をもらう。", "仕事をなくした人が、ハローワークで手当の手続きをする。"]),
    K("e_shigoto", 0, "労災保険", "kaisha", "shigoto", "仕事中のけが：労災保険", "仕事が原因のけがを支える保険です。", "「業務上」のけがや病気が対象。",
      "仕事中のけがは、労災保険（労働者災害補償保険）の対象です。健康保険ではありません。", ["rousai", "shobyo"],
      ["工場で仕事をしているとき、機械で手をけがした。", "お店で仕事中に、重い荷物を運んで腰を痛めた。", "建築の現場で仕事中に、はしごから落ちてけがをした。"]),
    K("e_rourei", 0, "年金", "seppan", "oi", "年をとった：年金", "年をとったあとの生活を支える保険です。", "受給資格期間が10年以上あれば受け取れる。",
      "受給資格期間が10年以上ある人は、一定の年齢になると老齢年金を受け取れます。", ["rourei", "kounen"],
      ["会社で長く働いた人が年をとり、毎月のお金を受け取るようになった。", "保険料を10年以上払ってきた人が、一定の年齢になった。", "働くのをやめたお年寄りの、老後のくらしのお金。"]),
    K("e_kaigo", 0, "介護保険", "kaigo", "oi", "介護が要る：介護保険", "介護が必要になったときの保険です。", "「要介護」と認められると、介護のサービスが使える。",
      "要介護と認められた人が介護のサービスを使うときは、介護保険の「介護給付」です。", ["kaigo"],
      ["75歳の人が「要介護」と認められ、ヘルパーに家に来てもらう。", "80歳の人が「要介護」と認められ、デイサービスに通う。", "お年寄りが「要介護」と認められ、介護の施設に入る。"]),
    K("e_shussan", 0, "健康保険", "seppan", "kurashi", "子どもが生まれた：健康保険", "出産のときのお金を出す保険です。", "「出産育児一時金」がある保険。",
      "子どもが生まれたときの「出産育児一時金」は、健康保険の給付です。", ["kenpo"],
      ["会社で働く人に子どもが生まれ、出産のお金（一時金）を受け取る。", "会社で働く人が出産して、出産育児一時金を受け取る。", "会社で働く人の家族が出産し、出産のための一時金を受け取る。"]),
    K("e_ikukyu", 0, "雇用保険", "kaisha_ooi", "kurashi", "育休中の給付：雇用保険", "働く人の仕事と生活を支える保険です。", "「育児休業等給付」がある保険。",
      "育児休業中の給付は、雇用保険の「育児休業等給付」です。", ["koyou", "koyouritsu"],
      ["会社で働く人が育児休業をとり、休んでいる間の給付を受ける。", "子どもが生まれて育休をとった会社員が、給付を受ける。", "育児のために会社を休んでいる人が、給付金を受け取る。"]),
    K("e_tsukin", 0, "労災保険", "kaisha", "shigoto", "通勤中のけが：労災保険", "通勤も対象になる保険です。", "「業務上」だけでなく「通勤」のけがも対象。",
      "通勤の途中のけがも、労災保険の対象です（業務上の事由または通勤による傷病）。", ["rousai", "shobyo"],
      ["会社へ行く途中、駅の階段で転んでけがをした。", "仕事から家に帰る途中、自転車で転んでけがをした。", "いつもの道で会社へ向かう途中、車にぶつかってけがをした。"]),
    // ---- ふつう ----
    K("n_shobyo", 1, "健康保険", "seppan", "iryo", "病気で休む：健康保険の傷病手当金", "仕事と関係のない病気やけがのときの保険です。", "「傷病手当金」は健康保険。業務外の病気やけがが対象。",
      "仕事と関係のない病気やけがで会社を休むときは、健康保険の「傷病手当金」です。", ["shobyo", "kenpo"],
      ["会社で働く人が、休みの日のけがで会社を何日も休み、給料の代わりの手当を受ける。", "会社で働く人が、仕事と関係のない病気で入院し、休んだ間の手当を受ける。", "会社で働く人が、家での病気のため長く休み、生活を支える手当を受ける。"]),
    K("n_kogaku", 1, "健康保険", "seppan", "iryo", "医療費が高い：健康保険の高額療養費", "病院の費用を支える保険です。", "「高額療養費」は健康保険の給付。",
      "1か月の医療費が高くなり、上限をこえた分が戻る「高額療養費」は、健康保険の給付です。", ["kenpo"],
      ["会社で働く人が、仕事と関係のない病気で入院し、医療費の上限をこえた分が戻ってきた。", "会社で働く人が、手術で医療費が高くなり、上限をこえた分が払い戻された。", "会社で働く人の家族が入院し、高くなった医療費の一部が戻ってきた。"]),
    K("n_shogai", 1, "年金", "seppan", "kurashi", "障害が残った：年金（障害年金）", "年をとったときだけでなく、障害にも備える保険です。", "公的年金には、障害年金や遺族年金もある。",
      "公的年金には、病気や事故で障害を負ったときの障害年金もあります。", ["nenkin", "kounen"],
      ["会社で働く人が、休みの日の事故で障害が残り、くらしを支えるお金を定期的に受ける。", "会社で働く人が、仕事と関係のない病気で障害が残り、定期的にお金を受け取る。", "若い会社員が、仕事の外の事故で障害を負い、定期的に受けるお金で生活を支える。"]),
    K("n_izoku", 1, "年金", "seppan", "kurashi", "家族が亡くなった：年金（遺族年金）", "残された家族を支える保険です。", "公的年金には、遺族年金もある。",
      "家計を支える人が亡くなったとき、残された家族には公的年金の遺族年金があります。", ["nenkin", "kounen"],
      ["家計を支えていた会社員が仕事と関係のない病気で亡くなり、子どもと配偶者が定期的にお金を受け取る。", "会社で働く親が仕事と関係のない病気で亡くなり、残された家族が定期的にお金を受ける。", "家計の担い手が仕事と関係のない病気で亡くなり、小さな子どものいる家族が定期的にお金を受ける。"]),
    K("n_yobou", 1, "介護保険", "kaigo", "oi", "要支援：介護保険の予防給付", "介護が必要にならないように支える保険でもあります。", "「要支援」でも使える。予防給付がある。",
      "要支援と認められた人のサービスは、介護保険の「予防給付」です。", ["kaigo"],
      ["70歳の人が「要支援」と認められ、体の働きを保つ運動の教室に通う。", "お年寄りが「要支援」と認められ、手すりなどの福祉用具を借りる。", "「要支援」と認められた人が、介護にならないためのサービスを使う。"]),
    K("n_teate", 1, "健康保険", "seppan", "kurashi", "出産で休む：健康保険の出産手当金", "出産で会社を休むときのお金も出す保険です。", "「出産手当金」は健康保険の給付。",
      "出産のために会社を休んだ間の「出産手当金」は、健康保険の給付です。", ["kenpo"],
      ["会社で働く人が、出産のために会社を休み、休んだ間の手当を受ける。", "出産の前後に会社を休んだ会社員が、出産手当金を受け取る。", "会社で働く人が、出産で休んで給料が出ない間の手当を受ける。"]),
    K("n_maisou", 1, "健康保険", "seppan", "kurashi", "亡くなった：健康保険の埋葬料", "亡くなったときのお金も出す保険です。", "「埋葬料」は健康保険の給付。",
      "加入している人が亡くなったときの「埋葬料」は、健康保険の給付です。", ["kenpo"],
      ["会社員が仕事と関係のない病気で亡くなり、家族が埋葬料を受け取る。", "会社で働く人が家での病気で亡くなり、家族が葬儀のためのお金（埋葬料）を受ける。", "会社員が休みの日の事故で亡くなり、葬儀をした家族が埋葬料を受け取る。"]),
    K("n_kaishatsugo", 1, "雇用保険", "kaisha_ooi", "shigoto", "会社の都合で失業：雇用保険", "働く人の仕事を支える保険です。", "失業のときの給付は、会社の都合でも自分の都合でも同じ保険。",
      "会社の都合で仕事をなくしたときも、次の仕事を探す間の手当は雇用保険の「失業等給付」です。", ["koyou", "koyouritsu"],
      ["会社の都合で仕事をやめることになり、次の仕事を探す間の手当を受ける。", "工場が閉まって仕事をなくした人が、仕事を探しながら手当を受ける。", "会社の人を減らすことになり、仕事をなくした人が手当を受ける。"]),
    // ---- むずかしい ----
    K("h_shigoto_yasumu", 2, "労災保険", "kaisha", "shigoto", "仕事のけがで休む：労災保険", "仕事が原因なら、健康保険ではありません。", "傷病手当金は「業務外」だけ。仕事のけがは労災。",
      "仕事中のけがで休むときは労災保険です。健康保険の傷病手当金は、業務外の病気やけがだけが対象です。", ["shobyo", "rousai"],
      ["仕事中のけがで会社を何日も休み、休んだ間の補償を受ける。", "工場の仕事で腕を痛め、会社を休んだ間の補償を受ける。", "配達の仕事中に転んで骨を折り、休んだ間の補償を受ける。"]),
    K("h_tsukin_byoin", 2, "労災保険", "kaisha", "iryo", "通勤のけがで病院：労災保険", "病院でも、健康保険とはかぎりません。", "通勤のけがは労災の対象。健康保険の対象外。",
      "通勤の途中のけがで病院にかかるときは、労災保険の対象です。健康保険ではありません。", ["rousai", "shobyo"],
      ["会社へ行く途中に転んでけがをして、病院で手当てを受けた。", "仕事帰りの道で事故にあい、病院で治療を受けた。", "朝の通勤の途中、駅で足をくじいて病院にかかった。"]),
    K("h_kaigo2", 2, "介護保険", "kaigo", "oi", "50代で介護：介護保険", "65歳より前でも使える場合があります。", "40〜64歳の人も、特定の病気なら使える。",
      "40〜64歳の人も、特定疾病（末期がん・関節リウマチなど）で要介護になれば、介護保険のサービスを使えます。", ["kaigo"],
      ["55歳の人が、関節リウマチで「要介護」と認められ、介護のサービスを使う。", "60歳の人が、特定の病気で「要介護」と認められ、ヘルパーに来てもらう。", "50代の人が、末期がんで「要介護」と認められ、家で介護のサービスを受ける。"]),
    K("h_ninni", 2, "健康保険", "honnin", "kurashi", "やめたあとも続ける：健康保険（任意継続）", "会社をやめても続けられる保険です。", "「任意継続」は健康保険のしくみ。",
      "会社をやめたあとも前の会社の健康保険を続ける「任意継続」は、健康保険のしくみです。保険料は全額本人負担です。", ["kenpo"],
      ["会社をやめたあと、前の会社の医療の保険を自分で続ける（任意継続）。", "退職した人が、それまでの医療の保険に任意継続で入り続ける。", "会社をやめた人が、病院にかかるための保険を、前の会社のまま続ける。"]),
    K("h_shussan_vs", 2, "健康保険", "seppan", "kurashi", "出産で休む手当：健康保険", "育休の給付とは別の保険です。", "出産手当金は健康保険。育休の給付は雇用保険。",
      "出産のために休んだ間の「出産手当金」は健康保険です。そのあとの育休の給付（育児休業等給付）は雇用保険です。", ["kenpo", "koyou"],
      ["会社で働く人が、出産の前後の休みの間（育休の前）に手当を受ける。", "出産のために会社を休んだ人が、育休に入る前の期間の手当を受ける。", "会社で働く人が、出産の日の前後に休んだ分の手当を受ける。"], ["雇用保険"]),
    K("h_rourei_vs", 2, "年金", "seppan", "oi", "年をとってからのお金：年金", "介護のサービスとは別の保険です。", "年をとってからのお金は年金。介護のサービスは介護保険。",
      "年をとってからの毎月のお金は年金（老齢年金）です。介護が必要になったときのサービスは介護保険です。", ["rourei", "kounen"],
      ["65歳をこえた元会社員が、介護は要らないが、毎月のくらしのお金を受け取る。", "会社を退職したお年寄りが、受給資格期間を満たして毎月お金を受け取る。", "長く会社で働いた人が年をとり、くらしのためのお金を定期的に受け取る。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const GRP_OF = Object.fromEntries(KINDS.map((k) => [k.id, k.grp]));

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "e_byoin|2026-11-17:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.col], src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const HKN = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, LEVELS, CONF, MEDIA, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = HKN; else root.HKN = HKN;
})(typeof self !== "undefined" ? self : this);
