// /js/config.js
window.SOI_CONFIG = {
  sheetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv",
  drop: { small: 15, medium: 9, large: 1, pityThreshold: 6, pityGuarantee: "medium" },
  largeAsCoupon: true, largeAlsoPoints: true, largeAlsoPointsPts: 10,
  firebase: { apiKey: "", authDomain: "", projectId: "", appId: "" },
  defaultRewards: [
    { id: "gift-2k", name: "모바일 상품권 2천원", cost: 200, cat: "상품권" },
    { id: "free-20", name: "자유시간 20분", cost: 40, cat: "자유시간" },
    { id: "kids-30", name: "키즈방 30분", cost: 70, cat: "키즈방" },
    { id: "jelly", name: "젤리 한 봉지", cost: 30, cat: "먹을 것들" },
    { id: "snack", name: "과자 한 봉지", cost: 40, cat: "먹을 것들" },
    { id: "tv-20", name: "TV 20분", cost: 40, cat: "자유시간" },
    { id: "comic-20", name: "만화책 20분", cost: 30, cat: "자유시간" },
    { id: "park", name: "주말 놀이공원", cost: 200, cat: "상품권" }
  ],
  largeCouponRewardId: "park",
};
