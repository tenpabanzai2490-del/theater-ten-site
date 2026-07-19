// トップページの特集セクションと、チケットページ(ticket.html)の両方が参照する
// 「今、押し出したい公演」の情報。ここを1箇所書き換えるだけで両方に反映される。
//
// status: "open"(予約受付中) | "none"(次回公演未定)。ホームの特集セクションに反映される。
// ticketPageReady: チケットページ(ticket.html)の予約導線をまだ表示するかどうか。
//   予約方法を再検討中の間は false にしておくと、ticket.html は何も表示しない(ホームの特集セクションには影響しない)。
var FEATURED_PRODUCTION = {
  status: "open",
  ticketPageReady: true,
  title: "つかまえてごらんなさい、箸で",
  subtitle: "Theater TEN Company No.38(+23)",
  dates: "2026年8月8日(土) 13:00・18:00 / 8月9日(日) 13:00・18:00",
  venue: "アトリエTheater TEN(沖縄県那覇市安里388-52 3F)",
  leadText: "結婚も恋愛もどこか遠いものとして笑い飛ばし、“家族以上”の絆を信じて生きてきた男たち。仲間の誕生日を祝う一日、その日常に小さな亀裂が走る——独身男たちの群像コメディ。",
  flyerImage: "https://res.cloudinary.com/b0da7npk/image/upload/v1784349141/y8by7x10cqbrufpzghfx.jpg",
  detailPageUrl: "performance.html?id=" + encodeURIComponent("2026/07/18 13:32:46"),
  ticketUrl: "https://shibai-engine.net/prism/webform.php?d=tqgy3i6v"
};
