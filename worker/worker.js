var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
// worker.js truong
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __defProp22 = Object.defineProperty;
var __name22 = /* @__PURE__ */ __name2((target, value) => __defProp22(target, "name", { value, configurable: true }), "__name");

// Phân tách từ tiếng Nhật thông minh bằng Segmenter
var segmenter = new Intl.Segmenter("ja", { granularity: "word" });
function tokenize(text) {
  if (!text) return "";
  return [...segmenter.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment).join(" ");
}
__name(tokenize, "tokenize");
__name2(tokenize, "tokenize");
__name22(tokenize, "tokenize");
// Hàm kiểm tra quyền Admin thông qua Khóa Bảo mật trong Environment Variables
function checkAdminAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7).trim();
  const adminSecret = env.ADMIN_SECRET_KEY;
  if (!adminSecret) {
    console.error("ADMIN_SECRET_KEY chưa được cấu hình trong biến môi trường của Cloudflare!");
    return false;
  }
  return token === adminSecret;
}
// Hàm bốc ngẫu nhiên API Key từ chuỗi cấu hình xoay tua để phân phối tải
function getRandomKey(keysString) {
  if (!keysString) return null;
  const keys = keysString.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}
__name(getRandomKey, "getRandomKey");

// Hàm gọi Mistral AI trên Backend cho các tác vụ của Client nếu cần
async function callMistralAI(prompt, env) {
  const mistralKey = getRandomKey(env.MISTRAL_API_KEYS);
  if (!mistralKey) {
    throw new Error("Chưa cấu hình API Key Mistral trong biến môi trường MISTRAL_API_KEYS!");
  }

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mistralKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Mistral API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
__name(callMistralAI, "callMistralAI");
__name2(callMistralAI, "callMistralAI");
__name22(callMistralAI, "callMistralAI");

// Hàm bổ trợ gọi Groq AI dạng không Stream (Non-Streaming JSON Object) chuyên bồi đắp ngầm
async function callGroqAI_NonStream(prompt, env, model = "qwen/qwen3.8-27b") {
  const groqKey = getRandomKey(env.GROQ_API_KEYS);
  if (!groqKey) {
    throw new Error("Chưa cấu hình API Key Groq trong biến môi trường GROQ_API_KEYS!");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 6096,
      max_completion_tokens: 6096,
      reasoning_format: "parsed"
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || "";
  
  // Tự động dọn dẹp các thẻ suy nghĩ ngầm <think>...</think> nếu có để tránh làm gãy cú pháp JSON
  content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  
  return content;
}
__name(callGroqAI_NonStream, "callGroqAI_NonStream");
// =========================================================================
// 🟢 DATASET IRASUTOYA — kho tranh minh hoạ free phong cách Nhật (13 category)
// Crawl 1 lần ngày 2026-10-20 từ https://www.irasutoya.com (label pages, ảnh s400)
// Cấu trúc mỗi ảnh: { t: tiêu đề Nhật, u: URL ảnh s400 (blogger CDN), c: category Nhật }
// Giấy phép いらすとや: ảnh free cho thương mại, TỐI ĐA 20 ảnh / 1 sản phẩm,
// cần ghi nguồn — frontend widget đã hiển thị credit + link về irasutoya.com
// =========================================================================
var IRASUTOYA_IMAGES = [{"t":"豆腐バーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLXZ9__VwApWKfXKx0z0l1H7-odif1uTFEDK1X1RvEhaHMTuB9rROZ7vzAUN-1o0VvmfLL9vBIEk_rnOOnGoG348BwsttNqoA-Ka0vcOp7eOSU3cIvwoaqJS3Z-8gThYtvbt7wfLmwg6fiBluN7c326WwGRAscOFhpChxSKDrHbbpw-todcnE6XG7iV9yM/s400/food_tofu_bar.png","c":"食べ物"},{"t":"機能性表示食品のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj9PAfYl1_dgTcSDuErApgsjOaA0a8Xr_p8oXQPybMFgWYnmgS41LsUIcJp_M2sLI290lEC1zC3y5x5w6wkxbM89UDWyc6-PxdHpQ3MdzeaKsrWLhTv3Ruqjn14CzRN9mLs9yvoiUvuNWNXiue3OO2lCh28q6D-3ktqbAdUsoe6O0436GMM8-p0eUWHv4Fl/s400/food_kinouseihyouji.png","c":"食べ物"},{"t":"栄養機能食品のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjBDXB7T2VwiPGEIv8E2Sr-HULMtei_LhpM_fJxlVYCfgDt8rf-K0TPvViJRmMSaAG-mF7c2nnKru4vXrbOmwpOGZbo-eDZOC34hWYFh6FvPPBlX_XoL6FEsCz1SB5M-M-IQ4EPFei-OsRMokCHVImt-O62m0Dnynvrf190-uIviTsLlXt1LH2TC_LeEBlO/s400/food_eiyoukinou.png","c":"食べ物"},{"t":"特定保健用食品のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiKaue9xYsQAWjEXp31MU4B_25WqW_QQJRW-Y1erQWexkTH9YYntKHswJj9eKLHQcnYxM8GJgxqPSx61cgPt6zM6eSCPsxBZWJ5ZNvXe-NWKgnhEPJ7ZLIzb763rnhiw5eh4_ZG8ykfYA33pomh_0KY2qw3uj_-lxO8DviN0Kofpp7P1Pn0dyRsj_58AY0w/s400/food_tokuho.png","c":"食べ物"},{"t":"プロテインバーのイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEg0KYjP_osuB3yb7PPGg0cqmfh4PKs1hnzM6X_HI3JHyKmuH_ahcNE0kjcdNmtm2fpNWk31GQy2FXSfpHtIwmzF9kbSbmWDaYCjezsba0NObXQ90iE8LP_i3tLjXrx1oWuwrXGkpVapQpIDEi1cj5yV6_84llKT7I59jTukJAyFqNpRkEg8GmsWoxePtg=s72-c","c":"食べ物"},{"t":"大豆ミートのイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEiwbmJCtPAm1WICo7y06bg4Qd1jIOqKblysjyUG0x3vpbZbUpkkqlRwPcjscXOn_FkOgSwgNsBPTEZ0XmGe1nyMUlI0wpb80bUqYhRsQvESh8z0gV6sQG__aHiZSm1QRUTdFte_ai67jqS71pLiRGYQtRW0leXjuEHn5lF1xM6J0zU7BtJ80HZDVvxgmw=s72-c","c":"食べ物"},{"t":"培養肉のイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEgxKdda6qGSPvSr5Gdq0r1vD_Dit9bDYYp61AzM1qpHwc3X1kA6emDqfEK19ktFzpOrN3_FQEu6bhojy1kFySAC26hC5MNUzh7C4mbrgk-WK_rzMCarZTbBAmmA-ogQRsFfPztTRNxmOjvRRewRrbQHDw6EpQ9ReZ3vEe4kV-1HTU4ZYJ1xgzfnDE0eBg=s72-c","c":"食べ物"},{"t":"栄養補助スナックのイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEih34bIfzZkekWB1FpyNms7yOgPcow95tmcpDS9rajsRVR33qWHuX9hKy7ObTMOmOMgLHTlUe7ZtES_U3UmMpAyBLZ6PGcBqAnk0mlw0jG16JMg4e587riBC9bzk8X07Dv2SFhb_pMqUwjOGZo9oNXupGuQ7j0CLOLss7cb4pHuul5uWc-Naa0se3EdmQ=s72-c","c":"食べ物"},{"t":"シェントウジャンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjfb7FUyUfiYgOV93kBOU7A8ioGdsWd-YWLu5KZ7E_DevCxoRWCxT0VAeURzjZKenDOPPBxh9vSLbyMRMsVMEREZYpg4LgKtTpnCMFGtxBAX8YkLgfJMwZZoYh79J8-4WWZqqy4XEEOUdDi/s400/food_taiwan_shentoujan.png","c":"食べ物"},{"t":"納豆卵かけご飯のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijox0gTiodjx_n3G7X5l8XpRM55dLTy0ygcYQtpgoZ09554infBQUkcads1rlQnUoDQmafKaK7Th5OpNJgHqjh_RJ-DXfjFJQgVFXGrtdIers873eatoKFrwmSVgWqI2OprMvSI88gSi6p/s400/food_nattou_tamago_gohan.png","c":"食べ物"},{"t":"いろいろな卵かけご飯のイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEhh-ib6jl6H1sS8jRB_spusAsWMwqI89kJLCrx2YHF61HidTOpVIBELxys7_CnRDn1SHgj6oLR4qekNR_W88OuSYgr3gCbmQIqEgM5FlrM6xr4ekzHxaNq0C8RAqPwVlCrPN7RmDijut3RCXNUl2PETkaEklxZxCHPhp_n9sszOC90q7lC3KOTScDU8KA=s72-c","c":"食べ物"},{"t":"ごぼうの天ぷらのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQsjf-rjJ7Qm6Tt3-LBK5Tg27ELUObb9E_SGpQNrF3ChTZSo5Z-l4YaA7p0mL6kLHZgFmP_vRMfTNaoTa8keanPpkJzfNgWbbcR1zXPLfn-OW0ygx0_2fKvJqT_5_yTeFIWAt0RfOBy7rK/s400/food_gobou_tenpura_goboten.png","c":"食べ物"},{"t":"ごぼ天うどんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgB9EsoenaBaa5b4kru40xO-ERPTtxK1MuJO_8moHTTGy-6DpNxzac9yv4RBL1Zl2qo2CM4spoAEOae1taEVdClUSUzd_C44eYB6HXeb9dYsh46CI3TT2xXrGIhf8Y7zhJnuh_1LVJJTd1v/s400/food_udon_goboten.png","c":"食べ物"},{"t":"たこ焼きの屋台のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjOqAh79eBtrjXND7rbJDcgxFXa1Pvi0gMIoaL2LS_8Gq9nQEqjtnUDtt8xviKARfTYIBRr_7ZphlLrF3BgvGKmv8mLWieRGfskESGvPmr-8ngNEK9_uEKVmkJXKCN8zrGjgDsVMJvKBJMP/s400/building_takoyaki_yatai.png","c":"食べ物"},{"t":"角煮まんじゅうのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiAyMmXKQvsPMPVck5FilUJbsAvI9JskLGyTpicw2QG2RK-cAkBBgy4RfIVSh-anB33qYcRLsRfPNiGUYEmSnShnvxlEoqPIleR8nS0tSD8H1kjNvYSfwKMbU_Yj54IHZj73OeiFnrSNOwP/s400/food_kakuni_manju.png","c":"食べ物"},{"t":"フライドガーリックのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgKq8lAjoKulcrJXhCYG3cvKvxk93Lb1kwzTxs_5vi6o6obfmEotml5qy5ts1pP5wsMaA67AN4nR0y-rffzoiOO34C2SLd2MDAEZHWTUY6jbr98_4sGX_mkxBIBnHdmqk6XCTcaU3NCPyh/s400/food_fried_garlic.png","c":"食べ物"},{"t":"フライドオニオンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg-aKq2vkVhpllMUoitW-ZV06j4p5lTn_owxOZOUKk2s9UrNyCCjGFWcXMrCM3enmjaV-9QDjoc3rcYTXluVrq4LQ2So_JdSQkaaoELPiqXYXWwA5fhiHrS2czEDO2H09IXBwb0Gc0N97EM/s400/food_fried_onion.png","c":"食べ物"},{"t":"ペリメニのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEipYSAt75PuLNf5Hf5ou95EXJnwtqeeC3zF5q2Gy6_ndQvqpjY2bwjvlFd0KzaF1mJ5aXMxdFYEFS3RUbWeas0xqfT-W-qgSCoG1BSZqgdJjSeozOMhJ9LiDo_CuPYYPm-ntk8qZ0IXApqc/s400/food_perimeni.png","c":"食べ物"},{"t":"いろいろなカットされたピザのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFRQjQ39_bnOB7g2Iwn6s7s-hGsmvKcavB5j_kPDPM8Uj2caTNImLBgiPmDwQGuG3d4v0rBlmcWYA3l-Udyfj_OawdErd8aStEEmXJUJu9NmA8obYa9-DwkElyLiQjzx8PuwTqnL90YU9M/s400/thumbnail_food_pizza_cut.jpg.","c":"食べ物"},{"t":"一本うどんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiOax7KyPJII2joz_2_7_J_HtWCKiLjRT3gfYipV2TRCr9JYKnJP56Q2hw0W7HggoDFT0pup0ZXAn0XtSnlXeLUyN3yPBD_NPzxC-_ckzsC2SxQmz4CV5wGIKX1hJFabkYBRytt4K3aXzd6/s400/food_udon_ippoin.png","c":"食べ物"},{"t":"おにぎり屋さんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjrPxqDDm489ZIbuj2fsyq7sPqrJ9BX6Y7LWY0q3S6vJH5KVAerWMgXyUa1WOs5K6eUSfq4gTmOIzqjbuhvnAfvvQsizKN-Jylyf5nxdykZIyjEmMuAdcHRzgWnQBhSwVdqLjMbTJiPtXvm/s400/building_onigiri_shop.png","c":"食べ物"},{"t":"ヤムニョムチキンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgA1Fcv2rV0z4Re0etrzmutY5igPsCQ6UaO-0Htb8QI0lVPqsO4KT17p3jOPugXfzhhOMz53iIBr3Y7MfImpuSE73Zn-xJ2f4xqSffCicbWpQpFhWcd6yEJk-cMQCkv-gXQQMUCTOwTtEcF/s400/food_yamunyomu_chiken.png","c":"食べ物"},{"t":"いろいろなピザのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj6DlwmhSgmlJ1Fjohz6PpoemJgRw6n8IPsda7IDQxraWlNJMJoW95F4Sb9_3wU_xupof-cE5oCv9ceN_wlW0m8S5G29mg4qkQL8hooGkX07r27sgSf0Xq9_Qm15m-YKSirboZ1jHjWu47r/s400/thumbnail_food_pizza.jpg.","c":"食べ物"},{"t":"こぼれいくら丼のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgKc2vdQz5k92g5v5SNnNlbMGGcKCwvx3Uqzh8Rrhav7sKtNyXq2SjSbFrxCv6w9l-vx4kBxZNgDdzDn9cSLlSKLqTbSTHAL7BrsdkZ4erausJnc7rNj2H2NzTLbbfiSTVIHdTK1OiMglYA/s400/food_sushi_kobore_ikura_don.png","c":"食べ物"},{"t":"黄色いカレーライスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3EgvQozyB5j_oleIp-lt0OSn2h-v-uxf7XNMUi0B4eRzrw5a0WnoX5qG4tVSAFqKSmLl0RHyJcXXnAiLNmOsLRJwrMqK7RI5mfE6a8meKE92hGUoM2DfD2l_nPwKZxOaqOWCOkI_G0om6/s400/food_curry_mukashi_yellow.png","c":"食べ物"},{"t":"緑のカレーライスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgjyZLhXUB5H6fUCYZEcQrO7sWWRJhOKXiMA1XdwwY30jS2s8yxjCNdsbo0LH9EqCcZ-lC96iAPyLyZhHjX4QPGg8hKw3sjhpJmbCXAdPZ616m8u7evnxWeUVYp6rq-1M32Dm_ivOxbfHkM/s400/food_curry_sagu_rice.png","c":"食べ物"},{"t":"サグカレーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEixM1GHt4F7ow6Klw38KE4Z1ASPfrTQgQ90nK0uGi2Jt8HYFOySg34Q7pXRWgAczJ66Rw0a0pY7fdx_QoRl5AtVPNCiYrKcxK-XJ52UjTEq2e4rM_v_t0slj2_DSP4SBqbw9xdhrB2TSX9A/s400/food_curry_sagu.png","c":"食べ物"},{"t":"ピータン豆腐のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYqtegmGX8gDMsocMl-wYZK0ZQldNanjanV583xpL7ky06dns5rxcj6Zdb4QiGlMUlb3Xz22OiZJd9lmKs-pOUf-KFfvve4xkQQ2cVunv_1Go3IaasePAOeCoePjF1JYbZaWmNdEBnSVJc/s400/food_pi-tan_tofu.png","c":"食べ物"},{"t":"ボンゴレビアンコのイラスト&#65288;パスタ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgV6ir-u5ZfQgL_JfXDLhkL5Ubz0_-UBlxWU0Oh4RZLCWeNsvRuNvU4IL7Sxi_ZDCc3JZuWqfc9B0NMwMQpSy5fGr4bB7BbxIBdMiavr-EALp3KBT3iUqOBklepvm8nU5KTbx38oIje3t4W/s400/food_spaghetti_vongole_bianco.png","c":"食べ物"},{"t":"鏡餅のイラスト&#65288;三段&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzCNPJADl8pGVSkYApaspzFeiH1a1cpxblqw9nAFezUQBEk50sE4qITECw8R00doZClHv-Jr7AzmjobVeXRJEqtSpE2w0Rwin6RtqguJIG50vng39sP3rcncO-H0Zvtzi_RdBN3zFgz4PW/s400/thumbnail_osyougatsu_kagamimochi_3dan.jpg.","c":"食べ物"},{"t":"鏡餅のイラスト&#65288;二段&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpzN23AkaxXirg_d0w59ZKG9J-MMmS50-LoTEwdNQlpkxjz-jKAaw_Grg0zkliw60xWzS2e81dsjmw4UVb0OXmcIjPvtV5yG7Adr58TdZPCYYQF87WQ1f05dRg4l_exqzOSJCfGCmhDy56/s400/thumbnail_osyougatsu_kagamimochi_2dan.jpg.","c":"食べ物"},{"t":"タイ料理レストランのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi9F_CoTbLdo0fgGk6e-fGctmUygRonGmZOBNm7uwhR8lW8PBx_PYdoPoZBJVIqRVwsusqz0I8lCGouk87pOFP99QHenOmQmZLMP_cfdla_rcK742VdmGmM2-nQDfZmrpIw4w30TA6_I84K/s400/building_restaurant_thai.png","c":"食べ物"},{"t":"ソムタムサラダのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg3t4_Iz_xk3nkXqVB2zo19ciVylVNHYVGbk2wcwB0Kgm6wWSQp3BjRQc3FlNv_JDhBNKizlDJgZ-0dA9jPRI-SG7OuUR08FoVmF-4uJGNIrrFnKyQyOFhs9bqvLBxNLA9ZXqIAg9aN-324/s400/food_thai_somtom_salad.png","c":"食べ物"},{"t":"病気のニワトリのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcjL_YeC7sQmBJLMsxje6N_itpSGTHSbu0jszUVkIe3qR2gzzof4w08-ljFHPb04MlXQPeYmsUF_fkgO5990ixg6xZbc0tUGaDZ6zYL5fcTXczeoyWj4-RzZVUW-yI_86qMKHVO6yNnOb1KKeQ6f-FPg3EJaaILkKXnm7dl72zugS1GBRcY4djKgwgVRQg/s400/animalhealth_niwatori_byouki.png","c":"動物"},{"t":"元気なニワトリのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFrNDBJGy7ZWqd5Na-4gOXyVbx1PCD9rzod0r3OhuCJZDwbtPnzADEFdq49lW7VHApuCJAK4e-wH0BfV5f6jJjXIzrkST3Z4C3YD_mtnUK6O0pOLOToIG63ymGoqM9Kz3qDIh5__n3xynKGWBCxSWMWjgVUGp1Qaw32a_86Kt7LFehKjg5Knz2l9ZTXtfl/s400/animalhealth_niwatori_genki.png","c":"動物"},{"t":"コブがたれたラクダのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEinfJ5fgf9kZai-csal_mVnQt72i2Si9Cx0o89oKM3kIETYBHkP133Oet35BsASHUaFHl5ZZPUu2XXhlw-Kzqo30C5l2K2CfRrAFIy9Y6-y9x6jFnrQVix27jd0dgsYXZQqpHCJ6s-eXZFc/s400/animal_rakuda_kobu_tareru.png","c":"動物"},{"t":"黒い羊のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEieks99OzkiAothfzTz7FbtakQMfXVPQDL6eUDMJfv_2ghB5xB0gUYsA5n-2YUHe5Adevn9YrfUjswiDQneXg1Q0uzEjIu3R9G-DJ7xvxi6nbj-XiNWool1RV3lRjy3-zKFGPySzfgQxHGw/s400/animal_black_sheep_hitsuji.png","c":"動物"},{"t":"いろいろなモルモットのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgCDvzLNg4rXKcRD-sbBuj2OvTaIAbYwJHNvWhKkihtR3RvsfyjU01a0YWP73gS0Kx_W4YsXneMyWcF2GlJFk5BkxR7fQ5Mjc2wLT5B9fCnBRIiHuJKA-TAeVaIRfCHj3olv0sGVVrX_Wo0/s400/thumbnail_animal_marmot.jpg.","c":"動物"},{"t":"オコジョのイラスト&#65288;夏毛&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh05bFfvysjY5SwF1P_VKuIWSpZz6K3mlqFnA2uQUyGXUV51_FuiQG_uXkguwOnasKPgWV9S41KbSdxWrlbNofq1Yd5wC4_m3wY9obQeklvu-gHpov5xpCwX9MErbfrE4xvmmBob6r5oHvs/s400/animal_okojo_summer.png","c":"動物"},{"t":"回し車で走るチンチラのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbwCsoWwkRsHbsh4QlZQHOulw_SQSsFwRnW9m5xOeZc383TOJnjqoXhkO0ETFtyKN_tgR7XJjyVbsfnCiicLgRDNarDK23j0jbjOG5tL__2d7NJIyJrnOq9tuw9NdWMWBTF6D5ptdoocQ5/s400/animal_mawashi_guruma_chinchira.png","c":"動物"},{"t":"ハイラックスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhy6xlfKWWn6NHtMPNU9DC10EYC9XKc7_OK0msapTZHIrmvqZLoq-z1PeXfNyXC1LHtcblqKCSmKYGRLrNHCyQAN4yWpkSJ3paF6LD_a880_fIHL7COo1mWHwmyqOZBikCnG14pBtU7Bt0m/s400/animal_kiboshi_iwa_hyrax.png","c":"動物"},{"t":"いろいろな色のハムスターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRXuFk57SKgXNpDkjM0Iv2EY_2X5LuR_qSwNCtvlgOHHpQt_ju8DwzLcchL6yiEsBT9JVlo9Nk4D8xojZBSlCF0Dee5Z6YBRzcsUYYMnR8eDanNafUGESp_YKpEw1_XaWHvCAltsCSTZ7H/s400/thumbnail_animal_hamster.jpg.","c":"動物"},{"t":"寝ているハムスターのイラスト&#65288;クリーム&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj43Qf67CecA7zIR3NJUaooyxmvqD3e1O4x7qxMCMJgudBM7tE7TxP7cy-lT6m8roSpsdfQa3NZNikCVnPk-s2rpQkaZxQJ2pyjha1R-SohqlG5pH7CKev51j3Z9I19Pmakyhmgn4Gcj_W5/s400/hamster_sleeping_golden.png","c":"動物"},{"t":"立っている馬のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjO4MITeCu1xs7ze7ct_-kVgJAYsIBz3B5Km1q_NX2wWopxi6LSvVP-L30ErrwrH69pNRz-_vRT8VCWywuJiu3jbUcwzbSPzA8f5vBdbfCXgqSEkoUus80vx-ERElDIFlIJ6M7F4k2vfy93/s400/animal_uma_horse_stand.png","c":"動物"},{"t":"いろいろな図鑑のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgQabATnchZOR1lmZwFUqNJOxVQkdY5h0OPU7IprrmWzdWz3WKtAh2VEyWY80qzK0yYPoLLR5pjGL5boMKh8Q_LDPW87sNPfIrTEDBXyRlETehy6cEHQ82qTu5Vr4942PWx18cvyTbY9YnK/s400/thumbnail_book_zukan.jpg.","c":"動物"},{"t":"ポニーに乗る子供のイラスト&#65288;女の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivRnPsM31V6xdWKbyMcDi-8yc_Jcor4QgS4G0D8OcqdMUauRbtWclVQrugzrOTSAALjB8XnNxaHgTdzxCeheA-FEy29KWccJIiw5E4dYcWY6y2tWztxl6vV2YrF6T1oKCzMZavQLXhniqK/s400/jouba_pony_girl.png","c":"動物"},{"t":"ポニーに乗る子供のイラスト&#65288;男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjD-h2ONvtZaCk4pR-mOb9zjoCeIKueO4Lo70gwY0J2SoI66PKVtAcFwW4uOGFscQ1Gy2IDusvl8g6QDu9jXy0q80KoV_oYSCSGAuD37SRVRp7b-lPWlyoV096wbo42170x8iU6P_zMkMKo/s400/jouba_pony_boy.png","c":"動物"},{"t":"脂肪尾のある羊のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbzkEp7snyRx3yGumyk4peLjUN4O3pLUIObK9_grYyek20QxlMRxvE9KSKTsb-QvleIErj3uMAma6V9R8MoQuQgn_6Mnhy8TXIJUx_ea9aSiPZXFYMUBkrWOcTkXDwf3IQ7tuE_OImxOpb/s400/animal_hitsuji_shiboubi.png","c":"動物"},{"t":"角のない羊のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqNMTmZZCbXFNpykYk7nUfAGU5MGayGLxx4nwVgdIv8irjSY689yvGtVMOiLLh1yDXuMRlkGbRDfb4R5KcL82utHIOitVH23L8LCu1QjMAPhuxKVqKvcnlvLzpn6JoFtf4K6n2TxivVyCW/s400/animal_hitsuji_nohorn.png","c":"動物"},{"t":"角のある羊のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghnNp-lwXqbYoxjX9-UQMVfRKthM47HGu2afYVMRJTTnRYvX3Y8WySblGiNElsLdQkV3iGOJlKRwLW1phc7WPaSVgNWKXIMyoVyS8PY0_qYrBiBxDWo4A-Caw92Z2aCJBf07oT2OCeWhD-/s400/animal_hitsuji_horn.png","c":"動物"},{"t":"泳ぐイノシシのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjvYFZOOvdQ5BaemodxY6e7VY8FFuhqETlRKqlpXe-TVA44qsDsjb_xN-RUX3ksfpMjVN-hbk_So8jsQpXavkjl66Q-fx0EQup56BlTmd3eA2BkRodmIAuYorcA-7JBRC_2Zqb80K7gnbAw/s400/animal_inoshishi_swim.png","c":"動物"},{"t":"トナカイのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiagPDLGbuy0TBLWUspfr_E28ropH_MkdybgCkLpaC6DGxRrm4JlC9KTcofkpPNmnXCwoSr6rvh9vaDyGfnqSA7CZUpSrOwWPCutbZdRGLIf6KTJdvkBM-LgcMluOObwrrNRTL1qIP9ewHU/s400/animal_moose.png","c":"動物"},{"t":"ワラビーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiIjnxmSwOlh3yWzTYPRSkRtNkGLxaOuQrtoQJA-sqD6-sseFssOB7FxEUdGm7bR0MITCe7qOpBnalN-irvW9uLBKj4NpnDClnp30I9yA7auOY6HTgoWDAB_Msy0mc0lY1fwU-A1ODd7Sjx/s400/animal_wallaby_kangaroo.png","c":"動物"},{"t":"オオミミギツネのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjSDqW1pujD_Am254B9S_C9tMeKiWUTrOn_Xs9mFohdPhyphenhyphenJpAmljxTCn5T8d7c32QxW-z9lXcnbbgnR_CnKXiGQfDB1ug2SW28oxVl0Y1SbWrk93ViQl1xfVYILVxGQKxnvzl3W7xqPtP1M/s400/animal_oomimigitsune.png","c":"動物"},{"t":"ホシバナモグラのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgGj5yuD52bULaIXMEpsYL-k1TcDLwtzS7rIoVpfOGr_W3c34AUJL8A-j9FE4yVCvpQWI5mvd4jU4oQ0UzQAZk0FUU8hPtIxCPPiZWx3E_Lj7-rxlMLno4G3SP_WCsvK_COX-0BpedoImEz/s400/animal_hoshibana_mogura.png","c":"動物"},{"t":"マンドリルの後ろ姿のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjE26-WrSq3fQyE8nFd8Hyay7fvlV3rieE6kli4qAbnPhwdINmimBT34uWC6W-314CXgjcEkfwJXsNXi-yn-RDS9lMSAv2tuCtRIr4l2nwh2apZ1Xb2DRwZPWaOvOazy_vYVZ6N0TIZPijF/s400/animal_mandrill_oshiri.png","c":"動物"},{"t":"アルパカのイラスト&#65288;ワカイヤ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKOHoLru5H0fchEUhNLRAdtrfYPEVZcBzaDtobRXibei7Q0OgLJVlP087HCpudg4yFx2acDKLPYWVEYkTCkDnxfnH7xEfTf1QalN70QpT_8eQs4S2JVxFSf_T7aPOuAuOCNgRDDyCW-JI_/s400/animal_alpaca_huacaya.png","c":"動物"},{"t":"アルパカのイラスト&#65288;スリ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiIQKFHKkyoAbHnXHSD8l95PMWscR3mMsHlutZF9UqDAuxC7iFPGRPLVCXJkXWvLJgzno2NcL1N_Kke7UPPWcYMrTPP8YgeCYhkIVDqGxWNMwoWHu6lJ5y0P0V6djMdMHdD4UyVsSv8p655/s400/animal_alpaca_suri+.png","c":"動物"},{"t":"白象のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj5guhj5qlbpfzb0RiFbbZoOhv0QRXEe4mEEZ1PoZfn9TfUCeldQyjKk36lecZqsoqmcHDMUI99XPJYQmUBAQ9NpDS_sH2TTlguhjlWMKLYOicNxKJ2UiD_yKaW2Ehzcw6Yn_uHF1y3wD9v/s400/animal_zou_white_hakuzou.png","c":"動物"},{"t":"カピバラの足跡のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgm8iJVnvlndDXJ5pjtJAT3vkiFbvGRDSOSqayfrmyc2chVx4O994MHW1Zr6EcJetzfv4g8hdT9Q_2l7WW73xTV4UTPAtFCAqqm5zCEoF9PAGlgHifA6sBDmIzIf6lEOxx_Zply5hdOWi6B/s400/thumbnail_mark_footprint_capybara.jpg","c":"動物"},{"t":"インドオオリスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn7sqXrOx6D4cTRNuwQRtjN5b0AB3_ayBnily-bnTTMcofQfbPhsK6512rajUpMmneqjiVhXijnczEs2nrU5M38VRq-lTzprszQQctYylcV1pJ-mHUAlIbgPd1mtV3fCmuCZxNtntW6awI/s400/animal_indo_oorisu.png","c":"動物"},{"t":"寝る羊のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhBxVfhRA_uzWF6DBVxV435QZamX9QLKRnAXhUqe-4eEH2_SQOmnuDs0oBorZbuQRuORIL-YddQMfuBduOnFyqwLDM257vKgqvaiAvsfCejYvrNOhBEAqJMXKi9yHNFa5AW0YKdRv1Aeg6u/s400/animal_hitsuji_sleep.png","c":"動物"},{"t":"羊飼いのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiCmX8CWzMCmlpRbU8602-p1bNQxZEw3_2-b7GNND0pazpjD1TxG-WfQxUgZQw3trxilbEq-sfygAka8MAnVqpTXwnFoPpuNSyqLhEpgKexTawxtwrEh0CiOgVZsPr1tHKAl_gjz0DPLI9J/s400/job_hitsujikai.png","c":"動物"},{"t":"垂直離着陸ロケット&#65288;アーム&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7mah_xWMRQG-5FrE02cJ29txIxeqBkGc0as_SKBmG4pOQNpfJPzqUZ9arnncvhogzCte1BR_QYCBIEcfCLebHSJSZu_ACvT8gUMHCR_s18iOaaYmQGM02XU-n_0WV2tsVdPc92OSx3_RGInkXGeY0W4jix5OfBIDMf7XMVZdZhc1cpggifpURbzZYNK0-/s400/rocket_vtvl_catch.png","c":"乗り物"},{"t":"垂直離着陸ロケット","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg5DcHD-JAYMmmDzgIpj-yLJ7mp2D6tXxVRPwYEpLIkuU5CcyTroCN55NFYJLSsriI8rE5BLZi31UDk8bYWhQbtDJRb-vi4F0RLPIhyphenhypheniUKk5zCQWV2Lfr6DDow6H3qcnw7Ze_OodMCE2RotPVMtjEV_9Y7ICv5up4PdtAxyxdsZaAmVwJg44I9MRbpH2x0t/s400/rocket_vtvl_landing.png","c":"乗り物"},{"t":"スケボーに乗る女の子のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLBv87UJwr1TsUdtDSzDlliV6Bkei2CGf4CJkYL3Pa7-edlt7LXCHN14BpBhAgdLmQYz9oUdmqSNqPHcW8t-ZSlngblX9xyI3v5gSvBBB9u_UTYs3c2Dp6MivtMCaUGSEpgq03IeS88slp/s400/skateboard_short_girl.png","c":"乗り物"},{"t":"電動キックボードのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbk5o3wLeq9nrbqTbZbXqrsCz6fbEFM3RlFHKDvpi9oYjdu6JnQn7Wa0T42H4L7puiracbagb27KEH0pgUxMdlQ2i0gzNd43yBI6SS47KAH0V_0kGbObji1HA1vgUS6R3ZXroLe65_0cKD/s400/thumbnail_kickboard_dendou_woman.jpg.","c":"乗り物"},{"t":"電動キックボードのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhXntUhyphenhyphenweLNA3bOvMPf1cJbNuNP1OP0MFkngyYpqaDooAwhYaVsgkJAFeROqCHmrqCFCUHx_YVoFQRnUDgWjW6luG2OQJ88bnopsnVgiQfzD0vvI56vmICuRmD53KEMjOB7z-65bRc0hw0/s400/thumbnail_kickboard_dendou_man.jpg.","c":"乗り物"},{"t":"ワゴンタクシーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgJH03MzOT-BR8IH3Zp3qBYPI_AL6nww0Tx7gSxI1S09PeBLvO3fNeMiCpc6cOL1vqB-brtZ0jzZjf1z1m_ScF6xHMSjkyjAYuT8twh2Wm6FoqIOLw0VDq6fDNJWTJi8rGyWt4tkgAH9TdM/s400/car_taxi_wagon.png","c":"乗り物"},{"t":"空飛ぶ車のイラスト&#65288;マルチコプター&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdu9ivGwPmGF9DH-DS82LRexb2jajyCP7Igkn6Wp11dWDarzwehLmwNR_GlUhMGQZucLOhsMBTV-FRxpsPIVII1K62XBfiwOl8JCuFzjZfu4N_OAgsXK-RK_iu7dH0wwGzZsJ2ljXoP3A-/s400/drone_car.png","c":"乗り物"},{"t":"高所作業車のイラスト&#65288;テーブルリフター&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcHGHhKcbmYuvdDkIgmr4VoqzBjbgrr1NqOnAsmyPiRIiSdoxvTvnaHqv9dzPwTam8zCAxxW4TL2a1kqWhj57N1rT2HGNxeh5MMmG3IA_Lhn_mLXejbwxdNnc7mUPGmQKIny3FtGtoxO3u/s400/car_kousyo_sagyousya_tabel_table_lift.png","c":"乗り物"},{"t":"免許証の裏面のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEglIWCaMnyrRjGKLiYQV_R6TOTeQaOMBO01ZrRz5YbrJYla_LHbH1pitEkv5LByoMz-NNHfsSbiXQF64bmJKZytU9c3Eie6dLCRLgdVCDqWhz4pyvXkMOPjmrhaYbDOXdJQ9VCA7qwIZ6zu/s400/menkyo_back.png","c":"乗り物"},{"t":"足けり乗用玩具に乗る子供のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjFVqcPqcqEm28RAH1DXpouXM1yrHRYpoVEZ76yW31YBhY5IUWBRTC4na1fglRw0b1Z2sW2_fCujrZI-WNnz4q3eVabPChwKjOvKw15RvozQFcWZqeing9Okp1rRYVt5r_gfS7e2t3TxtCF/s400/toy_norimono_car_boy.png","c":"乗り物"},{"t":"ブルドーザーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjRboCZxIDNvaTnwrKcTbo29MSYOwteU_AGemW_IsvATrx_Vu328dVyYNqdNHQqwdFRFLlsPFTwQq49eiFrG69ghHV9NTU4XWpl05GZDVX3eha7RKsHinK3oAcdl4_FflyVCz7avMJQIZ-4/s400/kouji_bulldozer_dozer_shovel.png","c":"乗り物"},{"t":"船の衝突事故のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhZtCP9RkE27a5nGL2tMulSrF7bUkuO65s3jMxMilWgntAt_S4tdnknyHJoUAQcNmoZAABM3huBkVMXjAKVJV4wgfAQ50VpKN3Ye4pT6F0bRokV_QLIIX2I0wApxWBJNVCqzMMVfmG42aOG/s400/jiko_fune_syoutotsu.png","c":"乗り物"},{"t":"アイルランドの二階建てバスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjwZTo_BXEjqDFO2Nmu48sODb1uOjgcKsJuxGdTbW7yqVFW3gr8K8VP3iDaIKFjgOjSs228Soyky43UGkqeD3_f4OQ8LOaCh6s3c_f4i_MmanijAGbQzlj3VWZLst00AubHvhMAjz5InsnZ/s400/car_nikaidate_bus_ireland.png","c":"乗り物"},{"t":"カウルのついたバイクに乗る人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhmxTbfkTuyBpLjbPB9nVsMKQS5cq8A-i7sjFElOsb7tF8TrbcxSyKaXYAhiZrpmEJt9kGMv4ci1W-62c3fSNGs65xbZ6z6DUV2TBk175pWUmeDbofX1GmYlUILIDReQeSoEmi-VBNLdrX7/s400/bike_cowling_man.png","c":"乗り物"},{"t":"カウルのついたバイクのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhowTlyR28P8AVyMck9TtrIIlKfJ9hN2UN3RUvWfYVh6WtTwx4ZcmpZihOAzQiOEpyA_VXPk0QZh3yAub8XwYw87DCsRRxQ7tAg1cgxgyhGFH4PznxBkX_uVeinv3jSswAtfaz5QKEPjXNU/s400/bike_cowling.png","c":"乗り物"},{"t":"ラウンドアバウトのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEikEK4X7D-BC09JGEIVwbXUSPnQAZNblk4MQN7q-ahz6PHWbLHHNtsEbG0s_OnCF_cR1kxBHW1MOuUqPIs8aAOXxcbiRlZPa7ZPXWOro17XRs2FwNgVXDD0btu7gq2hy8dYHqUCPF-mP5qT/s400/car_douro_roundabout.png","c":"乗り物"},{"t":"フェイスシールドを付けた人力車のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzC22RNSI5W_ONp5NsFp0EI5bnVzW1-siggaZWLB5trhqSuHfekAX-IAlOdJZI3IImpsufDEDEcxqCVxgv7cacWKZUzWso3J7yhs-YnAbrF6s46sGRgou0D5Yy83YqRRfVU9OpfeMMUtAP/s400/jinrikisya_man_face_shield.png","c":"乗り物"},{"t":"気球に乗った人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhF4uo8SAa5ve2N3ikVK_rwuGs0tr1LOt4VWf4LD5gAAstH0QB8hjvd-8hGmYwbMDOH0lD8ZF-EMcQD_aFRJIuWRlCHq971T1ak2i6Gh6VnxOkgppgtyqGixXz07cv5-6ZA3j9xr_DtAtOQ/s400/kikyuu_man.png","c":"乗り物"},{"t":"マスクを付けた運転手のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjSALOry70n3rBcxzBDHGwnggQ2ehy3u-4JTlcl0aCRQbGA7VRUlDXm-KnUWTb9B65o-3-2SDivoqT-Vra6NrNcF4SOnGzuBNrzcgOIHBoj9hgOhNy-7rK-Wzjga1sP7OQzWa01BJl0vjQI/s400/job_bus_driver_woman_mask.png","c":"乗り物"},{"t":"マスクを付けた運転手のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjI-P1uaUfkq5EL0S0zWsgPKtGQtKv0i-b23hH_E7HyVE0SJGsHQ9DZdph07dpg472FJyd8Pb_5oFhTvp4d2HHxMiB_8XPq8M4h3JPThy-neSfR_rCob_C6L-Kih9VnJ3tPPdE8JNrv0lN_/s400/job_bus_driver_man_mask.png","c":"乗り物"},{"t":"気球に乗った家族のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhfp7KBM2phcx13PQcrfNaQl1EXb9ZjLIePK1A7JFVqCCvSENmnQxxnV7ZOzAPF_Zlw7PksOwyF4azkloY-bbdXjz3eiXdFBVhzv9_9IDLIo2-SZi5szauprLNQPJK6hjyN9Lgv8NqUqb80/s400/kikyuu_family.png","c":"乗り物"},{"t":"二人乗りカヌーのイラスト&#65288;カナディアンカヌー&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiKr3APE9zxQ8bMYZiI-Gfj3DmB7o7BNDLOTuOb19K0JvoOqHjJLqePWWWkKFiPrt7aQPk-5wiQnll_9_wAkRcKHijUm5sL10MhUvCp6X8jjYX7IX-pFB2lSaMLlJQ5ML5iBEawmi4lC4zC/s400/canoe_couple_canadian.png","c":"乗り物"},{"t":"フォークリフトのイラスト&#65288;箱なし&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgBPcMGA7ko0xha4BkVvihP1tDI-eurqlUT5HehvOWPawCRa6ad3DP0EmCRY46dN7vB6OLyPj4d34RZasBJJm2XJ5w0537AvQx2r_JhY83_Qc1lqJ1qDwuaQOtRiS-ek_KrRqywmT02_gMl/s400/car_fork_lift_nobox.png","c":"乗り物"},{"t":"ドリフトスケートのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpcR_NHdeVw7JoPy96cJnHweSvo9rPuFyf5TXI7ULJ6Lf__X5hLuosSWQG5oZxs47cf7G3bvezs4PHy2hxLJ7wzNuFZArszgBr0LYmO3HnDfCi0rwjckVY0z-mepsnjZJMm8WrdOM5OrZF/s400/skateboard_drift_skati.png","c":"乗り物"},{"t":"唐船のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiSNqCq2__VIsgYggbzzmyK-puU5e7_KeyMPNH06TfXCHQGErUaEybBWmVNHGX2xhfW6XMzCTtYsVz-tmgfyP2U7DfuywcWc6wAwfbZmxwCJGlDKCpr1wFatti-7B_i3vtVoyQre8XkfFqx/s400/ship_tousen_karabune.png","c":"乗り物"},{"t":"巡視船のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjNOXeGAf-IU2CS7bUUlwdW1R4SKGgmQy4sEuO_kLReFeEw7SyYS4UKZobCjhq0igUutU8GmlLtAWB4lssSBfiOZZiRq8-cxzM9Z9T83LiaC0ZaExUbHAjg8tuTomjLiwbf7f7DGSqzZzov/s400/ship_junshisen.png","c":"乗り物"},{"t":"石油タンカーのイラスト&#65288;正面&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj-ZUA7j4RRzF2BCN_JWWV-JziSlDbdRgfNikPDr58k103OEcUrIXM1ioSP0Mj9Sh5_ioSUbjILAQlIY2613ngcUhdMasp1LpRhmpMGbcX8ZAMehIKjuDXfo2qEpt4iTzcjaocFJ7B_2jxL/s400/tanker_genyu_front.png","c":"乗り物"},{"t":"ハウスボートのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhEeutfSZwl-j0nQK3SHYIwO0jShTFg3Wv6x-Wt932upEffm5OGgOd7WchvMtP477BWg6M_FbmnHb1q9dNpDFzAg2rNhdmO_enjMtELVuPrKbcQ9d_wH46OK2bqxym3XCImx_O2QNAZAfSz/s400/fune_houseboat.png","c":"乗り物"},{"t":"航空機を牽引するトーイングカーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiv2_ozzxcdCxI48wrS4YpZ8MxzA7tXSbV0NK6yItqrJP2cSOXxSInh4geBym_qR2T5PVRZ68NyWG3ME083xGYxFc0uMgYizEFQ8Fb7xcdKh2y0ASp_FoA_Vln7FE0dtKCrpVa-ZRCTJKJG/s400/car_towing_car_airplane.png","c":"乗り物"},{"t":"トーイングカーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj9Kybfff31h-V2-nf4zqVD9qWQP9034QgR9oXfNSPMsIEvSHyPT7FqBpFXxjigXbNYHb9OaQXf8P_C7T-5zFyW_RcvA9VyJJwVNZk5kcEd3j0qJ68fkXIKnTTByed025mt4dswRY05H5MQ/s400/car_towing_car.png","c":"乗り物"},{"t":"バイクが好きな人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhrtPf45dWenZbgFNbk_8q04TNxGh6W_frXEvPWV5ITem3zXYMtXlMz6a4CulI_UV6j3EnqrMG6OTffBxlAq3db4LyWNzGrck8Wa7APXAsd1k4C2pwFDZFJpv3UW-n385tF0ptvGI5T7CjR/s400/bike_lover_woman.png","c":"乗り物"},{"t":"バイクが好きな人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh7xpsrEInLkFgxMZdt7dc_RtrdlWRXNEre6DB-o62_hwk1FKVCII-9vpZWG_4lTnfzNllQJQZ777dqjt9D5j9cXBhVgTK8rOZvWBrh1rbpQuokpzWXBzZr85cfP51m5582IRO1_ikqcnIo/s400/bike_lover_man.png","c":"乗り物"},{"t":"観光トロッコのイラスト&#65288;紅葉&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgizQrPDeyxoY-U77Wb_dEENjq9DOzP8u4U7k279EqFjly8gTQwSgUTJErWo0WZ4mDTbn6CgJVqwBTTJonlovN3TZkFP_2kTEv0e5Gx2aLJPGvqgbtDUtG0zLZxa-3Tr5jF58TbCE-FXQqY/s400/train_arashiyama_torokko_kouyou.png","c":"乗り物"},{"t":"観光トロッコのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2gYRf0OSWNz_VP9puNe-yw8oMcVa_3UqFpRlSas5gqLeyvi5GDCfpYN2RfDH1tOv_oeZwCrpi6WS3EGUznAIOysMIsvXEmmnNcVnuD8UgBkNqCFYY9jVtpk3j4pLe6cuGCT42tDLxmMpn/s400/train_arashiyama_torokko.png","c":"乗り物"},{"t":"動物の乗り物のイラスト&#65288;女の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhuJLen-vTBZhbJQQB98iwOODXiAtzumyZAqkd-SWWEx-SUdisWI9NPLQiivqphRJmxY5GQEOJpgu9YVrZbxMmObW-itqdOQ8HegYzE0JFh7pkP6Xu8Lyq07K4GrOMoi1mHijfqxVzDa-kX/s400/norimono_panda_girl.png","c":"乗り物"},{"t":"動物の乗り物のイラスト&#65288;男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiiT0IKdozzY_YyO34T3D8GKf5t3x7v_JqNvFmtdFsYzGG_jlcMZ7EMnQkgDwKWBVNLaub6TkKp_mkXiOx-fSRhidewRjsdBhUKG8Ll_o4xtlPU1qqOMqeaAWQjTzsoiuahBDUqThHPlYAM/s400/norimono_panda_boy.png","c":"乗り物"},{"t":"遊園地のパレードのイラスト&#65288;バラバラ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhB37IpyAECf30w8QNWMaKaoTZmQRctkw6bo_OWDNUGBb4_LRVxznNjAYSlH8n1q545tgqJ9mUPhckDm4WfxtPDGf2Txl9XiA0t_0WqHk4c5Koez3WcvAawOZLNHGXksXhi4Cuyp4hlLEGm/s400/thumbnail_yuuenchi_parade_float.jpg","c":"乗り物"},{"t":"遊園地のパレードのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhu9axKKmVZxUF1Doo9PZ6ZxZztRnZwBSAWzAY1Zcf6R6ceCD4ZZvN3AbJl1LdTIbddbcKnqOYeovgczBjwwsl13VUXvTZG8hNBJaJYxnk7J9pOzo8I0TEJnrnNlcp-q-QEWpdqs4fULRFS/s400/yuuenchi_parade_float.png","c":"乗り物"},{"t":"リーチリフトのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiNnqwYys4KSUevp3QkMy8f5RAdn4DB9Y6GdCBvHs37F3rtprDIo9qA15XCW84Usx4QfJvyjM7VB4YHconeVx6arPd_XKOKQvBqZ0TgD7gzZnS893lxNgz9b-fs5b3_xpk6VIfAQT4-uYcX/s400/car_reach_fork_lift.png","c":"乗り物"},{"t":"台車用キャスターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiZeu_yZcwAtPz-ZNkMAcRJsokAhEM90Ed5iClWeuNakyRzA_clF3HCskLR9TvvLQuRcyYJIhw0sucDxYbMMCOoXy8agBv-srvBQWQmXminXeVfEfOTr7keTY-J7puuWgj4C0vWoqrgkXZl/s400/car_daisya_caster.png","c":"乗り物"},{"t":"海事代理士バッジのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_3kOpptjDynnfgPhmwh5IS6QvOatOMnHlz5_IeyQi1fNDS7I1k3fn1pZWBxYUA6_30YxllI6s_mPCsfXyywXzHgG_CjhXrV80MDjMvn45qI06jDhqLhMSRKP_kBMq3lLflzCzB3g6eh9WoJtU8kqaRF8YhVZSe_ZGt5lal2hgJiTPvg3_p0TMUC9awhHS/s400/badge_kaijidairishi.png","c":"職業"},{"t":"記者会見をする総理大臣のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhHCs3qz9UWwsSV18zh_c07IvuohSiZ5pNV-YiRpS-L6-xxCWPb4odVJ6Qp9YXCm3wZwZeDH2o7cwLAgB1X20RgErFo4IEINrpkopiUCRF0hcDWigAg1BTaQ0FCSWmMYxXBFcmje6ho3v4p4YcnuWOuqmG8l6ZOpmKxRdmOhqr4dg_sec9E0s5lv9x_qDQX/s400/seiji_souridaijin_woman_kaiken.png","c":"職業"},{"t":"国会議事堂と総理大臣のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEia45tyIC6h3TEo7y0CU8Z_2-oGHOSnc0sVl5nAQyPzb6j5WSW-pfyjTUVs0h8auuEnDKMG09JDMxddVsDUCX-ipGXK0useKxkslzCYxtlibJBL4Sm-gsMSnBdHwnymD-55e5Q03LFztttgqapsTSwrKs7iznThzs-3qhESpo0jNQiBcB9VV49FXg3ZZ_S_/s400/seiji_souridaijin_woman.png","c":"職業"},{"t":"総理大臣のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEieYFl5gOfAju-tBRjHjzugzTz-bNaI-5x3drwffBtaBNha2X4Za_H7quoMUobELCwNo-RaRe6bwicznI7g8zXLNECsLzrxnVgy9gKq71UDW5JrMbEZ6-tE5c7cbOffSRSZfssK8mNQpJ6RqK8rahnN67piELw6iRHk7PleQ1ylKDuiIyyKA5uoC0Bs27Es/s400/seiji_souridaijin_woman_nobg.png","c":"職業"},{"t":"畜産獣医師のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhK_JxLwYTHBfzUG0WwwNavvYyM4i9mbQq22-ZAvQOTLAAOCxIdL_xaEGqFQN1p3hbpada3kiCDMQ9mFWBKvMqIf6fnoG6Ix8mnCLhWOBZuOJqfmgeB2ptWHVRebH4S7CtEtSvObJcv2SqSMQ5F6QNTyiu3kusPtiKYTjYsaPv82KNT4_fA-uT9klYs0tLk/s400/animalhealth_doctor_sangyou_juui_man.png","c":"職業"},{"t":"畜産獣医師のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj4kBmOmggTFbQgG-X2DzgVQvMTzg47JIeDywZ0l9deuTgLcrOaaXJ28JFK4TteE63c9fpiXic2yT-D7NtsqQf03J-aU9JZ1Bht7LDToystHFyGDg5d3vN2UVOEUoSvEl9eSMdoHxl8nCYQ5oal3xKT1ePxNESAx_Thn9vlGUiQaEt4D3ITh9eeMLiCH4BS/s400/animalhealth_doctor_sangyou_juui_woman.png","c":"職業"},{"t":"ペンギンのアナウンサーのイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEgM85LEvtgJrUmGx95tmMptVQWhITwGOun2FEdThRoHM1iA2IV7J9KA94UtTJco4GVIvitht8kY-nc9U6SBQ6oLlsGCLSlr2S0dv9m04sUFE_suAa77Z8V-HxOFVxSsPMEqRgGGlC0ilOpb-a_tAjkvTr_ux8GfLjdCFWkj8HVQ-kGVukNz9WfrQ9_s1g=s72-c","c":"職業"},{"t":"アザラシのアナウンサーのイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEikkFVajXd2-OVv5uJ4eypeqALxjVJlTmiHfI-VKeDS-BA3CzuupG89RFvGLFSfX8ujudJA4rj5yMIkMK247QMh5tCGsyHalbM08FSjwUNajIneRz0qWy4C-EBomGHNuFcCufQBvjDs4mLM58FU26oqxq0ITTVqcASoSd-SSSeFZYozeuJGiFtocsoWBQ=s72-c","c":"職業"},{"t":"いろいろな動物のアナウンサーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjkLboE1_n4k6y62jkmQvlKIBCLjkXRqWt5GRGJrDdEj3yWZc-T5xpfZgUM9pXSTMcOinW0hMKePqXbESlNXHDxcf-gLlg_moNZL24d1Aa6-XFOT4OR7NH7-E2AkKIVU40eqGVe0nQ2NucUFXiu9ADGFHeM-6h28jnIs5AO49-GeLWT7tKmHQRGsGB25A/s400/thumbnail_animal_chara_radio.jpg","c":"職業"},{"t":"熱波師のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKZJ0ozPe5dqcm27XMRGdmsDXbSU1RjQmzpM9Ij8VuSsK81hohgvzO24voij82YSXkyLfyiMarezb9F5gPVUqmALXH4uLjNeV-ZXxUkJ8y2f1ICddVSad2FrkUaMp2wD9dD_U1vUTLk2vG/s400/ofuro_sauna_neppashi_woman.png","c":"職業"},{"t":"熱波師のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiUfJCEsWz5dE25Z-UpWtTKW1laiuCVXj4oDCfoHjBbPhZxDoRUiNtraCBkI0LkGFkZ2evwTTZteD5JAdyi55YRZKe88kCMGyfeYYCldSSWFqYBRZHX7ptIp1TdE2k76oFyiX4Jzb6u-yH9/s400/ofuro_sauna_neppashi_man.png","c":"職業"},{"t":"記者会見をする総理大臣のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjyJ1SWyDE21UrP3QSkDz1pQjfkgMZi560GcQLts2Hp81bqkKvFeXor-SU4D61ZEBBTY3GiVvwKr3jocP6XRDLUQ11Hntcrbcjf-X9630oQQEWQifFwobiJOMxTr_tlJMDTsaKw7poyF1lh/s400/seiji_souridaijin_kaiken3.png","c":"職業"},{"t":"国会議事堂と総理大臣のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi4rLoiPIbTJtsdbrzhh54Kh-jpjHe9SvfHuod-xLZGLe7k-pFiuG1dS97zBGnZnaI8nkBWxJIC8LBw9iitVZ7NHqhypi9bOqkPkX2ZjwB994iywzU-vCzZR5nPO9WaaDq_SFahIRxow02O/s400/seiji_souridaijin_bg3.png","c":"職業"},{"t":"総理大臣のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgOqHLZ48mnh3bjYcyQbCja35mK2ILl0JqB0LM3OlBbtFb7EENAmw_KPo0dBPsJvvMRFlHhwOMwA64xi76t5AaG_GemvEqLAONvmz6s9KbUDZKFfHTC0iMnVuRzGbbMJyWhfLyMDJw0iuWn/s400/seiji_souridaijin_nobg3.png","c":"職業"},{"t":"米袋を持つ人のイラスト&#65288;店員&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjFcEQvC-N3S9-P_er2rg76sA4fwq1s-TpLz9AdC5USiSn8pDscYqUIabpOCh3RxP_tstduc6CcCaDGuIPJYD6iEcnitJ2-gpSyPyOh1WvNm4IkvaW-iWNZjm4lY9oV7jwdDh-5KuDYtVU5/s400/thumbnail_komebukuro_apron.jpg","c":"職業"},{"t":"米袋を持つ人のイラスト&#65288;農家&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEju6V1gtTVskwygX7FbgrWSkt4KIwIIVXsYtsn6G52b69sBDztcFmCloy6EWzEZMODW_lwpdGkDoNLq-Lx_qirR0uJ4n8mIXuOvTDe_dEfPP_Ak1GEoPtZfiAMQFx8TwXEzE0nT7gxBQETB/s400/thumbnail_komebukuro.jpg","c":"職業"},{"t":"立ち位置に立つ出演者のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhaeyllT0db75A7H9gREFcw2Y223F-S3yFQzPYaqbV8_kLbMfk3jkZD2Cmcgk5JrW50uUnX6INo9WCsnEE-AZdUfyVhNIOSiHhIIpXZ5LqivLa9l2Obku4EkYRjSjzJSf1wuPkKVzpImjKa/s400/satsuei_bamiri_standin.png","c":"職業"},{"t":"立っている白バイ隊員のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEit1G9EIeBOTC_09tl_FZl_S9Gg5xxLp6DfOTrEy3YSXSXZeYN1GP0MhGah2pJ1YKfQM6nrBSAR9p-qcfWcK92GpEJVHZ0GZuePWkZMe_jx5m-c_GTrbco0XJA7lWygIa7tJ78Ttoqk5br7/s400/thumbnail_police_shirobai_stand_woman.jpg.","c":"職業"},{"t":"立っている白バイ隊員のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Fx5eeW8KbghKitWjB731xQgYuI8Qp0gi_jt4Owa9nh1t25Rw-LaK-lk49NAleMxb7etzf21nR1jjCotqV3hyphenhyphen3d-7d5M7-MgnU9LobslpFOL_9t4XV7hz3kQtDfmhskOxQfuG7oY8bl3b/s400/thumbnail_police_shirobai_stand_man.jpg.","c":"職業"},{"t":"オペラ歌手のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjTY0e8DSla2vG2gq2uWdUBq-KNmCi_jqjOSAnkJtRQQtAR4Rc8-SKhxs5IYkb47H02kNTI5qndpcbUPte5_2lpHLpZgqpKam1l60CFTW-plhYEBG3GVU62JONV2QsxBXuER4Fa7MKR7tyZ/s400/opera_singer_man.png","c":"職業"},{"t":"監督官のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcihrEXSaDMrepP8ZO0wT1AMUWfhWgD0NmQmgscAsk5oz4D7GBK6ywyVfwATdYv3R7dWpLxKCtRupHnazqjPuvEd0d5HHtn2UhMD80UDZ26lfqFzJJZiskP5LTRgzCfhms13yJbJf3pIxq/s400/job_kantokukan_woman.png","c":"職業"},{"t":"監督官のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMeLAEhl-RN1MhKnqRh_Z-4faXFsoRU5TB5ykDAiVyKTgI41_bn7GUgYGCT8BUFruiH3UwbUvAaY6eYIopO-kdCEMQJkc3Ls34hpUos9UGlnC4-cSOCAIqHiK79_qi2nCSd9GuoWziiUiU/s400/job_kantokukan_man.png","c":"職業"},{"t":"税理士のバッジのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvjrexcubpHBvNfBHKzMbrLEZi6ReCHj2ph-1IbNwF_iAGbpq0XQedMVeCblWJeL1-cvD5Z1I9GCxHqgMV1yZqMPB9q0H_snLFv_nbHpLxe0g0hehGe-TAeQvnQwZek64qJFt_QR4mQro1/s400/badge_zeirishi.png","c":"職業"},{"t":"チョコレート屋さんのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgsygjmBbrJfM15TitbPfEOkhdLsVQLczU0ehVBWXqnYIFyDHr2mgTwcP_17LYKLdM8E8mbFtqjde21xUTcZUBfiw2ZwXdI-XYWht3KGGC23Tt3fjtMdZoaNZAiUOmxMo7TkpoIgnvPdOgq/s400/job_chocolatiere_woman.png","c":"職業"},{"t":"チョコレート屋さんのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEioC98KOI5o2AEw3gJjALsW5g2Yi8jlUnfS8NDDqOpJi6KEUb5wJ7gkHNB-shuGOkdKD3Lt6gszfrGqV4gV8vFtaAHr3sERDuJR5Hy4wFb2hzNBnX5tyLrUh6qtMloi7yUQsEaDC7Wm8YEk/s400/job_chocolatier_man.png","c":"職業"},{"t":"刀削麺を作る人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjMG2HyU9R0i26ozBc6hdOZVItd3hq3cHAhBrIrRvDV8RRInfTO56xVNAsOZjhn2sfVsM3Q1OKun-_8V3FMlT1-pCnVd-ZmKQirKV0_uJ-Wy5gzshICgsJcjliQUeD_Ou8L_MSLVXmVI__j/s400/cooking_tousyoumen.png","c":"職業"},{"t":"覆面ユーチューバーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjipNySfxLK9coL_-FAk3rVl6Z_ZFie3akie0knNjE2yolJRmu_ZPcDUoKVFFep5SQszu13tHQOCPnr24eKZ49WFpe3UlJ_16gyr7FNK4JrTd_USzXeFwlbanI9r9nrHW_eQ01KkIE_Y7uq/s400/youtuber_mask_sunglass.png","c":"職業"},{"t":"スカーフを付けた受付の女性のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFupZ2gAMfj_RBWKcSUtT3ZPveCWFZRNL8PTyY-LVrlWyq7FySMaaPzH2FcXpdrMQwXlChapiWDiqs4BqhCEN1UE6g5pfyJgFoHST95yn8KUJVRsAe_ecI901weCfTS34R7re_V1PJVh4_/s400/kaisya_uketsuke_woman_skarf.png","c":"職業"},{"t":"現金輸送警備員のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhI1i2I94_qh8E2Y4uNfZEistKAkO8mJ8fRFhSXCKjDXArUIbQQCagB9zzv_11YLAfHgWSgI5wR4VlVIl8DM_KX3V3FtUZrYHpzdpInE4bhdCLOWLZ6I-lfvAzLuBJ7yI_4l832xxRlpcKR4R-_yktOdh3DiEcW3xdWrpU7NPOcI_QUDUe4Dsu6Jl6ag/s400/keibi_genkin_yusou.png","c":"職業"},{"t":"腹話術のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiBV4jt0beKNJop56FT52FYnfMIaU7C-xkW-JfLxu_ANfCEKzvsrIul2JTKSqQOfJU1c6K7pHwq8lrpO6ggBtf-r671rFwRELdScMc2KbA0aeg6u_I9P15kka5lhc8O1nLQTo2iTbvQRrUD/s400/fukuwajutsu_woman.png","c":"職業"},{"t":"ミステリーショッパーのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhryOp1BArO0ZjhDC_U2aOvjJTzYYTWxzvjKGCXCRFHxj8K3D2o9uUe8SCFpcv6iBdAcLcDgzKbOCxoYvSoUTUdkXAnvBBgWE2jeZA2MrvpuAkdzGgqXg68mU-HneboDqe8ga9Nhmkk0JnA/s400/job_mystery_shopper_man.png","c":"職業"},{"t":"料理研究家のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh7ufue6nsbfbtHjbCp8v4S5Rw5r5pu84wGB8tQ06sux2se1BV_9N0S3wMvtZtnRCRquHnwgGz1-UTC8O14VK0M3fXfn1OH9oEx_fJi5tA4RZq4wGuevR5v1S5-xB3egUwHy86eh_h08ASj/s400/job_cooking_ryouri_kenkyuka_man.png","c":"職業"},{"t":"シェイカーを振る人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhq11E7yd9KooKekSuq-JMuguQLi3Jqw2Cjw89UZ7QtukBnnGP_obhF4yn4jtFB4CAmZ89CP5PoJFaVaoHthHbLIe4PrWAFdMg6TOfKrwOQDHHjqvy20i9-HnmLntG6nbIlKuxxZTbiyRHD/s400/bar_shaker_woman.png","c":"職業"},{"t":"シェイカーを振る人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg9t-4yxi4epjJsrWSBHaUwBnte10NR9OP4mhGEWnTAH_peQMRtxoebZ44Qr4a2X85_roCGVFt3Oh2TArZR7dbZyK7xJ1d7X_Udp_8SeOuWfmoxodOATW7_1PGZX6BA1WtCTCVHMjUFSp24/s400/bar_shaker_man.png","c":"職業"},{"t":"消失マジックのイラスト&#65288;手品&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimVo77wiviJ2S8glTq3fEBJjFzBiz8-FiH6G-gTCnORtQsaViukgy0zOkfJl2PvW1ddB3dz-YY2oCIwBZ-5WHRytMtULTZSkr-KfMkEyMYD4pWWfF4q5Ibmj6lVowWHtkNYLqx9kz-mfcH/s400/tejina_magic_syoushitsu.png","c":"職業"},{"t":"ビルの窓の清掃のイラスト&#65288;ロープ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPmYAjoYFhYfJotfz4MuTrdfNN3fC57ntTaNWsVBmg6DzaHbGuo_ZCRHv5emaknZe7bdQ8jKn53Je4PaYvd8i5smJbqKv0ToSP49ot5m8kXWM-dnuGPkjH7FbXVtk2mp9swBVLjMu188eo/s400/souji_building_madofuki.png","c":"職業"},{"t":"ビルの窓の清掃のイラスト&#65288;ゴンドラ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgAdnqR8Fq5kSfaNqXtOD8KNmCPMeb-3NDJGRitFBoCDWo3qWorFwbozcSvtu5Wds1f2lckBQcCenGpAqlOHpzNbxqJISG-BhdcPx2JiHxmZdziHP5B_gvv0KvBv1verk0S0ywtbtg59UhO/s400/souji_building_madofuki_gondola.png","c":"職業"},{"t":"ロングボードに乗る人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiVchjJkvZ2QtZeAemz8FW7dKoKfzDfzkvEFJNwjMUDqmlHxDPzpa_3VtYxekHMm0G1ueovVQ5BA13TcHdQcJZz2tikXPwo8jTHBcK4t9AafhTgPUZ36bD9yAEIMcLoshw85vxTadQtEapE/s400/skateboard_long_girl.png","c":"スポーツ"},{"t":"ロングボードに乗る人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj4X1HGKRb7U5yT4Cuy9cUvH9BJFgnrH9I0gV4enzoglHAGsnwhgygwhFjs1C55F0r-9iu8TXlVmYMy1EIoA0BFd9_ceJF0QUMBybu89NxX8SIF3eLge33alG4ehp07Pa3o9ryuGZQSFcx-/s400/skateboard_long_boy.png","c":"スポーツ"},{"t":"活動量計を使う人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3i24FDzXY5rlts7uAocsUJQ3eAenaqLRs6qvWe0Tmarn38keRpEtFBg0bdCIYT5_8Tr15QCKTUo3B7hAUZe-MXWIeb6svvlcOz4v6FSS4JzxrnF1zD-lq3x6QcToufycxJifa2YPcbcJ0/s400/sports_katsudouryoukei_woman.png","c":"スポーツ"},{"t":"スカイダイビングのイラスト&#65288;カップル&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgRgUj051uLKDJaIA9yND-jCCpR2uuncd66FGQNolYUzl2I9pR2Vl7lxq07DoLhyphenhyphen3OhUXIIzhFJrvythLd2TYEAvYLb5RiuuBYa0hesbnsLTklc-XG7Ip7fqvWMAH79OShWzBDU3Z3kZ0E2/s400/skydiving_couple.png","c":"スポーツ"},{"t":"インストラクター付きのスカイダイビングのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRLnIRMoDKFiUMhcGVun10XfMV09-DVblgOXpKSYCtAzYM6MCBBZpi26jIXyOw2KAobMOpEl5gYEwv5HJBKrX1yiQmY3Qj-8STpWJrKtgVqWFy5Dv_3p1hzSrZkyZRjbQJSlZNFHIcYhi9/s400/skydiving_instructor.png","c":"スポーツ"},{"t":"スカイダイビングのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7qgxPHc8wXROev_qUuzEjZoz0UNRdTg5v4xqJJ4ZneU6W3-seHThyktSObutbGEUCHDFF3352uzpWvm0yjR5r56fk4340gXkzGedMdwbjVNe1_YcVRuFM8cjTj27Bs8hj3fTVelFl4cC4/s400/skydiving_woman.png","c":"スポーツ"},{"t":"スポーツジムの建物のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidFa49GhDMIO-nv7DCpxyG_vZq_zloOs4TyA_Hv80p0gMLa_9BEVm1y3l0Wcjs56-0Wsxi8Juv8dSTf-CFs6KCyz7UGVtGj5cA3SXgK4qaZXhLaVpTXCUsWli1iPDyTqvCEBZvx1G6mshS/s400/building_sports_gym.png","c":"スポーツ"},{"t":"バレーボールのレシーブのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGB2s8rpQJexL_5EBLVcOa-ehNVbnQN349chU29Yq0lJkjOj7JXAZt0yE6gcYMlE8HGLAdnAfKW3_8fGquNcxCIndhIvG4jZ9TxmfyGvfYUFcn7IGLodnxLFwF_8G5r-LDnikrYxKZ5oY2/s400/sports_volleyball_woman_recieve.png","c":"スポーツ"},{"t":"バレーボールのレシーブのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjXxE4_-euQ8bkAMRKB8wU8Q1ZqCXMYpI5uAYLed95P3WwuCdk9Op8TN1Up7okvwmLYzFWhYTHmAeLlxPiBm96QgdQi_5PZK39dRu1aJUzxOPYYQtRllXQrNXUxvKng_tK1iwAu3YLxJ_PC/s400/sports_volleyball_man_recieve.png","c":"スポーツ"},{"t":"マスクを付けた囲碁の対局のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhVrKgPD2qyoCSoeNbhkm9_4IYeD7o5lRyEmZtAjom15_2oYIihrLdpp30OCt3Z4XO-u83gPdWaWDJJJJ3bedGpINQfjZWGcblPXtLLVHItvC9nbbOUJMyZ2wali7TDCUKOHox6MWGzHaAS/s400/thumbnail_sports_igo_taikyoku_mask.jpg.","c":"スポーツ"},{"t":"マスクを付けた将棋の対局のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiiNS0zdjM2FXdofzYFzuFtD4iL00BcTUm8-vUgFFtIQJ78iIUHtaZbU-xp99jywIWqIRiRE00mwWnd5BTWidAgJI-uvksiWtm4mt9N702sShvVRfhlbj3HP5xdXI_PEXWmYV_YgXV80YdL/s400/thumbnail_sports_syougi_taikyoku_mask.jpg.","c":"スポーツ"},{"t":"ビデオ判定をする審判のイラスト&#65288;VAR&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0l1AIQbs7P8OOitY56-7d2Ezc6fE2_TICruZfK_iWOLbNJw1up_wpNzE8-0GBatGMEgDTmkCYruOqLkuOk3BII_ei1V6P5yLIhHAvQhVfIG4h1E_6_rfW2zPdeST7h9kcriIYhkYhyZBN/s400/sports_referee_var_check.png","c":"スポーツ"},{"t":"VARポーズのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgz_KD4wcCk5Q0poPDsJhMGyFAT1FDHkRY5DdjxHriBddrGb7UmVyBFG4ox5Eg9DPD_t_qoP-nyuFwPQAe5wNBG9sK0XZgHnCma4sbDjsajU1uKYFCl_zYbTBjcCfcdWRmVfqlnkK7ICe6C/s400/sports_referee_var_pose.png","c":"スポーツ"},{"t":"野球場のビジョンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi9FGU5AWk3Si8Z3HmMsguZwfDHZyB1LcNwZeCcc5iezNQ6AVd5Owy9y3oJljBauKh0x9C1LgV-HtS3nFDRxPBE6ghR6wWyg2T7adAxdYAMbJX1jpwr9zZH7NF3cggdfRDttIEwT7yo7zTC/s400/baseball_ouen_vision.png","c":"スポーツ"},{"t":"新体操のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRIRmqPzeUmkAIXFx80G_4OGAMsplksNeF84P6MH0Tm0vfnp4td6azL_RnTvF5tTmihSrCjX1GUFrBVpU4f0uNYb9cI0WQsdULlpErdYlwUv1gbfo_Cx40ScaWH74FfqxvvnuWr5zvJeQo/s400/shintaisou_man.png","c":"スポーツ"},{"t":"卓球バレーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhQqxdq6xxxVJC6tlp1DomwI1Eqi64cULgoimlfVtkyz5RSW7SF7hR99ZCjwdhSaBjIDxcNyQaC7KLXOcVSCWvgGylKjDnGh6Nr3hEyuwJH1mkhIKuS5eX-B7AsmuVKao-biQ26_9iKRnWJ/s400/sports_takkyu_volley.png","c":"スポーツ"},{"t":"塩をまく力士のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirN2hjrogJPpO_72bBLLzWuMRyCfk3S_zpHVzb19VLaJzQM3t5X0_FjV58XeI-L8xGTTmzzda1oS7da6gOr8_P0z_0LPwWN6JBnmO3naDytTKXtSk_sfZx2A_FaBMhv7m3ARY5DW0Rh3xH/s400/sports_sumo_shio.png","c":"スポーツ"},{"t":"アームレスリングのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh3myMD3jMLhEctG-Wcex76lQ4C7H1NR9Kbci-36mIX_iOB5m8XDaCIjD_9t33s1CYWV_sF-Fd7rgej7PKhrH_Ag4sM0Bk7eRy58GZQ4TK-ThSLvMl-g5EyhNVtBAITLJUjuZlzLsxGSgG8/s400/arm_wrestling_woman.png","c":"スポーツ"},{"t":"アームレスリングのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjer14w7Zp5ghyphenhyphensFU_WntS4W3a118F4w_uNxXnnGVsFhcDXM7qriof9AEaXBAfkcFf__Ocb_k7NFkSUuomM5n62Bhllm6B6BDuz8Zd8UmotmYSy9YH5hmpjgdwmXGWigefHpUSUXCdrGWFV/s400/arm_wrestling_man.png","c":"スポーツ"},{"t":"体育館内のイラスト&#65288;背景素材&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEifFSMh7jXWF-HyLTPOYWLgzegrPauBsjBANZQ3naMqQ7D6l7iiIBB-kHYcXSVSjMPNhj-8_bB2nbIq_SbubHbTeALFtMWEIeDLig2LH2PgdFC47pK3Dk3ujkYHi8Sr8jHmfrYrjnmZDISm/s400/bg_school_taiikukan.jpg","c":"スポーツ"},{"t":"学校と校庭のイラスト&#65288;背景素材&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjBFt5gII2wJI0hvuZmP8SncLkWCe81wqbiL9D5CvMetShyphenhyphenFaCqdbstIGJ2x-G8HQSQBVk-KCVwMS2hx7zH6qioyTcMGee2pqze_Vt4Ck3WnvYinWBLbjXWCL1PrUBlb9NpKKBxZXzwl67w/s400/bg_school_koutei.jpg","c":"スポーツ"},{"t":"いろいろなジャージ姿で応援する人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgRQGgsvUD7CyrWk-QfbgKrSihx2KB_K1yFOoZ-f3JOYUefKQV6liKFxBKHM8g1UaF7hNOlbOWKvo_vdhfUp89m6Md6uz_iaQ5ZkoqetmhowpqjmTv7UVg1WKehkET6nCdo6cEi1BaRQNYG/s400/thumbnail_ouen_jersey_woman.jpg","c":"スポーツ"},{"t":"いろいろなジャージ姿で応援する人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2nwQjlZu_IxbKD3xfKWL3UUItHe0HRenyClPTccBIdlEOtQLe35Vw840GzxMqofwg6Z7ZO2uq2TrFZlhIz2WFMglNolHxaFk5yIvtRWg7ScSmzqfG246uT861nwgfwDyGtswLR5ZEAEat/s400/thumbnail_ouen_jersey_man.jpg","c":"スポーツ"},{"t":"テレビでスポーツ観戦をする人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiu0cPACMrNnbc4ibG32P9Or2cxK13jtFoaI7k1vbF8ICRL8X6rTp7WY2IwfMsL1bf4YgrH4BKv5ONDw0NggGl_9T98w0Sa0v8MZVFDGxJfwY_5V3SF5b8tWDXx-WPp2TmrfaZyQXJr6b49/s400/tv_sports_kansen_woman.png","c":"スポーツ"},{"t":"テレビでスポーツ観戦をする人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi39Ykm1P3gkYCgXuj4vleelETQHR6MMJfontM95yVa86zMO6kiTOCE0LJ0fI_iuikCQlqGuMxLRngvJw4V-5509JVT9NQCbF7XvXlWT3AXw2JJ_TzWgCDfb9eFcOaOBryO-jQOxknrZgzJ/s400/tv_sports_kansen_man.png","c":"スポーツ"},{"t":"将棋の対局のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjGtxZDVnXrijIS8-SFi8IWQ8GSruxoWllH8IUK2CixnkfWZQQ1sqFy83j4_d642K4DsCWFtcjaem8IV_hpyl045fUORZLyiwUlRlWORlo2cNyeMAaAq6oFbHIzZ-VVUXvyeySvwvmk0O46/s400/sports_syougi_taikyoku_woman.png","c":"スポーツ"},{"t":"囲碁の対局のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiuc6pJoKdCZ9w1lFJbuxzfMBiOy9HOWeCpZkCOVk4WTX9ru8MNV6PlQ1mXFfO_aG-jFr9-But4TcZi6rrzftDKFST27DeSH3ghZ8WngOF2ZcIHlXY37XPendeWToq3Wj8e8HDxqJWEDrQD/s400/sports_igo_taikyoku_woman.png","c":"スポーツ"},{"t":"いろいろな空手の型をする人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEixQ94K890kUr1EyjpCU8vWQLE-JVEFpO2uX2BnKbiWIiFS2pvP0VsOBmPYhvPvCXtvIa9JJkm5yLg47dRzJBQ8edBZ_IU1sJ5fBK-fP2onXp2J30xxN8Fs_7uwSUtT8a4wndo4kyc18UqV/s400/thumbnail_sports_karate_kata.jpg","c":"スポーツ"},{"t":"ボウリング場のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFrlstzlqH7P5htENaRx38OZuqqmZwJ1i4iETNQqN1AQeRQRI5NZGgClZioEfOOKDDSdi-q3c7Y8-K7PiXDl8my83TADpt5nAD6zX0Hfsl2d_3sEa7GHHyiPoDbinbT-lq_GG-ENf56PP3/s400/building_bowling.png","c":"スポーツ"},{"t":"マウスピースのイラスト&#65288;金管楽器&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaDzINRUtls7vbEYh1BFNcVYzgm9HgMTtKqh31b_xQb1qUYJdkDBj5qiISEO8L7lCYyfyFtLPy33Gz6udyDdoWuTBeX_AvQOcTU9Z4qREsqlbi19CBZrFuWiUK-iSVvtqip1YJ9XC7umCJ/s400/music_mouthpiece.png","c":"楽器"},{"t":"ダブルネックギターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgNW5BG23LiSMp4L9LVR2XaM8zk1Z0wf6WROcs8u6yhCtVnSIsdnJ9OUbsHSaJY8QVXdaL6taDBrtKVsR5vNISMbv8Iv3p28hWGWALdTjvTqLIBHLSSoJKJBg3qRk-smlhZFrztbbtw0bY/s400/music_guitar_doubleneck.png","c":"楽器"},{"t":"鉄琴のマーク","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjf8fPaoe5CUyam0CXysXBtDrIwJEt7yKqqx-Q9R3nro0_9zEOORioO-V3NVeKwSs80dXuCRSgqMqhBMqNAM5azP_bpXhtQ747w1-nebjl73DGn8HP4CIvt8ptHWkg3Rp99syZDBZU7fzVW/s400/music_tekkin_top.png","c":"楽器"},{"t":"木琴のマーク","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgh-xXCd9fEnhko4pPhpHnI-DO1RVwjN7V85jJR8jyho8Eehzg75gu7wev4PsKxA7jmz0POyXEA7CYfZQFQ94F8B9BiH84Gmm3yhNU474aooVmV5rNHNh7FPzZ0pVRRqfvFbUdK9FZ_l06N/s400/music_mokkin_top.png","c":"楽器"},{"t":"ギタースタンドに置かれたギターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSzYk-FEMGiOjMe90gWhFqRNBg11YuHesHA6Bmg0iF0i55LSEcoWwIrdfPvMJ312xwoLIU5rwDlIhMh4n6H599vLFATNvYP7BvBQRlKlY-HTFFImPgmOQnkAIvtEQmXy1PtlWtVg1j8vSP/s400/music_guitar_stand_guitar.png","c":"楽器"},{"t":"ギタースタンド","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6y6s3VZi-XiGJOmta1CaSxw6767JnXPqFxwf1Xres7nnKjPu9RaVT7P6VDblToS8pA1HRAfjXeQuNYqGns3IStJM_z61VRFVyRoQ7C7mDDZu32gEek-9bf-4ustaz7Xuujk-9CdsD_ypP/s400/music_guitar_stand.png","c":"楽器"},{"t":"アップライトピアノを弾く人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhDiS5sBhTifCEB775n4DMx4B65z9kvQAyfMYsc8JJ5Wpig_3bJgnpxDo-2wraCWKW6l75qczGS06y606CySTlA3BMZ_ZU5M0GW3cKehYYn3tmwJwO2kCUFSGN5ZpGyQyH7pSbOGmZDCNSh/s400/music_upright_piano_woman.png","c":"楽器"},{"t":"アップライトピアノを弾く人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1AgOBHFih9S5HiEYjWqa_WdXisQzxf9xaPPzCQ1YQ_SmPExxh-p-fSZK9HDr4Ezr8kpBu3Fha16Uq5oQEU9IiHs77LGvjgfb8EGNAOm9sSo6_7FjipaVCFLwE8GK0jT1TY35_Bbl5dYs9/s400/music_upright_piano_man.png","c":"楽器"},{"t":"リードのイラスト&#65288;楽器&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgRqEGq4w339X4HvdLn1Or69xIrsmkpxdVUQq3DMVRyZR9dFR1XrkC9uetoxfIE2iqhNN10mSDtzgacU1nvkNInJOgXPJKNXT7Y1YxvkFw6UYTShKp3ATYWDq5NGFmDnJVi03joDpyRxG9W/s400/music_reed.png","c":"楽器"},{"t":"龍笛のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbakrQXCoF5UFehKNg8UkJ0aYFtUtKcIo2dpcrHuM8yhlvGmL6xUjDlDkS6-DGOi4pgOnSiuMrXGooC33TFCbHJXjFwECoZ3J40j2PQfrNWcOmwetIBe11A3I6MPZs8Y03R2VP5fgJB0dP/s400/music_fue_ryuuteki.png","c":"楽器"},{"t":"篳篥のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_AZXalWXYSaRR-6SJd7Nif94RK3pMTVO3wOciKCHd7w_Tu6SZr2fYx68qlaqcliO2zrojAY6D3xJGSHeFpVqcUaFAWXFmc09Oq2u0fbIZi_XwYk5f5IDceLpuu1qFVfw_dGE1WE_mu6Yn/s400/music_fue_hichiriki.png","c":"楽器"},{"t":"ポータブルアンプとマイクのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidKI05FB2-1f-vhm_1BVLmQUrzQbQK3Hwlz2v_5LPJf8FnUa4GugonnD3GlGK2Nuyg5xE1RGXa1qZ1FN89NxK31PNkUezVbsJZHh3XkC6nvFQSWtRaGY_9JB2RSth4j-B0uAiKNTmbQ_3m/s400/music_portable_amp_microphone.png","c":"楽器"},{"t":"マンドローネのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhfL4E-s2vS4cuucy8gXImQoie-fWPxrxFt1BWs8S1WXNmDL15askhmSunvYFKffNbF6_xCa7bfmh-nsy4kcse4aScMM9LTzovWdCTeJFUrH-ZO-swImNmEzVbtOU4bDLlrMfpY-qGmpFfh/s400/music_mandolone.png","c":"楽器"},{"t":"スタジオのイラスト&#65288;音楽&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbI33h7pUhRdWnZxW0MUyCyja9IrCWNNm-bCSb-OYj_sI3nWC3Li9W0NUAew70kMO7t8KFbtiz4ITZB-0JXBF75kBRa4TggDSAwZKjpw8EyZOW0QDRzXswNgoeaPvv8b95rkU7sqot9S57/s400/music_band_studio.png","c":"楽器"},{"t":"ティンパニに頭から突っ込む人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjTUscYvRn34eM9c8dvRRUAB6k7Cp3LCS-4NFtQ0qKXHX3nuwOnuH5bttOsk7F9EQznhSCmplr8-47HmeAx8I1y5g7z6OefQIjrEU6xfV91CemL5XCBmaOEd_YG_oHwlgRd-kG0azBVagW2/s400/music_tympani_fortissimo_fffff.png","c":"楽器"},{"t":"ワイヤレスマイクのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjWYhb5s2gLfulpnA333MiSKVQ5sodpRHDWHnMBVYYb2WTHIUVe4ZhBo6-aEBdMj9Ah_ItboSR6a6fQ7Z5m_EN5UFOq4JXBz73QfdoRebid06JMZGJXPlDN2TSW461_S_FHiodftvkoa5qN/s400/music_microphone_wireless.png","c":"楽器"},{"t":"ドラを鳴らす人のイラスト&#65288;スーツ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCaJQC9hq3tp1-Jt6sHq7wlmf-hpExTENvPeI3TLwG5llDMgY4KBDMdJy1KO_wQU9PxkMBkxj1Q-g00xvpxAp6-dtl40jPmIIay-EgJaVZNn_Sp08YUcYUnvrXxVyDKoTs14ElE5ahbABE/s400/china_dora_tamtam_ipo.png","c":"楽器"},{"t":"ドラを鳴らす人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_lw4AMpl8EjPFwU-tiaSshZtSedoL0KiqSxv3vI0dJ4DlakXuKeIznnJUSzOF9p_VgC4iVx6Ty-y2t4RDakxnLf93w7iICW4fL9HjDvq8_OyFk8YiuFVsrJ2tCVKgHsndI9ZMqIBkN7xH/s400/china_dora_tamtam.png","c":"楽器"},{"t":"イヤーモニターをつけた人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg1PmfLFPtoFHbLIGDzTNUIo0A1ORQZJOMeBLSs0kxiEISk7Az5czte1-fOKDGo0okF8gDppPqhdF5RukEgVcLor2B6SCqYe1NAJhgc3Z9xjH7hvvln2aQRU2VI8HZMfbU308NDKoHueD0E/s400/music_ear_monitor_woman.png","c":"楽器"},{"t":"イヤーモニターをつけた人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiixobLouqTCZKF24KEnPdC-bkAZ7qzfxcXzZIsa4i6QAOSA4XXmw8Irq5RRxvZIu7Owwi91N78A2cpuR5ffhM3uqgX1OufH9-ZFqz2_a2SlC3KcxI4fcyqkKhzmAuL6k3-RZcaBsCWaCGH/s400/music_ear_monitor_man.png","c":"楽器"},{"t":"イヤーモニターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEib7P74MOKfSx-6E-wwUgmr4FQ1xPMVpLlNhJr0dTEYOxY9NK3llrQapV7PTrNRRqcmz9-qKQa_mudGtjUtqfRLnmpZB9HJFbGv4cXP3WXilJSEyzow5TnFhHoWM2BcRPBHT1vU6GZjX1KB/s400/music_ear_monitor.png","c":"楽器"},{"t":"カズーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3MGXCEmp-N4pmplYd2C6BdcY9_ZmhK8PysAgYyunEQvTTP-h8hhMaGuDDTB11kapSiwe_MQoKbDmU5W-RSfsuOlKZ3XnMb8Ai2hs886N_iC_4d-Qvz_rwqxHTxQx7_EIScC7yGkTulsbi/s400/music_kazoo.png","c":"楽器"},{"t":"バンジョーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihIExqjOvqhHQV35Qqo41fouA2N6k0NsP6s2Adikl-n4PeGTYpNSZ3B3y-04QTEtONwRZMX69qAsRy_y17OUki1hssSNI_HFk9YtF8knsG48pBbPSaZVveWknEWGWAzcFxpIH0NwldM11t/s400/music_banjo.png","c":"楽器"},{"t":"楽器で遊ぶ赤ちゃんのイラスト&#65288;太鼓&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgWc3DbdSjjmIf6rV7RY3EGkRosso9Q2QuA-4FvZFdVPxz1okecSufa9-DaADy4V78AyhyKfWIGZm0ONSnvaCirEMN0nkZiXNE6HUm59buMvx52JIBgo-cMrQyRoj2OMsuo1gXfbidOMO6H/s400/thumbnail_baby_music_taiko.jpg","c":"楽器"},{"t":"楽器で遊ぶ赤ちゃんのイラスト&#65288;ピアノ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgVpsMLlwEDLQ3-LWWPVJMubgCRkQL3_d0ygemc9TKBKvAuZEXrXztl6NZLXmit0JGDOlMlEbH1XxX5yAPNdiDNkyb-lJ_uRSWcYJtBC2hDjCzHDEf6nmznGtYhuhRjwmPh-w0zZmLcvdgs/s400/thumbnail_baby_music_piano.jpg","c":"楽器"},{"t":"ドラムペダルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjmVmS0nbBJVloqx2Q-WKQtHhujYXW-82cZwgA6ciY47LhuPFud39GrwnQOrqi0Vx844tFn_3TzbgcKKT4bO-cBoz6HIQZi6vYzO4OZgXBqfHfq41EMjbrbRjyTKAwOtNzywZvh_Q8u5bgc/s400/music_drum_pedal.png","c":"楽器"},{"t":"ギターを背負う人のイラスト&#65288;女子学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2tW50Pl_q2an88106go8CG6vVxQHUT9qQLgD4P5XYk9deaGpvK3d0jdZO5qQUDRbN5LRUzklOzKBfD-5ca1Jncu94rf7eDzFCOflU5tG1X_LMidtICfmonySPu5R0gbGLQccqCHZWhiIO/s400/music_guitar_schoolgirl.png","c":"楽器"},{"t":"ギターを背負う人のイラスト&#65288;男子学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhV84U1RVFEnuQ5yILHMbSMjmh-sggSkXC1Rz4tvK6o8qnVzaQlynIEepk07PHEKFkeHMpt7dWW6wpWr6TbgihqKp008u51lagjpwN0r05nIyJrSZI4HRBRLg389tTlgTUaTbbhiu7TpCbz/s400/music_guitar_schoolboy.png","c":"楽器"},{"t":"ギターを背負う人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhX_qxj1-2NGMA60YouuunAur30NU8lXAMhLrvnFnFSsQqLAlTMxDJ2E9-T2HoTLTSE-fVv8LZKh-Vf_lk1C0DqUx-21qFeocQtugFap_t3mviG3ZRX1bdw-rU6rbPflZKSuS7CYY_JeC1B/s400/music_guitar_gigbag_woman.png","c":"楽器"},{"t":"ギターを背負う人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhmDusZlvwthENsvCCZfsgiZVHPq6XDScOLsGKHnO1ELy17lHDgwUzfR0Zp4kyPd-ZS7NmzlstpiqcNLt6uU5LBwKyb_yfE3K4xMXFjYAlVQeS25XsVBVu8KPg5af0yzB3Vf1m0pmZGu2X4/s400/music_guitar_gigbag_man.png","c":"楽器"},{"t":"青銅器のイラスト&#65288;鐘&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjzNxTapXZWoHH34ILTJOrPB-f5TDHf_gBbmL2-o4-QU2Ce6C5gabXHhjpazIwuoHwu-0hqL7T9F5XFc8qKENq7Uce-q2Mpza9WM4UKb4y-N8E2D_nRXtp0G4dUX-TTbBw-U7zgRbd9MAYj/s400/seidouki_kane.png","c":"楽器"},{"t":"笙のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYUpeF4oV9B3AvIw31asc_HDOQXwDmIefARwFZJGgfbcIHmhiQiq6gMEVKDFnZbwA1Kt2jN8yewp2amth-tAYbfM6z_Ach3Eg0IxcjWpbsoYRenwTgo5GMtB_SP94tpRfrZI-4f9QRjNpB/s400/music_syou.png","c":"楽器"},{"t":"大太鼓のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiugD1rsW0fv0Zalt0NhqLQSgS0nk9CE9jkMpa_vOpwmR0IEZbz8OzpD5Dvd43BrjqTlZLkptBfCGQF9V1CWPBEzMIoQvJ4LYp_Fd29o08i_3vRva25ZTSE8irzm-KaYKuJhRCHXM7lZ0EP/s400/thumbnail_music_oodaiko.jpg","c":"楽器"},{"t":"タブラのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgk6fr1vaSYL1i6egCf0YrEbaP1MAYMc6Y9hDLbrPu42WHh7_QiG9hW6LuMVvK28dJjkfKsphUY3QNybPbIn-mowMagFxDKwlp-AZTXoHZ6vqmVk17I8OYyoM4VHx7lSRszhk1CowPhIzLn/s400/music_tabla.png","c":"楽器"},{"t":"無線スピーカーで音楽を聴く人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKHdTXmBZ5_A1OjzTH4uuVk_UJKfUGF4Mu78SbE7MgcJcVtknB-ZNGpU_7X-X2UVI9D-eikDvtbPZFfslU-ScMDWVae98xCstu-HRLPAu7cGgeAbU-W3SgnezI2WM8x_hlJBiFbARiekx4/s400/music_bluetooth_speaker_woman.png","c":"楽器"},{"t":"無線スピーカーで音楽を聴く人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpeP6Tz4Lzokuy8tikL9o5Jz3LV81GLbC7JAS3fyV_1DkwTvr1LY7oymgFHTpdrnlJosfC00Sh3diTMbsPCLxWQN2AdSiNT-FIUk7Z9Rc5pQ-e9jr5K62Z5H8K1BPumJwUMps1bzgQv3hh/s400/music_bluetooth_speaker_man.png","c":"楽器"},{"t":"ウクレレを弾く人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2eeMLD0cznwdiHi9Famm4kcV_4RP_fwZUNPg8cnHzKNHyN5OfrfGXbDWOrx9hdaT33-JKj3yJedKicVtZKRGbr6iF_IlAbh4s2gbCPMoXSVXhwJhUykE6K3Yrc0hp3nHcXnly6Rz2fdvq/s400/thumbnail_ukulele_woman.jpg","c":"楽器"},{"t":"ウクレレを弾く人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjY3GSw3wxSuxKx3YOnzAPiam_PYCk5gVenPaGxnnqnl2DVU25yjkQKfSWJ-WOfIsbjJfeFBlviDQ-LdtV5QF8RCIQiTboRATUrulP1s_sW6Q3kDzVcmKNSW98wcvmNGhcLeyHM20hyphenhyphenv9jC/s400/thumbnail_ukulele_man.jpg","c":"楽器"},{"t":"カバサのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFAJRsuD1Rj1lDT9mo6dfH-hjBs1V-ASp-LdwXJzGOJnmZuQ61A0qTuau4w0knMqfa3Jtt0shVe2r9-65gBsCoC3bj60jltRCc2c_YdOvkdRHKtnjx0PViz6QXVcyPxsLcylZmvLVCImwK/s400/music_cabasa.png","c":"楽器"},{"t":"チューナーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7kt785ZWbhMcNGOpFtsD2fmjZ4_wh-E-068qtSg3bGfO1NxosuB5YZ0O1VVC0VvsC_FUi0tn0sUX5bWDe_r2ClsyX4hyphenhyphen4jR4zEdSEFKNrAmZgtx_rok5mWwXpaAP74dNdq9aAndRxJUrx/s400/music_tuner.png","c":"楽器"},{"t":"家畜保健衛生所のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTFQqRBY2AkjHUDeki13yFLt80ilv-FJA6egO9aSOd99XzIlmPh6B2CBUI37MGE8bVHjrU1m2wQJJZ0pKJdAwoe5Pa5fEBG7uZprepzjgYZZLjtC1BS9lNdvJTZdovYZNBwWWApUx5w9f4O5suDVffLe4nbAh2S02fiC6qgtPPGpPbK7hOgunbQiKyKHYi/s400/animalhealth_building_kachiku_eiseijo.png","c":"建物"},{"t":"老朽化した建物のイラスト&#65288;高層ビル&#65289;","u":"https://blogger.googleusercontent.com/img/a/AVvXsEg2PCpZq9a4ZN4aSfdmvFYsMb4LMKzRK8vFlBMq6rSOR0nJk8tDRwPAGvrnuYOWRz2_21LWgKG7jrb_Pf7ARBaY_EPCvdi_PdjoWpLogY0naxrLdIcliU1spBXPbhEv0-mGF4oURnu5THbeuHIMH_yR0oNtJPbt5NdTfedYTXgsMHxduC0sGqLqx71TpQ=s72-c","c":"建物"},{"t":"老朽化した建物のイラスト&#65288;ビル&#65289;","u":"https://blogger.googleusercontent.com/img/a/AVvXsEjmfinxLMwqV_xSt9rFxGmBuNWbJa4Lts-JwGdUiAJQktUmZCjNJKDdnP73h58yhz3KdtlnSa3tuIu9NKdiA10z_jxdc5B9fYnXma5F_Kycf-MYONXJ2bTK72HdfYsNeDE3KU_kPcn39kFk4gmKYPk5y4bfG18nntXYRLwzm4B_KLTIewT9TiXuGbHcow=s72-c","c":"建物"},{"t":"老朽化した建物のイラスト&#65288;一戸建て&#65289;","u":"https://blogger.googleusercontent.com/img/a/AVvXsEi_iOltHuKx1_oEhwHfL4uBKjSqA21WmKYbVn9W4QIV8xXXTTAb6pOPH9QmoYepLsqJAjNO-x3WcSk-XUf1FK3R4UYDezs-31rs4FQCdP_tBPf6_Es9NlifonN6GRyjZaMK1Yo4vnQ44o521c_UeauvVURvziM-K5dCZox6GL6GucMoja57XsEJS-EnUw=s72-c","c":"建物"},{"t":"国税庁のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2xb8fpf_wGlfhyX52c7YKQTsB21JrZTG0S_5jUX4k5osxcabFVMhdZpdsvjQ4Okmz1uQw5CuWhwcUFOGYmqx-8DRWBXsjXb3Mx80DtKQqdSIyyAIXKnOpDY8BxjGtaQmHz-f0VGdg6q2W/s400/building_gyousei_text_kokuzeichou.png","c":"建物"},{"t":"国税局のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiDkSYS-pxeBSAyOxWSpv4TgJcoln0FuJ2r8Msiqjmv-pcuOL_guthoxr0ldhuciaB48YRC2QTW5MgLcKyoela2FRN_l3TFdpw2GVrWB9P8sO5JyVYNr_Y8xRekxFLvKB4ZoToltrDULKFA/s400/building_kokuzeikyoku.png","c":"建物"},{"t":"デジタル庁のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6JgaokBMKaS-9neLFZ_1vmIavoH8M1hIxXRuOjxtse_ABw_bRU-ky4ascwNkXty8c670hBcmgfmFdv49aRnbLEEhOxFpfsOGAihUxEmimqqTPno7KD8D-cQnhF1QkUteQdoXkC2jOiAT5/s400/building_gyousei_text_digitalcho.png","c":"建物"},{"t":"ワクチン接種センターのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgpa1silG3aNSVUM8In6nz4BrAW6WsYW2cjf_-Vpw49czjZgdTeCI4AxBJ8x9vEGxsuNtz1zo1zEQIM-s2lWvgtG1ISWyUjga49XkJzMS3klau6FqAp2Qaoggnd1Uj4YiRi-EDzXvPz4XVS/s400/thumbnail_building_vaccine_center.jpg.","c":"建物"},{"t":"アニメショップのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjs7S31wJOEADwnPe5TB1LWCgtwPu3FYPDSDnwTATX_r2XCM4bb27hgeZ6sPSH0RyHuTGwF1PwynzGUrQXlZZDl6h5DXhpOlXrWOI26m8g4Akryo7B21Th36pcCBvHZvdNGI7PwuF7p74XZ/s400/building_anime_shop.png","c":"建物"},{"t":"デフォルメされた警察署のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYz_l26ZGco1YtzcuRauPwqz1D6GFurFqIJjtJK0cjFb_xwjuzRA9CnVk6OGQHKzhrHWGqx9uuOiOTzpMBxL8TVsCc-Ma9t455Ayuo-cVFZEs9wzKGcLgqYkQolDfDThGBg1CfIHqZObiX/s400/building_police_lamp.png","c":"建物"},{"t":"物置小屋のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgv_XVADjx5Cg8ZzzI4XMXLT1o4BDTSrUn5SHOuN8pyRpeEw4uT9KHgHVa_GsteAL6BRJNjRdbE7b3sTxyxJwr72Mis9dLQyWrSYy5cAytdJlcUBQn9KsSr9Vk0R1fv6e-sY31CNQUeBAUR/s400/building_monooki_goya.png","c":"建物"},{"t":"納屋のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhzpXi5kbyS2W5R1DE3e3wWbcMvbge1ZhtKlbCIrehI1EOLtBk8Js52Qtx5b39n3ZIS3GYHQiLlhFyARqUDbNE1T3PgwATzS8oW4DyNlbMqwfHaSmfMMbnHJ7Xs9d5iVgffvIcgvTBAYsP0/s400/building_naya_souko.png","c":"建物"},{"t":"看板の落下事故のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8iSkY3dx_AgdARUZXC0AKoY9oHCNtto0EVV0V5Yoc2ZQmTMyR3cFAxxrcl2s_r631M_BwamLNkDlHILszZzJfDk0h32AW2PXZAD0Ks9fL5ybrw1rmWpQ-SC3XuMs-B4PC4BViuine8zsL/s400/jiko_kanban_rakka.png","c":"建物"},{"t":"花時計のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiSgUXAOysKexx1ih-Kk0wMtN8BSGmQ_jxFJS-phyphenhyphenlgyoPVipCwbCaRw3LpqjgRAaI9te6s_OxT5GZK5_Y-McP0VtFI2zJn0bcwlGm0N_GIW4uNUYVOCzDTwM-Vc4dIWlLxmVfuOSZvfMMh/s400/clock_hana_tokei.png","c":"建物"},{"t":"ルーフトップテントのイラスト&#65288;キャンプ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEirxyWynMeveJ4NbrkuEsAiA9jrmrUZ_7IvAzQM0mKBc0C-sUtyjGsDzpk_zBU7QeS4t5-QuHoPKuTMNEC2gnTjEL_uo0u27jqGEOFPtDs83UeC4QVz-BBAFS_lPzG4L3TQ6SpmJ2ja9BwF/s400/car_roof_top_tent.png","c":"建物"},{"t":"人気のないお店のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjh-loCOLq0mXwWX6NJ5BBbJmfpXoAFNmzZipuHe74PQcNkTUMZ_OeBqeXfvcjCiQjCjpwYj2aRluqwgDEIvoLPWbQ6ZcDAtGit7bXDcN9vUGMwjRQyL4t850GcqWeSiSvcOAmUC5vKjmaE/s400/shop_funinki.png","c":"建物"},{"t":"人気のあるお店のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgsTgin7nQjk2wxUxW3_YK9C7WRDjmAt4lbpMPZLCxI9Y3puDAqrll7F01OSMyQpcHfu4J3EYOa0X0uRuffLHQkjwkL-eiWZ4Z_5RtlfHl89z9j3LHDZVPZm-WM3n6F1P4JgpPYNRqYoW1b/s400/shop_ninki.png","c":"建物"},{"t":"休猟区の看板のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi-mk0rzQlzocv1OexbBHYpI_xUnYAXMCsjAr6uh9kH3fgXOIn8d9ntKKDV5phKhpSmg8tIJ-cZzBXcg6y8rWcwLR6rGg2nqHyeOtWCM4m7ZSgZ4_fLSyXSAPlppVWjIn5Mzc670oUPlwMo/s400/kanban_nature_kyuuryouku.png","c":"建物"},{"t":"保安林の看板のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcaiZwWjTPtS9u1pyYBbJY-xTtIFm1e1ibePZyFULzoI-j0Kqh5NX9I0VcRm2HhjBSZW4gnZHijufAvTk2vjHZjNUxhPngCp5OBrXUr0pjOs8CIsotc7X972ekI-ot1b_Igt4ET2dpyri_/s400/kanban_nature_hoanrin.png","c":"建物"},{"t":"鳥獣保護区の看板のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjBqQnbJd8zsD2RJvBWFVt2_uXAdfmhHewPOnsavaxmIVELNLw-52vnSIyoJUpV6IuhBqid_t1M8lDrSXbPvNJ7js8qD7Zmt8pxm7DONJtDiBiweCuHU5-jYNqvy6E1YXKz7xVYyZrddpUH/s400/kanban_nature_chouju_hogoku.png","c":"建物"},{"t":"シャッターの点検のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjp-4g17HoPaYXbn1TDQF7tKuJFwYJ7eF50xQdaaqHSKlLGgV4jwd9QUhHCgdQj85auwXVXQ9Zf1kUbi4mszqY1V9u5M3WqcC9E_jZ97Oj9kzUnjihq2yM5PikDCGn7-SJfkkpre3Kf1iAy/s400/shutter_tenken.png","c":"建物"},{"t":"村役場のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgoH_bm1olmUuzDKFBuHraOG48D6gkNOA0u9LefQUbNLqIpfMG-9b7VUEpbiI3hTSSK8eytpXIOyqDc-vVKdfhkbbBrcPWav1i3Sa0l91TF_1M7WZnNV7Hp5uJbyf_glBtnUTn0UiwLCOSn/s400/building_yakuba_mura.png","c":"建物"},{"t":"町役場のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYg47vmMjm-t4vL6t9fuiLtWq_hTfQNTIemUWucOcABHi6kd6fmGiSKQ4vcBIlebmc09d1eJc0FFcHhaO1NVj8ou23ACp4qaO3Soz1V_ik3IpLmPSW9fsRhWBrCkKUmxiYlDXwEhOj5FKg/s400/building_yakuba_machi.png","c":"建物"},{"t":"児童相談所のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimP9WFmDN0BZLe219MtercEF3BKzsxsZkG-_TGqeputbMv0OZofxXaxBUzF-Gq4Bfdq_3PTxMXduZkLjvB59vuJ93i2PiCY0G1jDrPMdmODjGQnxFILb7sJIcWwnnXcbua4jQKNN0uvEWN/s400/building_jidou_soudanjo.png","c":"建物"},{"t":"夜の街のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsYrv7I4YfvlLkQOinC1FIKIPUcRXR8e5H4CjObMVl9sXj2QoNrLp76KK0SdCSaITZDy5liNhaRbF2OzdDsbO1iFEyaRIYk0ONSnCq6bCMCYpLc2OcnbCvcDqv1TjpXqXBARG2uGIj10mI/s400/city_night_yoruno_machi.png","c":"建物"},{"t":"夜の歌舞伎町のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh7nZdV_mPA54EGIETVaCvonzsHJA70p-8BRNyj2Zp7rTylI8ft9PGxOFApn6nxG2DAIzAXB6hDdYbXmVejbnlSzuex_GuH2g5NZk0i5TnwHXkbaI0mnDOCyXfjnLLqNWneFPVpIpfaXBKn/s400/city_kabukichou.png","c":"建物"},{"t":"ベランダで洗濯物を干しているイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjS3op2mUF8KjhydHQEJy3-TwaHU9MxrGTrBiP19J2INLOw_6IFw_sVnZUAIcTHr_ryrNZNYhqNHGm5wxGP1orA8wnJ7cuF3zRct2jhzCLJTIHzJ0xwXYdKr_tw4gNqcvQxNRXf6tX-2v-6/s400/sentakumono_veranda.png","c":"建物"},{"t":"庭で洗濯物を干しているイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi4MX9abWVsIF6inzFTjSakFUCZkgySxDHAY3T7kBavePRQldzoEHFmV5qjVkPFGMIsg3MhJ_8Q2sruCuxiV5vEqgusq5CiPHOcp_KhhMbUeNyzWDNh3UJjG0oy41bJsQQFK7rIlm6cmcTO/s400/sentakumono_niwa.png","c":"建物"},{"t":"ガーゴイルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMATFTT9G4y8XAfnjRMYDfa4K8nbpoSXpqFYSQ1KFEjgbWWvUUUzNnKBknz1zNBJ2MwDtrd0PC25nKM-elKn4S3wMCM4XaYF2ntgcve9p-vK6pWu2NBiwEoWcCKiqRq4RgyGvTYDARoTec/s400/thumbnail_fantasy_gargoyle.jpg","c":"建物"},{"t":"マンションのチラシのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi8I-P_c87jJ3-jLwQPoIxMKaRjqMhe_KSO92QZimAq5PK3VpbkNX1r7EnU4kD6Z_AfsPfu-MqIPGu_eLQ0ykZq6c65t2wFpI3tRyuMp6tAgDSJ34HmETxwxTthrupFA2PHqz-JZXRBSL5D/s400/chirashi_mansion.png","c":"建物"},{"t":"携帯ショップのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiXo7_Tt3eo49BeGasiw9wFM9FTbh58X6UNRDGMF0IfmPM3p0kDohryulSjZNtI6d9I_l3WigFgfL-N5aAB-jay4zzLwArrJZm-WslRh2rvF1Cg4STPCjskmRCvLUkpGveaDWoAEVaUuNt-/s400/building_keitai_shop_cellphone.png","c":"建物"},{"t":"煙突掃除のイラスト&#65288;昔&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgxKYduCDlMVjI7OTOBF1a6h2DOfOECZkxvuQRL00MchxV_boLRP86h-xWiG5Um_cemccCGNl0Uf8Y-DtHt2mzFtvaWE_vI9tzgjB-5L4CgoiGS2e-1HNgupGZqJvnhOS5MLD2Fq9X2KIMB/s400/job_entotsu_souji_mukashi.png","c":"建物"},{"t":"煙突掃除のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEinHW7OO7E9oqt8Pf8NOwckY31b9byMeIoavdqKOj9C1CbTJqIVOtkCywzQswlDn8wbVMCozg_5eIbgPl_uetE-qEUI-QzoE4vuMSMJJAC4MDXw_WBwL-VPt3u1vGAorjDPfntM3OYvEM-1/s400/job_entotsu_souji.png","c":"建物"},{"t":"雨量観測所のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEihnXp7-lrIovfb5usz_cjUipjJKU93w64L7Z3htgqvNH7C5nKJem2OjxU7ZwyyJ0jIEzVjkf4hHCb9GGMNLH2q96lldZ4h5C51B9rVBQLWLJYbETIlNaLC64MpY-JgsJSneCcHke05zc1l/s400/building_kisyou_uryou_kansokujo.png","c":"建物"},{"t":"花粉のお知らせをする杉のキャラクター","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcYRJUAm2sdC6kxriAdgS7ECo8GkRykkFOnN-1qQqy8wbzoLtU3aOgVdFxdkNJxPWOUzkzIFuAJW3K7lj65ch7Tr5kpqUm3RoxiPSGUz3MepRjdBbCXK_8x9OLmt-f9q9IZOsjVTRMXOdiwHMnuoa7w-_hg8Y_yN1yCOoF82STPDNjXJQMNZeWlji-tLqm/s400/sugi_character_peak.png","c":"天気"},{"t":"ナミのイラスト&#65288;ONE PIECE&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgtRfZsghuLTIyRzywbowxR_q3dtXJn33kub2lS7_pDSVeNlHKveWnsHjGOikcQlg6pgZT63i43SgAcJosU2mES_ZKK-f6G9qWvDViXOtBiDRMEDjQJOGghw-ZSUFYXZ1P01l5ZN0gkANI-/s400/onepiece03_nami.png","c":"天気"},{"t":"上から見た台風のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4czq6w3qUsBZ5P3tTlubobuDB_3-EvdtWpign4bNAJ_Onl3Liw8XW8D-prrG_iyBN-RMBa9Ybnn1F73ttMqtImaLhljwiX0T9pPZCQvLvH5xuzqitNKcXnWXGwXsTg0fJdqHywgNKJyYi/s400/taifuu_top.png","c":"天気"},{"t":"河川カメラのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhtEGpbaXvoPyd998QTYA0Bb-fCFi_4DEanbpIB4RSoApek0xWeSXgzFlD-3AXt0MCGUbNeMUUCeU4hVHhZ57XS26CS5dnN4DXZ0pjjuDwEi3fYT7n4u6BRWhZpnaWNcNGsAVIMpXjUcMVl/s400/jiko_river_kasen_camera.png","c":"天気"},{"t":"傘をさして歩く学生のイラスト&#65288;ブレザー&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhOr5YR7mwLzaslHpZwCOVdd9_xwqL6ToJGfH2oz4QinocKaM_3c1hrXEGwXgXV3k8eB5fJf-5WiNqgq2jluGoSpwbjGbifnm777Q3545CzeRa8BtIDLdHIikOJwiCmp4ivtrnvbeQ-R7li/s400/thumbnail_walking_rain_blazer.jpg","c":"天気"},{"t":"傘をさして歩く学生のイラスト&#65288;学ラン&#12539;セーラー服&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQ6e3FTXrJ3H-7_i17RhKwnw0ZU5dFYcub3zvedmx4tbmHqLqTvEHK67oE2XpSxH2J93mOnPRfxA3y9CY1izjsId2f9fj6cJUHY33bfo09mfv8IfkMxPyL3d9yaspGyAfDcHp7KJaQ1ygx/s400/thumbnail_walking_rain_gakuran_sailor.jpg","c":"天気"},{"t":"傘をさして歩く会社員のイラスト&#65288;スーツ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhJoybPEwOsCWbITOjCYsHEiu1NPlvLLuA8yK9ereNMOILnFMTPaokps9SIOIFydxYaryoOeyhEc3JgibIaWtJE1Ps-7oJ0psfdqgBQHhDNHSbfSUkRywq8Lj4ZgQtq30FNAvq-MqY7wOmf/s400/walking_rain_business.jpg","c":"天気"},{"t":"傘をさして歩く学生のイラスト&#65288;小学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiKG4X-fYzhT_PMy9qUumJfvNpo72aOCzUcuZJeR20UgJZiq1RERKTq2so0MF6_Z2is0MawRoHQdwqIVHXb3h0nlL0L21L3IVvbwkLrCj8FHsL91wCYp16C7jfkrVcQcHApFnH3hpMXYNTU/s400/walking_rain_school.jpg","c":"天気"},{"t":"傘をさして歩く人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgmcXhh6XHa197EMo30cnjTadKmdVpw8ElKxo8CaAGd6zBuYXKfsTrxxhyphenhyphenf_zZSdi0YP6LEo_3fsssN4lvd712o1osUP9VQ3oB5FCo125y0HQfm381eNmX8BBJskyz9jjSSIInxIELm_bX/s400/thumbnail_walking_rain.jpg","c":"天気"},{"t":"水位観測所のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgKhUiAnTYSmncqkVKWmuOz013AN9TOzRdP9UVyIVcN6Mv1rg2Izoz6WYYi2ENfEnh5WqsFdLHForilZzsHUqLG4ij-OM3irZVwqwEYHtNBrM-bEK6MrYBf0VouBahebNYoBhLJFOp_CtkW/s400/building_kisyou_suii_kansokujo.png","c":"天気"},{"t":"水辺に近寄らないのマーク","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6MPpnMoRKJk1Y8IMA2womC5yKTSHMgNcEZJqb1V6Prs6wmGjuDXqBaj4O2SMoonNIHmaba28AQb7IxX18FkeSii0jUTfMEekvW7ru6Kg4CJ1ptay_0sYFFE5VulhbqldVgDuXp5s6sLxn/s400/kinshi_mark_umibe.png","c":"天気"},{"t":"寒さで凍ったタオルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjj-zcbnItigrG5rOmUiw-M4AKxQdFGbhAcEZDJT_FwPefnDbTuf7OUqh5GVxyM4W87sPagRZlL-A-uYbZsgCGx6M7drfn49mEAnY1XEZs7xP5f9XWPXJWzDFNym3PIg-EycILQJ_8rGlxu/s400/winter_towel_freeze.png","c":"天気"},{"t":"冬にタオルを回す人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhHFBWJkH9cDvAhoNC7n8JJcxWPKqHAnykLsRfGtbwDn49Rt48Bii1R9tuh9xNKy0iTiqgHcurHl0HOQeOxjytKC_I9_syopZtI9mOu3JDwZUiuBVZb83kOdfFMChyVVBJxqwLVHQNrNsio/s400/winter_towel_kaiten.png","c":"天気"},{"t":"天気雨のイラスト&#65288;背景素材&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj1s019mqsGCpbMn9UUQHfukGqyC9tw0tdl0HKmsWJL7fMGM0ozpc6_WyAaw3Ann6DZSlycw3xGyAEnBoprL4Vxbaqt80VmVUxPJYkmn_i-iQxqQsV3moeZhoAYp5uGoWoNOrS5RkZ93qQ-/s400/bg_tenki_ame.jpg","c":"天気"},{"t":"日食グラスをかける人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTLzAOJHZgSG8Kjtmhd8QS8iYMzESqfa1Z2WJ0cBnC455UwOBEw8Fq-ltUTgHpUVuCIfRu_JMrklr8QEouxsRL097Dqd8nIFDOCtPGNWsvVfqnxBMIwcyTir33DW4okDVxJedB01tAbA5n/s400/space_nissyoku_glass_man.png","c":"天気"},{"t":"日食グラスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQB2pGnE3wybnKruGeZH1rgjbcxBY5aw03_WKY_fgVtosz347_Us6TqbckUVS9t3ePR5v6KYZXtmJTv9eyBDrW_aCDaSdhzgJSSaDidd5XMOlw3OAYj9fl8U6F8IioqrvQQD6_Scm1efEq/s400/space_nissyoku_glass.png","c":"天気"},{"t":"日食のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhK3UGDdJXROTki0Jiw5nS6PUuRK8IM8gJbnS8U2yd8zC4ELiAxT8jLEuSOT-MNOfq-qyQnanxolxVWfNqOunmqIqeSgUUWRwtvqIxLpDqvMYVjrmHUw41o1RrkJWl5Tihc-8NwTLHDHhw/s400/space_nissyoku.png","c":"天気"},{"t":"水たまりのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgF-_NptLq1d5D0PU_rrFvJHIouExd6vN1YDUeE-_v06KF8_VeEmdOBYUWYEBvJxuC9oCQhm9v_JDV7ZCBALHi-_v4bkr6W5aGe7AvllUcEh5OeED4UMIP-DWzG70apPbPInyZbcvfk0QQ5/s400/thumbnail_mizutamari.jpg","c":"天気"},{"t":"晴れ男のイラスト&#65288;天気&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgve0MrJS7A1bOn8f4rNhbU29O4JhZUbglCTIb0iiUSM4h-AUStwnMAM_zkDq9rF3baCkiMMMRvMmxH5bjhcd5UcG69JTNd63oVQw0AukCklkzvB2PPpP0VUwSt-aoao8bV50sw4es6TCwi/s400/tenki_hare_otoko.png","c":"天気"},{"t":"晴れ女のイラスト&#65288;天気&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYuQb80xRmlVLIbEqlhVQ_yH2Dfwq2LDH3i522c0nqJAVJcPCUo0qTDxEdgpGTKtY_GNKCZaj1M2zR915IcyY1nmsVvPEnGbIr95IPMoUZcvRH7zc_VQ7NYW6giUXG54np4-sZ4uZsyxO5/s400/tenki_hare_onna.png","c":"天気"},{"t":"雨男のイラスト&#65288;天気&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_K_Ce-ZDtdHdhqQ2YbPVKH1S_ceFl1WeiCe6PZ3AQyrbJf4zyy8qaUfNTKJlVU-0vyViUhE6mV0Ox4C6aw4JoBUC4t64M1aW5ZUgkvT-Rgss0pvqlsrRfoQDFEwtVJWeHV7zd3YYBLCkV/s400/tenki_ame_otoko.png","c":"天気"},{"t":"雨女のイラスト&#65288;天気&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjgixoJtfxSgrkY2EZaaKnUG7mlqr9ihN2qJGChE6h2LUGEtZlRe8efHId5zKrdaxsC1wMQgOrB1KwksavS8n_Ml85LlkynYj5Ikdotlxb3prE-cG86DMKTLDrOnzrIKJF4USAoEdXnidXU/s400/tenki_ame_onnna.png","c":"天気"},{"t":"ファフロッキーズ現象のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFEO0bGYU131wtZnEZ2307rbQDbbB7Q7MzZ2gFnNKOeTcaU_2xOoltX6Gbe4iCPLIkzh1haPPSiZhgiF3GSBFUxsjJ5HmGMc_2h_sIUxATZX170o5W9_JFP_oyNrl_-j74SaV9mgNb6Bfl/s400/tenki_fafrotskies_gensyou.png","c":"天気"},{"t":"&#12300;雨天決行&#12301;のイラスト文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgt5mJe-OkLbUaHmQZVAj573kM92gt54xlZE7VlU2FFnsr-CAaBs9MAKDdvBXA6my0dzzwcnv8hxYsE2UjunuBeW9BZ_vvMY_venXS5uwAMVHCdstqokxMPh1KGMsGPoHPadc0SZLzNwggc/s400/text_rain_utenkekkou.png","c":"天気"},{"t":"&#12300;雨天中止&#12301;のイラスト文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjkxYM_TON-x66A2I3966QNoc6yXEdSbOtXdrBM_dMlLvAWrLxQ0P_Ww-ZJqucQOvzzlHwt3XUez8BtEzlM4PZBzx_K6Kf5YpdJ_g9f63WakS14711fuiLLb9fGcdi5P5f-6olpKdvXYoS6/s400/text_rain_utenchuushi.png","c":"天気"},{"t":"気象観測気球のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjIcThHd_YX_UIJDL6EBOg1Gdg_9Nb9qkeSNTINjXGEQe40YI5LTDdxS_5hyNIWpQ6rp6zbu1a6f3Dvwm9-lBs_UbIi7NbxaCwA-nNwjr4-QzuJ51tArSp9fMD_8yS8ey1toDU9tN08Hhir/s400/tenki_kansoku_kikyuu.png","c":"天気"},{"t":"馬の兄弟のイラスト&#65288;午年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgZ7DZDIBOW0AKDmvOUBF0EykJTmdH8SLr2ltbm7t-kvzZ-p_1PoCiQ8OqnbYC0zFKaaIcWkDlZT_Roo_g4B92OZ5aw2eE8vljxIJ_dv6oIGzlPAevxysppSwoHMBlu8Uh0D_D4RCSauXkuYNlc28OVv6-5lBgufutwH4qG3NyJ9ealWjT4sCPYhDZLwyTB/s400/eto_tatsu_kamifubuki.png","c":"家族"},{"t":"馬の家族のイラスト&#65288;午年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhI74hwiea663HzletldjF26pTvrWedcbcmGBOWXysgbwDxAlCLXt_0Eulye7GpvCSwzyCwE4vW1lJGMQNxGQ5o3In1HxDaKEm7t11ZQ_8E2MKLGrpHIvknzYxhN0nAXKWCebvlO6YHRSmD4NZ9HRPLt8Tm0CTj4MV0v3uTLr7u2bhktrBT3rGC63JJW3C3/s400/eto_uma_family.png","c":"家族"},{"t":"肩車をする馬の家族のイラスト&#65288;午年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnAN3JV2sHuoHMH6ELScbPVwTCeFMOmWCPX8C97VNy9ji4xy9101BJyJc425lZ7h6BAgXZLsNGDwVtO7ocFom-JbvKpnZTES1DrWA4iZoiuVWuE20zsZJTydKc4yoqjUHBjjEjf_kGoY1jzezMMfCZlNsSbwFUq1iUhwCkl4dyksnzSSsib14kYfa9yjN1/s400/eto_uma_kataguruma.png","c":"家族"},{"t":"助けを求めるシグナルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiJOHRPK7cz1ZVFw4B_iwkVQLBPdvbIGb7skMzxTVp6gf1_gryZQZdlEs7ALAtBH1HNEQYysuElO92cYUXBkBTJzQwLDvqfYq41e4gxAej_3gHXBYJzewEGMit6QgMlaYXe86jx7ba-K-ZxzPG8Hg5l3FGXnyS49pXIF4Aje6uWKMAt2z8ecvs5uQ3oih5x/s400/thumbnail_hand_signal_for_help.jpg","c":"家族"},{"t":"ヘビの家族のイラスト&#65288;干支&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbV0oZNNrGaYN9RO31DaLxcx48gGc3rjykdwgxvAw1mGYrbNvhGzw3fFexGply6SD0vq5-h-Y8zbxy_-_tz4JeWUQqkklOV6_YusSQ6s-NGBGkkSsCl7jWJCmsi_sS3rVUe3K49Nlvimk-aLhtiZiGU3bZmjBIrIS2rSmp6usEZaYokXsbF4Ou1so8RZ03/s400/eto_hebi_family.png","c":"家族"},{"t":"重なったヘビの家族のイラスト&#65288;干支&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbBXrGI0q4JBep9HMlAMD_Tu3GrJhTAG1k9kr0sqYnSO9Xwd33m0dIKvvymnNwGoYHjlXD-iidjTBgDiTHQKxAlc8iXYMdtiGCsSXiYEyIrbbyR52-JdaeBBInU7N3UUNF2s_DhyphenhyphentV8U0luhndikOsi2KwGZSj0IDlBZ7V7TP40reaytMRMmQiNom1BuRk/s400/eto_hebi_kataguruma.png","c":"家族"},{"t":"龍の家族のイラスト&#65288;辰年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg3f2pDtcY9oC6inlvDtjPTK1dZDUO_To6iacNmsF8mhsH7mzx1Q7PIcregCab_k0d84U5JJCDmxBse1MsVmHbUvl1nrkyWWUN0lJRdPxTAKDdGkKaVpm3ucTm0nfvjqo7jm0gd-nV7Xtwbkyd9kOZ_XCr-CMQeTWEDSsSafSioHKxRpAFWiUGIuEpYwGYW/s400/eto_tatsu_family.png","c":"家族"},{"t":"龍の兄弟のイラスト&#65288;辰年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi-ZBHaiIZFUoWZg4ZlmV1OcCGL4szJ29ryf9ZLrdWSr3hgHARTT2F6Ai8uQi9VqvCcj2WrL_5DtZts6xLeeXXbw3XFFyLbKXb2yq5-6raVSLa5JzVxOlPKB6zeRlDVVSoMs8_0RTO8GQC6BmqAPPKIE1lvjpdU9GpSS7_ODjjUX_uyLZSlDASXLTEWvkHi/s400/eto_tatsu_kamifubuki.png","c":"家族"},{"t":"肩車をする龍の家族のイラスト&#65288;辰年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjKY2tOQXPlJtmb4dqVeueFJhJ293-9k5h_lKG4aPnsKGMwhbovyxU8wQ10WyfAEpomZh2h30yYIVGm5shnvAhJMa2EdplyJERvRcHaTohMW3L-uQLXSlYqCqT5SZbUD85-6DwhmkT-pC2aaz3weDgxWGxkBBVOrpefF8OlxOAPju0komptUEnv_LyWihM5/s400/eto_tatsu_kataguruma.png","c":"家族"},{"t":"走るウサギの家族のイラスト&#65288;卯年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi0mNO46qR_KoF5fFxQ5LvpSPyUzG0WIvXuW3nREyW5x5dQpblfZhUTXYjqVayWoMSydDmVZL5TWVz-d2bcPg-WbOnxNC3Uay2zMqgcvwuIxypk5Hx5E3MM85gS0SOVcDmIuSnqjAFlcH_boxSj09RTt0yOYLoL7ab6omHWKue7bQXNuQkydSR2r8ZaqQ/s400/eto_usagi_family.png","c":"家族"},{"t":"肩車をするウサギの家族のイラスト&#65288;卯年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj4pF1RPS65fKnDayvu8ucOWrXGRXyCtDTVFTMRKNX1NoYgpbx-j7f2rTbSKuG1QfRgO3AvvxdWH-NyJLE1w_LGwJY0sYR3ooDWEiMfH9phU7UTszpjC4tKt2o2LDzjAzIuisaLB8Szuhuddfo1lqlAXl_UW9GCrhuAyHaR8VGyFMtvN2iQvvZrQqyQOw/s400/eto_usagi_kataguruma.png","c":"家族"},{"t":"虫取りをする人のイラスト&#65288;親子&#12539;長袖&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi_ZPrgJmyCOX93kUpNNS0OPsKCTBZ8QHIh_tM6AKlnqPtqbWKIf5c4ySVVxYg-xSk-8YlRmM3a_g5rhc1U1pZ5s85w8_FMJ6vNHBPG-iIhCGLbM8vr4SbdshoKm-iZNDp_7nv8mAE8RItB0bNPhiO-TeYp-1q0kCCN4DAAtr-FXXMdtaVPxpW11ihLJw/s400/thumbnail_long_mushitori_oyako.jpg","c":"家族"},{"t":"電動アシスト自転車で坂道を登るお父さんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQ_WjEFRmqXUoAqh344Q69hJWG8V_zM-9lDVh_iiumeSgmzo3skneo3gv21JB-D9kUxyKdI3ccQIbcwVnMyUCXDmUXyp7fTsCjz3hrWMGkuyFS3g6GKgDMcR2zkx0I3VhwLD6Jrsu8hqgS/s400/jintesya_papa_dendou_sakamichi.png","c":"家族"},{"t":"電動自転車で3人乗りするお父さんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6ZNtzo3MbPW5OkKXkD-tliX2CTkMEQpVBiwb6LocZF1MjaNP3Sm7rY7Uh1xfECAYojFT_FpsHZ7Nr7nshNqep8gfZQARoW5mJIswuIwa2AJxaIEiq87W76EVf3PyR160x9XCWM1P0bgyX/s400/jitensya_papa_3nin_dendo.png","c":"家族"},{"t":"大変そうに3人乗りするお父さんのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjnym9HJ6ZwAFXGrCXyNuPWJXApwVDpMCxsCii_IQYKjPoVkU1U7u58gZdX6hPNygEOZkHVLK1iXHTZf66BiLYB1fzTE0RzamYaasKrGw0Abe56jMz-rksfZsBin9gmM42Kqo0YPYcO4K34/s400/jitensya_papa_3nin_taihen.png","c":"家族"},{"t":"3人乗りするお父さんと子供達のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhhuTPpp1ITtm1efWPA5Ke1V1uWz7-9lniIP0goxnFNgPlaiA33A6K_fX8bpQ8VGroVmrgkQl5pzfRZbwZNGXEAXnMvT3WIPOagILsEfLWOKkOv6jdmRwNCliI2XX9NiFoqLygN4_VNxFx2/s400/jitensya_papa_3nin2.png","c":"家族"},{"t":"2人乗りするお父さんと子供達のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6itj8pvxQFVKU4BAIBkLrLju6_vzGSZUgAbhg9GQEuto1hwloLCa1Im0vaQO8Bmm8GuWxhGKY_pgGNHfZ6I4ngWjjb1rTyyPIIn57Dyqko0HFrQDRvr9XeMHtaXByu0j1Q21awvQa0MqF/s400/jitensya_papa_2ri.png","c":"家族"},{"t":"走る虎の家族のイラスト&#65288;寅年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgqrzUTiuix_yznbYlSOEgfrajhYUHQPaAu2DAD4hJ0ykZGkpIFCWZADO8vH8a9OggNgZX6J7b5889hVp786u2k_gvZLlh7wEhwpY-9fxCIxdTAnbGam5xtAhz8uMGKyIlg2RTil9w7fI28/s400/eto_tora_family.png","c":"家族"},{"t":"肩車をする虎の家族のイラスト&#65288;寅年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpQ9p99k12DE24pMfVp6gzZ9u8d89smeuGRuBzZZ31Mmv4y3t-xLvxD2ApRyhP6E73dZ5xGPDeVXJ0vTZKM3al3WlEHYNEZEsP7Twb5GSuCR4iK5y9G1S6WmvcHx7xoiMK664D5WkyLc2E/s400/eto_tora_kataguruma.png","c":"家族"},{"t":"つみたてNISAのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi0qQ1hmEaVZjzlyBPOWL4jkE9rCa5nngM1-qaggQCDWnBf_Vfjs8YSI6hAQTEfYhbQ-cjnNVGi0Zey3S97FeIGN1zRMt9lVNJfyrFo68-ZhFwvZx9YjBFo8eG0UgYrAu1oh1zMjXCP3DHF/s400/money_title_nisa_tsumitate.png","c":"家族"},{"t":"時差ボケのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaWeRNB7A5prBNzWv3xn1XiYmKm9-mw5LRQLEuonYLVBeI4FBuiRrzh5ZaDvBV_-3Gc9SZz0Ux-uZZM5mn-Jc_Nvp8_1PS9vU5IL6pDpgcT5uaLhyphenhyphenB5ABD2ejHimtVM67pgS8HfvvUKp1x/s400/travel_jisaboke_family.png","c":"家族"},{"t":"子守唄のイラスト&#65288;お父さん&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaJLs3-VYaNbTD5MxxvxhtNAtuidoebW0cXc2IQMJHYEInbLMzkYwT0poDPDU7sqywYrMPjUQ2OBdkAMthNWigOKO4xyF2igsaC3ibqOPYJ3C7ddPiKtCZ1nfK5ISNpuoeH02-hRnjs24_/s400/baby_komoriuta_papa.png","c":"家族"},{"t":"マスクを付けてお参りする家族のイラスト&#65288;私服&#12539;バラバラ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdJh6HHFgbjpHAK1cQqLLuo9Dv25Gi_NWmlEMGZYwAUBG07dw8KPT9Vhpgc2tdT-nwzX7PtBtjC4Eo3luQjL5nBrhz0le2Y0nV1nAuF3y1QJ70D5vQ5ivwznGEMXlDr83KowRInYYozBIt/s400/thumbnail_omairi_mask.jpg.","c":"家族"},{"t":"マスクを付けてお参りする家族のイラスト&#65288;私服&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhwshllaHhOjcO15q1vJW8CcbcGrw6OjCu74X9XdaUi61QkH0cMAi3yvWReXDSnM5NZO85jJiD9y2mzjKMjveMXigXLxyjJRm_P2nWX5O1lMGyvHnRdkk9k10pshw6Zzd50Idrr-MJhg14Q/s400/thumbnail_omairi_mask_family.jpg.","c":"家族"},{"t":"マスクを付けてお参りする家族のイラスト&#65288;バラバラ&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgn8H86eMs1uFIcTThngEKiDqNgnsMwqtfHvIvbDRcCHwKkWanXrC6jWDV50tpBwoVDakeq2704OFTV-oyk0LOAuxByoG0DCjzusyM2Pr60bbI1Bz2RZTZbDoNO3NKyyP9P87iZWyV77aKi/s400/thumbnail_omairi_mask_kimono.jpg.","c":"家族"},{"t":"マスクを付けてお参りする家族のイラスト&#65288;セット&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhaSoUrDiBP6CCb4-qcpzHIFkEhjSaRyWUZi-g4LFa9l2qFOZxapH2e_S3GvOuT_MfztLHAeYmvi6teBbxTWKTH4-A4-QQ_Zsdvk5BKB9BlG3lZJuRSpnya24mlJa_BPQ-1tJihta3Fbf26/s400/thumbnail_omairi_mask_kimono_family.jpg.","c":"家族"},{"t":"相談&#12539;説明のイラスト&#65288;女性相談員&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgUZd90iGqZHgZ5JDtzSTtAx9muL3YMR0N8NutCqulWLg7RfalXmeYu-jeSrGelB1snd2jBYhzbUw5B5bPiAnV7t96hKjiqizmPkwty05B2Qc24jkZxsfix-N0GUXJixJ4RknFMUElkHKj-/s400/soudan_setsumei_business_woman.png","c":"家族"},{"t":"防災グッズを確認する家族のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEikFYhhNwSIkPtJRIr8xod-cFUkckSgiCD-LsGio0i9xGR7tfxSKAag7lBKJlOOMFCrIsegNvYYnbXx-c0O7GoFR8wNe6o_LRRlzOpXTl3hVzQ6KmDiUqBlZSmWcRGjrV9xG8zpEP-c32gu/s400/saigai_mochidashi_bag_kakunin_family.png","c":"家族"},{"t":"肩車をする牛の家族のイラスト&#65288;丑年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEheO4w5Yg0T4GGFH0x7NeQVEWVNDDdnMkvcCE6alTo1WzhZ4CnOTo8m6H7bSDcw7JK6qIeFryhoVg-x7OtYYCQKsB2eI_Haj7FcQgf-BGbAezO6PHfyPX23_ZBJeJWTlLIp_bbtnOmUBQBe/s400/eto_ushi_kataguruma.png","c":"家族"},{"t":"牛の兄弟のイラスト&#65288;丑年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjepfYs_NlvZqnn9-ConhCzPosZRwpD_J7G0rF7fHk1E7K9yRVm-vsxNhkcERccq6D4HW6c6Izx6zGIw2052QBdshyphenhyphenLKNWBxf0yOy2h_3BpqBmvY1aqmlsmkUap7Wq3PtnA0AOPByoNIQpc/s400/eto_ushi_kamifubuki.png","c":"家族"},{"t":"牛の家族のイラスト&#65288;丑年&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgAnF_rxc81a9qbkCIWKsiH6vH_BglTrMCuBo0d9tcVNL9lG_Fc7M87kCCz3gUvltm7Rmzd0DRvJ77HJo3d2nF2y1sm1K40BJZRR2SXeloFnSoH63_gfp8tUFQT061EJ5ofgpfQzTSZn-Be/s400/eto_ushi_family.png","c":"家族"},{"t":"&#12300;かわいい子には旅をさせよ&#12301;のイラスト&#65288;女の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgQfqPMfUWEtNAEZ-carJT4E2uEBrXw2uaReGyWo_-lBfheFIwmj1EzK-hnTf_L434f_eBjOm9q4673Ja68yA0RtqnwJaFCO6AhLnB-K7MxGx_7fmlmTMaT3fNzEcbyVOyN_RdM0aagRaNr/s400/kotowaza_kawaiiko_tabi_girl.png","c":"家族"},{"t":"&#12300;かわいい子には旅をさせよ&#12301;のイラスト&#65288;男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiARzSNw-LG8cA22YNvLxaAmbPQd1uYtIpRvGa-MgTLxcJSfh9im8N-ZimfpKMF-XIFcPu4wqRGny0fK42hM1FwnJel-p6lKMbvPzrgsQ_X1B-KY8AVVlLyBX8_ZeE1UsXqLPo0DdzKlH4w/s400/kotowaza_kawaiiko_tabi_boy.png","c":"家族"},{"t":"フレネミーのイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi6rCArdsNsb_RsVMxNJQQTVuwkqOPI_-ugAg1ZTw8r-2cg8rMSoxh2wIpu4QXe1KtGPPLSb28STbI1fOGfKF1Xel-XbDfWKh5on4GObv86dQH7NETwvywk58sfRkvKRT6qnVv9EPNQmeEBgK7izclmHjI2akjHEj2QV_vjxHeR55HTdCLK3sSxbwn4EDt7/s400/friends_frienemy_woman.png","c":"学校"},{"t":"フレネミーのイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg3TfbA6HSLNp95X4QgYd7AxAK9C1NsNOE7v1dOzYV7GPGkq4m-tqtaQ8Dl-WgRtgkw3AI0HUbiDrSzYxfAcEEpbby998Qm_PFDJJsAOZJjjJ_emYT_SnrbLa0MujNM3FIEH6_SzNjbzidGMgROxrLY17SUjPmMSmrut9njmKqcnKWEbr-6UZQpGsYaBp8e/s400/friends_frienemy_man.png","c":"学校"},{"t":"いろいろなお布団に埋もれる人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQyiwRrtdXlcemqV-sVXyiNTu5ld1g2DSjCBrE9SBcKhRkTPi-tqZcWUVIEACAkbAJ1IyO_BDMg6dcfCrj0R7oDEmmm0l1mUbkCeYb7cOMa-pEKKTYI9OKtQCB3-Jvh33sqeADFcJhtByeum5gz1PYl_WeblBxwQu1PkA7UUagau1seSeE-3GDSOI_jo4I/s400/thumbnail_sleep_ofuton_dive.jpg","c":"学校"},{"t":"やる気に満ちた小学生の女の子のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjajaaUfv2mgXcRHaohkf1_-EBB6LMvBbhZ-M69ED8ADIDqJh9Kl2kSnLYKkBmcLPpo1ZVIUs3R5-zJBM4PcRwT9RDU31J5fEN5X4B5wuAA4n5KiS5-ArYOws7MwxCazdVmCBTbOg4lGxgPEqbx_vhsCmmlZrYpCTIjJDCjp5lepSA8QB1bMiZYITKexRSG/s400/genki_pose_schoolgirl.png","c":"学校"},{"t":"やる気に満ちた小学生の男の子のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhYfcZJYeC7UfwWM60-5LqIJ3XIc9qutvSFAQxyXmsBEUiuICCSlr0fPb-VFB1gC-WglMkIEwiIBXIvFlQiAxwBfXSqDd3B1CHEL_lhicXfZvnxDjiSxSWoBFoj8ISL5c78WbABA0PeY5EneBQTgMWCuTtDc6lhuv99Twcm_jz1BskZCY0nhtu_hWtAUoBx/s400/genki_pose_schoolboy.png","c":"学校"},{"t":"ほっぺハートのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiPz936DPLjBT11FxCGKXrA45UPuNvGINDy-cmq9-IAQ3gHisCphf9sHu_zYmYCon0DcC_CDCBj7PTcojyEtl-4SEI8EsTiYF4lQbe2zjBQfYz2J2nphc0ge_juZDb1aQ1SmpuowGsvSY76qzlOcTEkps8_jW5hcgOycBQZlQjNfepnFYb7Ux0UoxTw89wT/s400/pose_hoppe_heart_schoolgirl.png","c":"学校"},{"t":"ギャルピースのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg48GxlSXF_4b4XZmtOALPhe3mD5iREyN-Ks6Q2hdviWeDHOcG_AUOS3nn2i-E9g5jD1_7-2o9PZF5MUQEanceM7b07viAr9M6h4C7jDqGhKdF0LzHzn2IBS_A2Fvpv605wIRf9ohIPiv-HStNDjk8JdN2hU-0GTI-OsjRraMo1HnGkTALf6v7qBbHufj04/s400/pose_galpeace_schoolgirl.png","c":"学校"},{"t":"ルーズソックスを履いた高校生のイラスト","u":"https://blogger.googleusercontent.com/img/a/AVvXsEhtV9bzdCNOmKXoHWDwQbaowMgUl41qThLIuJ1iovwB3Ze1Q-4gzefZg9_UuljK80fs__ueu98ye2b5LrBfxWyUqUwO3yhaB5yipzBDzPtSoA2muKhhbeeNWjewzPfLpMm_ajY0OZ5zvJojGpZnVEdFBJO7ZXhRzTH8DXwGqTPPJHjFrDrbxpL5HL8rnA=s72-c","c":"学校"},{"t":"教科書が入った赤いランドセルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYRfxxDMmFdYUmHwcR7v-HsD-52h-mrf74wGysfr_Vcl_B7BfqArKS-_FVGo7Jn6qn8GllukOWgXD7fICuuyadvpqt3MaLkKYx__MZN-xN11OXYAmyd0K7-Zn42gEEgPljm22AWDA8sEaH/s400/school_randoseru_red_open_full.png","c":"学校"},{"t":"空の赤いランドセルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiVB7xvXKmJAy2sruu1Kq19W_0cqOggqm27jrFqmlyIPO7XncH9QWA-afIKChR2Fn5f6bU1u4tOkSO7JLK0zJXetJRMk2RT6eAtdZYwYMMukHN9A2TCeeimh50fKTzzpO1USbLClG3mr4HU/s400/school_randoseru_red_open.png","c":"学校"},{"t":"コンピューターを使いこなす子供のイラスト&#65288;男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi52RbA-MP8y_gg_uoJuWBpA6vir71rcwcpWUqovWtcx1-pPhQcoFvs-hwQYDkCVEF56KQjVokidAa8-YCYh0jTJzNOls8keTOG7PuzQY9BdHI4jcigcH4PD8SlOrJXTmlV3TvqC02JuLfe/s400/computer_tokui_boy.png","c":"学校"},{"t":"テーブルを拭く人のイラスト&#65288;女子学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEge4-oDLmpiBbB8SP4aMZ31s-bsBz-DwYEjlhrcD9jp-CEAFJuUkbap-tiaobq-Lsvu2I598hHX1BcVp7pi4Nmn1hk7gqJHZWAeNnFJ5A005GWjYg66EFK6VLIDrDrs33cBvpRYwj1oaI6-/s400/souji_table_fuku_schoolgirl.png","c":"学校"},{"t":"テーブルを拭く人のイラスト&#65288;男子学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgVo0ez7ZKTVcENc1oZ0ekZdRi9EWviMFnYRG19wUrZ0dXkgXNKvZ4JKqKBgUpT5L68UUoN2AlBWOQERMBLgGBMB5BGL4pVpjPc67SgFn342s0n6l36WhQ6julkHTqK1PLRP0TLBSVGbpS8/s400/souji_table_fuku_schoolboy.png","c":"学校"},{"t":"女子学生のお辞儀のイラスト&#65288;会釈&#12539;敬礼&#12539;最敬礼&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiWBmrk3976uCAVv5VS-1NLbmE41uaZW6Gm0l0GZRqDoT8c-VkVorFABqDr8hKtZZsV1KXXdrPL14Jj17LbB0D5IlQ1f5qWw8myx5Eqms1qOWUeCCRgnM1eVmGfCFnLUYQSMndezFa_UgyL/s400/thumbnail_ojigi_girl.jpg.","c":"学校"},{"t":"男子学生のお辞儀のイラスト&#65288;会釈&#12539;敬礼&#12539;最敬礼&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgQl2-mry5oIuQCrvyXvw3xG6v7VzwosypsGkrNAJjeioXhBnlBLuj44RR3v6CdvnQk3dNn45ldGEYuyZmvwElx4tAC1EGcZ1spIEyZRxclp3X_igCpcFse7Womb8uFTaqnEAB1jEKj8ia8/s400/thumbnail_ojigi_boy.jpg.","c":"学校"},{"t":"鼻の検査のイラスト&#65288;体操着の男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg6JktpLgrL79uphgxp_cu5IbWYiZXXHXxen1HuP1I1gMRDy9W6a6tPMRvSJ7OkNEoHCaASLl1u-aXDZm2oXUeeqFtDnlN5H-7qn9ClkwG2ZZsKv1cpREuRA9_wp13YdVMUTwT8SLwW3qou/s400/kenkoushindan_hana_taisougi_boy.png","c":"学校"},{"t":"避難訓練の&#12300;おはしも&#12301;のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjfhZ-ooLoqZTvugFs3jtvDr8LOma4NZhbJ4vk87mwSIqdFacDDw-xL-TslTDvda14-QCIXYKHUSnChz3n2ctyWfT3QCyxbgDTfx2TxQUt4DwkZLHjDkg1GT0jBwmrMJfs0VhIc59iiQV9G/s400/thumbnail_okashimo2_ohashimo.jpg.","c":"学校"},{"t":"教科書が入ったランドセルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjBU247NoqsDPhDhII3HOaaQWSToeswDTPKDe4fCjeC4tXGNdBOo-sD6CeiDT5HJeErrJpIcIwLjKhPGIZVf_VRrsy1DuAzzi0Ioq2-P1eGAyjoOqnz1ysjd1F_TFS_jjmVTkmar9q81rrT/s400/school_randoseru_black_open_full.png","c":"学校"},{"t":"空のランドセルのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhdDm7wbStJ4YZAqqGYZAMlxd5aKkzXQEYZkanXjlZAy2pmzG23Y3ZDKK641ZzqoSDkSNodXnHRUcM1872TAjIUUmKw2wn34DqnA9apFlqTvrHlzJkXkXI4-T_0LgTP1lf68lMrGxOqKH-3/s400/school_randoseru_black_open.png","c":"学校"},{"t":"卒論に追われる人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgR317ncXWSVBqbO0phvRnbiXZIBqgxWnaJ_CnAfyJiG9Tfq22p6gereTEoESoaYbyWs0HdKvsxz-vUuwrERtS8jJiX98FuOpFCYAH5CCmBgMYqtyRcx6n5N8Rt_fGfbg4dztnPVOZcw8RE/s400/school_sotsuron_shimekiri_woman.png","c":"学校"},{"t":"卒論に追われる人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg2yzCp1YBxUHlrkM76qv1opgVXYFxvEvXHbbQ8vNvahZ4ywkZMjJ_4gD2Gq6gOECJaw36aNbriCPbdSc1SLGNczERP-GQikUfwpOK4efCS_VgiL45xGwUv5UThLeups68Qd3-7p0rv3GU7/s400/school_sotsuron_shimekiri_man.png","c":"学校"},{"t":"&#12300;英単語&#12301;のイラスト文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghwemJNASJzBiBm3KpgxHkBIp608y68v689wwQy1N5NGuEro59SxqHk9XAvntGJM5HAxzI18WpKuBxyhQi4C65Xx8qC2dg2wZeZFq0HtaEPItbTf7UM23M6ki4l8c108ZBF5C-Golek-kp/s400/school_text_eitango.png","c":"学校"},{"t":"&#12300;自習&#12301;のイラスト文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiEx33JBdqhwM8RfUDlufRGcqlW-smO_IQs6RtUJ5lBOCKp3ca9UvX31sidh8LBL8WJyhn__SRNsW33w0F7gq3ZbmYaHrlW6lLLe5ab-PWOA0MBx4gPprwCsPOwiQJiNYKkMeQ9t9swHoh6/s400/school_text_jisyuu.png","c":"学校"},{"t":"&#12300;漢字&#12301;のイラスト文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhTpuK2IA4iaZ9PwoziOBHuOGYRg6d5nDAILjSPmEdYyC1kpcvVY5pzA3-i9PmV3rJ2VHHdlyDdmOlzGD66Y2jIbXAkBHeXFj0lMGGggJRxD3NA_BRkloPWOheolsVwoy5E6KybiMw368ga/s400/school_text_kanji.png","c":"学校"},{"t":"通学&#12539;通勤のイラスト&#65288;私服&#12539;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjmL3BDadPrqMtxVDNePLrtLNvkkpHKkq8h-ssIyjD48lJnNPKN8jruEeBFfhHXtWwIFfgs31KIeCGGLeH8FKqtYlKdW5mLkmygYWDBoxZdBaEpboQfJgJomx4P4O3tQcnJpJwNijcvyVJS/s400/school_tsuugaku_woman.png","c":"学校"},{"t":"通学&#12539;通勤のイラスト&#65288;私服&#12539;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEif_Px4-kexgDP7-ok2A81Z23LjjLRYdRk3qi-uV5weTN0YXJYQxsoQrn2n47VmRa-IccBPMfqtLayaPD83UQv-BVd14b83nU9tLO8_gaAV_6s3iUHlr1RcnV7F7XPg6kFH38IKqKRIfFsm/s400/school_tsuugaku_man.png","c":"学校"},{"t":"琴を演奏している人のイラスト&#65288;男子学生&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj-bIELJpZi1gS_rbfHcIyDU33eO4D4YeuYo78T_qPR8kCaCm86L4cnJuGgpw82FVHYiXdP4_whso2Y0rEq3_jgd8fiUSiuedeYcgBeN_SPE5zRqux-_K-2Iu3xloAEG4Hf2X6HCk5bBYKC/s400/music_koto_schoolboy.png","c":"学校"},{"t":"皆勤賞のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0Vp6FPb76v40TowPa0vGO0BK7OhdM6aAGBwVkA3dEzK5T0UFlL3OXPYiDXqFn7s-Om5cGlcF0cobah6LRY-sKhogBF3Yw5PAlWjOYgSD4RBykQiHv5LJnxv2uh5xu1hbpHLsdXSdM-b0E/s400/syoujou_kaikinsyou.png","c":"学校"},{"t":"クラスメートに片思いをする女子生徒のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhv0AD74STuoEofjyybt1lctDnVsVSCnTg1lQ4JjX23o5dFYqnltLNmtk0Y61QskwNfpL4pp6zd1_LcbHRsYCyLJLFHDYiT0ARRaqA0LZBmD6VrivperIhkKzeOhp8gswYXsXO4k8dYiR1Y/s400/school_kataomoi_kyoushitsu_girl.png","c":"学校"},{"t":"クラスメートに片思いをする男子生徒のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiAN-l9RpE8EzzIv_0wC6F6TIprFgdqQEtTWQ2iEIxpCMtVLwEBfh3kV0rZIiEQBfsrMh1zw8JLiXKcSOZLFLLu3UW7MykkFy69JYJzmm65PxY8uV7amVfboVK26feb4zTLv7p1t3DZHxRf/s400/school_kataomoi_kyoushitsu_boy.png","c":"学校"},{"t":"壇上で緊張している生徒のイラスト&#65288;女子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhSaVu7-FXJ2ZfYcz4Zq4fvNPFu9r0MDjt2cFeV78jnUd0XE_ygEyKlfMwkafKmCs9B-MYPgUbe5G8w9ZTMqOyss9NGHDuDNop_IY4Nztnn4478Wg709XUm0YhgXJL8tRil9gqFf7VVesHh/s400/school_kokuban_happyou_tenkousei_kinchou_girl.png","c":"学校"},{"t":"壇上で緊張している生徒のイラスト&#65288;男子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjELdeOg1cfDGHBinnz7TyhGGRS-x1Zy80x16rafo2A6YG1W1PG139NXXp6X9FXrT4kXWudiQqxSjaiwNeGnLRbplAVWJM5MD_UygFqCQFIv-ujdONlKRgnzKnlSiLD-9UXiSZl6pqShCx0/s400/school_kokuban_happyou_tenkousei_kinchou_boy.png","c":"学校"},{"t":"桜の木の根のイラスト&#65288;地面なし&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjF_U_pg19DfVrRKts2xV2vMc1vuVhpsjFx0ODPa5Ngc5r14Do12HhW1DAuRLWg0JcZBsZT9cXguC70gVksA4SOXL21-RVlorkw2DfmnopbrgCqxl7s069_wEuv7rR8IuHk1JQHf9ZrMLEg/s400/tree_root_pink_nobg.png","c":"植物"},{"t":"桜の木の根のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiLaF0A87e9nq3s9bucW6BkU4oHs02tQkRPZIh-lR5qLSDw9t8ConqTbu64awWqa4Vd7wRmfOI8I4fNsKnqJ2d8pqUMKrtZh3_SpcB9YVDp2TAorgBG-f9D4XMlFZFTLRmwPMw1OoMhMCgY/s400/tree_root_pink.png","c":"植物"},{"t":"木の根のイラスト&#65288;地面なし&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj22-mR1GoYYRFLkhjiC3P7Ubl1scaswqHRx5UfwKXnYj_aKudfP8heEKZecGrC_sG8VzUJms3r_TUKs1Bl4NLGXn_hLja7yw-rQzxoE13rFercdoFkonFVDPYNXyLVLp4t3Lj-9TJwgXA9/s400/tree_root_green_nobg.png","c":"植物"},{"t":"木の根のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghkjBfc68v9rEYJMnp9Cy1cafuZKmvgPDeyhr1ORHaRV3dWnASELHFb9TAXoVs4JNQXcrZRB2hxrq6XTb-gMY0t91t56GihV9pCTvN6MrcLqS18tTKOTM4HTDhqzKDmwSA4mX_YyD1wPb9/s400/tree_root_green.png","c":"植物"},{"t":"風のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpsd96X7wkkFciGUM-oq_zYxNpzFIPvPkQEwdvt6U5se2BdJpyDGnhJBkNKSJ5IYAzG18c6a-zhUUhEyNp2F7sVR6VEUIPylDPnRTPhiaRHM97AglDo0uUdLAf-fxO21lzLKtXUwNr6uS1/s400/nature_kaze.png","c":"植物"},{"t":"蓮の葉に乗る人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghpzmykJAW6ByDi9dMM-D73Em32ymN0tGRAA_VqFTkBYbMdaneScANBqloh75LPmr0xwQCpJ2evpHh09b8c-HQ0OqcdUHHy12ubksbrgUsS94cm7WzeV2zgDt2VPmoEInzMyA0GF3I_u5H/s400/plant_ooonibasu_girl.png","c":"植物"},{"t":"地層のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjd24g8Mc6rcu279c3M8EyUe1Iypb8EIkTI252mJdYo-jEBPIpZXx3CpXesLUlhm4CoptQRBHR8aVm0sy49JryRpiDw9t3IwGEBqVsTruhwWh3BJpZrUJSofav7YaZ2HVTlYaqX1o1ilbLn/s400/thumbnail_chisou.jpg.","c":"植物"},{"t":"海藻が生えなくなった海のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjFT7RBOprXXOVc9uVTR7isriRtjjnveiBv7DOi0rYnDj3M5juhwdF4FcvLQ9d1b5QPLEViroudv0m4TlZWoWi1zGoolC2CcXEvNR2NFga_t_wMUfD1zy-3q3M0pyJUu1Yl5OVK6QtpZVCb/s400/nature_ocean_isoyake.png","c":"植物"},{"t":"海藻がたくさん生えた海のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLgVl76DFszN44S_Xtv7NTOOeOw7VXWgIDNClxQclntOuco8MJ-yL4OzEZ_wQMB4Fy6fctA0-y5R2_80YimciDtMVjB4pZ5uX7hyLFMVINO-2aoi_JM7msVnDqbQVtn235ra3TS6fz6iXZ/s400/nature_ocean_kaisou.png","c":"植物"},{"t":"葉緑体のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgAN2lzFbtNDccd0xIbTCFpKQQ8eQmmw6bTPNHC2hyA0pAw7_-5YTXVUx93MrVsVnC2UyqewF9xs5kD8Ao2GT_rNI5ArBgZROJncYanwLmVun5UzJ9D71Xp4diuyPgIfciSP98rj2ycxhnQ/s400/plant_youryokutai.png","c":"植物"},{"t":"さざれ石のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg87myxCMm4hZNVHKI11SmDqJNTPYNpX0E9QgZaq57l8Jilwen5k3imugxxO4aMYw7yTsEAt_Fi23iJAFixZte8KkiXWVhCtuyhwdeGr0YZzmzPCbfVqJsABuXT5vbKw1NdUDOQOn0RXg3H/s400/sazare_ishi.png","c":"植物"},{"t":"ホースで水をまく人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEitm66-vOSx2pwj764ss2NG3N_7GxNOmKDn4Y8jEL6559A1rmhyYzUDHsQdgrUYCo5vjnWJ6JlZPnl8Lj5BdNjaV51VBJ3gzYPFnWi6mr1k3zumY4o94zXxhXTHhGPqUAXewGJOLLQ111Ok/s400/thumbnail_hose_mizumaki_woman.jpg","c":"植物"},{"t":"ホースで水をまく人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg-Nr2naBVUma9LnCZjQxf_r4apoGkRuYKQH9Rigcxdo2eKdV9yJhxNzeaLkaCz59_iLnCga4Nr7PdMFZhHVUmQ927lUKrPNLl3O3plglLuCElXg90oezihBRC8GUCK9FAOaysiX8Yg8Zmw/s400/thumbnail_hose_mizumaki_man.jpg","c":"植物"},{"t":"いろいろな枝のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj5uPXrhLidKDHUGOtQH-UZJVjRNS_BxHtUyxlex5HYZpbtR4_aAYfcW8qWLinKJMsYWtkrIqAJTK3ZON4BmpGcm0N02tqj7yibLuYsGxyO1qrfas3Qt5P0kRmh4HkOIKqE3xD0GKt2XxKY/s400/thumbnail_plant_eda.jpg","c":"植物"},{"t":"ポルチーニのイラスト&#65288;茸&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8osLiQx0hn6BDtboncptKhy_8qwff7S2F5-f2Xur2AavGzJ6Pdwdh6QG1Jbk5XNsWGN2PXMWniZMfUli1xWoA-El2lsqCtbsQroHSMIt3twKfqRN7W05UEqZEuAbVcYlqwnD-C1LPEdId/s400/kinoko_porcino_poruchini.png","c":"植物"},{"t":"袋に入った種のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTerYdcOWnjPXCw-tV9C4wrbwONZwX3PsT9QuPPuJFcLa-Vgb1k574JnN9yMD0LWrUMTK4aAAo0B_lI815_nVNXIQEhrTAoUhx2Se9Y4jpY10JPoQug6kCz0BluFlV27jNtkJVo4o8dAyR/s400/tane_fukuro.png","c":"植物"},{"t":"種を植えないように注意するイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjYkkBtvq5GOXyfJ4UJn1Z8wZamgfVHHAF79AWTk1T7m-EwqJECqFRyYWDXIQ7oRlv8_RI8lpZwm7tOwRMvcQvWNkNhRj7asC5v7hujpZ9coMW4AnFxPzfDbneOtpnB6Js5sq7RAtz9DYh1/s400/tane_ueru_ng.png","c":"植物"},{"t":"クラミドモナスのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjYYxrmTlF7ZOPGfgiLhPYVtoj_gyovN7RiWGWKUonnn2sIqgaAGpw-blk0j0DZFm4KRI1WRSSEkB7GueeWKHRMLHYjCFpafNaukIf-lZi7wI0mqc46P48-3ZC65sltDVZXDfTolXQZMwqR/s400/plant_chlamydomonas.png","c":"植物"},{"t":"5つ葉のクローバーのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgKodm8ZVP96TkSZF2NYug4Wb8x1kOI0XHdZTZMgbzKirGbk2O4Q_ZmOZDJXm0CZvGBVsDWwWaBGhjZ1Bqs92VjUK6Dx5xBfNiXc4JPvAJE1MhAZwHNjEpoflUOU4NH-C4T6CJaJbT-VV1P/s400/clover_itsutsuba.png","c":"植物"},{"t":"コケモモのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhCm7KAVhx7N-p50dS2XSbjtBoHBeYPvQdrOZqjqbXT331PQaCYk6Q1j7kUQTx-YnfrBVkxpkINyX7T6vI1lyEWfA_xziUvAA5SGgrKBIBH71C1aqN8YAMAHSs0IFq9c4SldmihC7LPx-fk/s400/plant_kokemomo.png","c":"植物"},{"t":"シロツメクサのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh3mYwrTONp5AYEE-UenSzZOf3P_6TKiNJ3BRFAQOih8c7TM4Gkp6-ldi3sFslP0SAPmclmVwgVUyzYO8CgcXhRq9Z_dtQRPF34EQgrS9bOmJ7abwuxEotG7BqK-aFpL2wtjDtz1IBj3Mj1/s400/flower_shirotsumegusa.png","c":"植物"},{"t":"いろいろなヤシの木のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgugVKylh-w4U_kB1vUoPKFDWKlSDc5hYVKD4aBBotnUjBi3_PGhysYW2Iq-OC1CVda3DLkrskoBDoS13ylw_mio5US3Nr7UMjNXmtT0RAX8-5zO4Slg3hmWrM4LGRBCbFgY2fn68S0OEhH/s400/thumbnail_tree_yashinoki.jpg","c":"植物"},{"t":"温室植物園のイラスト&#65288;蝶&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCCzSp4k8kcnAf_JzoHCxYawxOYLrxlr25qwyacYHWq1mzLlVNeDA_FlB38ACzPPNnIkJL4SnlZWanX3d8ufGvQy3B3EUA3LSg_PpuKoDnMP3X3eEPCj_f9R4ZlsxurXeaFYAJifMR8piU/s400/plant_onshitsu_shokubutsuen_chou.png","c":"植物"},{"t":"温室植物園のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFK3zh1lLHGG6ROGPtzr68oMlQEBiMtbU32P-_nxyicsRE66O86H5Jm0EH0uB1ksZTPJzp0FX9SNVtCQx-PaILVPWXD5hTVLFc7Grh7TmH9aU6yCSNUSotHNfT_8C6uWCBfqCidaHyzjgY/s400/plant_onshitsu_shokubutsuen.png","c":"植物"},{"t":"冬虫夏草のイラスト&#65288;蝉&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh4fsWIQZ_vtetEkOehlM4Txvl2fdQ92AkExKm1vFCaT-HBDHyIWWL8iMrJOZQ9_a_4jjgogMIo8rVvdqUZj4hTl4Ns31ItOECxaOxw1AygP4Mfy3TgDy2ZPqa6e_yUKvlmGxrDR53hi2ko/s400/medical_touchukasou_semi.png","c":"植物"},{"t":"いろいろな鉢植えのサボテンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgd4SsW-bm9bbRz3rGRXl7EtOrO9n6xwpxwad-cU1GTuESDfHTcOD8ZDcaWc4OuvB2YghrlhhKVxxo_wjHDpt-MvJ7vZyHQpDSUbrYBfYYp4iBqa-Bdw3Nc1I2aT4NA5wIrP3Qe66iQMHFk/s400/thumbnail_plant_saboten.jpg","c":"植物"},{"t":"セコイアの木のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjA_nWIhkeYh3n8jvDZPrKuuYsy11zuTmOMVqL5YkokssKtZTVNikKzqQKhgAKx_9IQf712MgNsi3nZg6GC4n7_1lmrcT-8TA4d9bT3PLkH2NpdjjaohFa9TKlfmoDC1PRyL7aOgeUixZW1/s400/tree_sequoia.png","c":"植物"},{"t":"イチョウともみじのキャラクター&#65288;秋&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjI67ay3lJOcSsQVFcf0kJhbP7mO3FiOuhGpk-oJc6XDqdHBB36qknGVoGO0XVQOt-wCOIXdB5_mqgyoXcFVupwVIfWdh9ZADT2h2IePUK4ozg9usYv_ap8hdcb_Th6xhPRlgNmJL2JxirX/s400/season_character3_autumn_momiji_ichou.png","c":"植物"},{"t":"もみじのキャラクター&#65288;秋&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjo_-5JXfdWuehZFF9YAguhoFku-nSXdz4eUtTD5UCx0jq6tZxF9hGS48JwvVZP9Kdu4ZAfuUKd0U4NrrKG25DVFnTCWUEvTr6y4RymqOejk5tOsfR_lXH2i4hbcsVExdfhoJQ6cU22VtDV/s400/season_character3_autumn_momiji.png","c":"植物"},{"t":"イチョウのキャラクター&#65288;秋&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg4TL2x3UD-G6OIjVa6iVj47xSQ0VCyj6O8Iipg4LZfJcmxeT1bQER7kQQIYY22MPahkSZkqLWcuDCBplrRpsgVIjU3KxULMaZuSfwrZffVLQggYbKRPj3xBNar68HZ4PJxByeKUyMrs-7I/s400/season_character3_autumn_ichou.png","c":"植物"},{"t":"苔むした岩のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh1JHqIN173cOrxUQ6Y1VivflhqE-QWERPDMRt-e1GzpP2wmT5tdL9gmhMGjPXMeQhIFe6ZCGpZ65J__YKanYuHkhsJXm0cslGpCV-aV1fF4qZT5TCQ3PFA3xqU0YpGS7N1Qeq4qnVi58NO/s400/nature_stone_ishi_iwa_kokemushi.png","c":"植物"},{"t":"いろいろな並木道のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhSp7C07m1iKnY9UuOQO_DiyR9IkpRJUVTW7jCGl9nhRmDr7043_PeKmnw5rsmAKGF1ReBkT7zv8Uuv6k9s2W_b8x4Hb536YCrbhsL12-lZpcQ_uuMYKGL_100Tv6-6biaBUYUrkrZgm6KG/s400/thumbnail_bg_namikimichi.jpg","c":"植物"},{"t":"ゲーム機の抽選に当たった人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTIPG9edUYvJxr32lpXhZAKR7Mi74o5ke6USsZ5KxnG9RJ0HFcnCqjmCleDtuJ_-QMs6a7iD_hh8rT3tEgivKDVM2q988ekAWigCdnUVfkzGj9YZMGdlA7OuBXEjVtSvZHUi1TSHAoyQRVwiJhF2IcxZRnRadwNrydlJzcfbIOUKqdKGXA5E_M4AEUIMyQ/s400/shopping_game_atari.png","c":"趣味"},{"t":"ゲーム機の抽選に外れた人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhrEhOx6P2n9nyi9-YXML6vwUELJ7dZFPfjtcYuVxJ3nER8G1ZOwWHVDUbznOeoI8aMPeWwWmPel7sqbDq1YV8UBT5D-OpJH2EebykLOL5rllEI_ZKDfrOKtXqrRnp5qPyHm3rpK-3Gwo8INNynrFA205HDg3zwpuNXeUpUHcjzeTYfrXAnqU6FDNgsrToG/s400/shopping_game_hazure.png","c":"趣味"},{"t":"虫取りをする人のイラスト&#65288;大人&#12539;長袖&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpeVsFaExEXU9XFeIOYjhxwm714oHnGQbM2hJ8PPKcRQFZygjubcRMgCuF_eIyJmP7XZ0bDHgisw6FbxM5HONOFGxMuLyiqGjrSP84BGzqXh7v6eNO6HytXzaMppKHs0Pc-34x3ybxtwx5R85ugy0NmFKR_XYZaGUu6h7HX8f1aS3bAfhlOYd5yu4wCg/s400/thumbnail_long_mushitori.jpg","c":"趣味"},{"t":"虫取りをする人のイラスト&#65288;子供&#12539;長袖&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpV9XMLgb4_-LL8JHaMktHoYyrJbUbXAe4ZYeWmXGVv8gu9aPn18ZufN7AFDcYjTqqXcLvpYjmBvMe79BVSMpRrUChGmAUpES_937d2CC1G6FF1_pNj58eWYqLxFc4qVDCMGcmE8KsmaWYoqX6xbtVLRGzXywbVtrBz9P9J3kemhCmaCE327fwuU9zlw/s400/thumbnail_long_mushitori_kids.jpg","c":"趣味"},{"t":"カラオケのマイクとリモコンのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhfprWTz26Ftw9pHGCNUQtBgjV321nn_HczDDQ0GAbRHzUNgbadEM_0XE_4fYZPa0xYyIOhUqzXha26NkEtjVJ3Tz6YlAuu4Z3c8RxkPg8Zyx6ka8pYba7f3naadH98gU5Z-CVDfJjsQC9r/s400/music_karaoke_denmoku.png","c":"趣味"},{"t":"同担拒否のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhn_GwNx2CC02a-yGuUeRiVBOISrcPENfTRQ_fZX9eyMfK6o5Qnl59jRg7T8pm3Kj6xChQ5I5N6jzfEh3oz9AKH1C3O-jP5R3YShZvKeK9IR0umvPrqeqOr6HnWc4BDvTirUXDj6Chir9x6/s400/idol_fan_doutan_kyohi.png","c":"趣味"},{"t":"同担のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi41qi_p3vqsdudViBYSjOGC5JOEpamWjsVgkkC5-VFw_z2kU6Nj1B-VuW-Y63A-NgxVmD921oY8lkBGcqM99hyyP9oghAvDb6NQqx1XxXA1YrKh3GqVxJP3BlYFh6gPB_qC3H2zbB9aZws/s400/idol_fan_doutan.png","c":"趣味"},{"t":"焚き火台のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgITNoJptuWPrglksKYTiN4CzEverMP4_Z0_WTk20dEz7N4R0EeHNvqjrfBk1otjEv2qrsM2y7DdgIbKMGmHVK6m32wWBMKfFpekMNB5xDiHtHf5rSkPUaVrSdk9n3nN0IEyerYzSdC9zyY/s400/thumbnail_takibi_dai.jpg.","c":"趣味"},{"t":"横から見たヘッドフォンを付けた人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTepTG-u_YTPn6nKJAccCNGADSE0muIu_8vDfc0i3G5kCGd8bneyKN0UqRUo7HHzsebjtWkOQf27BST6vfd_E7aQ2eq2CKdWJNy9XFY5qKuWpoxO72sF5I06PHqEN2l0Hfc6fdQ1zBGGXd/s400/music_headphone_side_woman.png","c":"趣味"},{"t":"横から見たヘッドフォンを付けた人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMXz1JQ_zgFVaefF3VlyoteuPH5V9GWhIc-fCFGtvCF8Z37bN73rMc7n7sPT0GAzRfX3OiykfY99r5aZRp-RglLB8CA684ComGns2YrfyS1iisQAQ_tJm6sLEBUSEKbn2d_g5lzM10yJc4/s400/music_headphone_side_man.png","c":"趣味"},{"t":"そりで雪を滑る子供のイラスト&#65288;女の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjc9miICvop-2iToqnrYVrAliT3SzIMSd9HdknHomxjfzxJ5RfQklW3renHPCCrF7gqTM39jRGRP3igV4swsg9MGc9QMkS0S6OY8k4D-HNvJ-uRLqPMrCyyr_iwxFZ27Hyeu68G5cntqZkg/s400/sori_snow_girl.png","c":"趣味"},{"t":"そりで雪を滑る子供のイラスト&#65288;男の子&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFEro64Nm55L1dVyHRAcfxmBk10XUp8LhnimtcACnq4y3NcQ2CL90khDUTdwXKhlAc4bSXDZ79Zuo8rLSazzCwH61-iuyQgTLCaDtb5Ol4kJfPvswy2qOa1lbO1-RiIA8rMf_VkuRdBnKQ/s400/sori_snow_boy.png","c":"趣味"},{"t":"いろいろなペンライトを持つ人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjbAYcANYaimy3zA4huvAcPNg4a4Tl7fdEO5zxzXDsYzojdnRiPUF_uV2LtJoAQy73pRbSCgbcKlw7MeOdjHkfoVa5JnBBmIFFNkETAEdTr0GFHzgp9P5_cL-t4IQC9eGNF9Bjt9kEF6AWB/s400/thumbnail_penlight_woman.jpg.","c":"趣味"},{"t":"いろいろなペンライトを持つ人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEixcJPOeuoJSvPyxUKcHEWliTGLeobspvEVfCUfrcd7i7ZH5gUry4hxG5Ix9HZybdCnZUujpoyvZDCJcNnKCoh55k5LqPZSfvsyb-MRfvs5WnP__rcgwC57IFE7PfEyEwWHYgwuoYBx4g13/s400/thumbnail_penlight_man.jpg.","c":"趣味"},{"t":"塩分7gのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg33tYBEu_AhB7NMqExPiU49NrVaRZVOz51GB2ULJTlQevLlJOhNaG-9hO9Q6X4wBPklcPKsrfEhGqF5_AuyasvQiDAQY97gWNjeh7Nm-xqZnOio0NSuvCtfR484eJcZu_AkxU6pkcEiu4sdlCc6-0-iyxqvMEwDio2DM00fVBQ-Fdw7dxvPavDIvd4CWsL/s400/medical_enbun_7g.png","c":"医療"},{"t":"ブレイクスルー感染のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiacuMgPMpu_Jk1cU9-a20XySPB_AA98trj_JqWFrn91Ts3FxYywdRLQ1GePhyGiSPTlRSKis64MW7hd1Fw1GR5d50emzt6_Mn_u1TudhhnlyNNQDhfglKacX7V5KFTqb4HUSFY6zQ0HQcl/s400/medical_koutai_breakthrough_woman.png","c":"医療"},{"t":"ブレイクスルー感染のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi3DBzxdm1m6A6abDgYSrugHkN9NGPvxgYNgs8kl1FvOH22L2rVhwOz8OU-65r4aCtNs7k8ITIGbcf-4LA72OjDtPzwDIZfy5pjiBcGICk8-iaZN8CsPPEDyRzTHlCV61b1Gxu5F6BGWopi/s400/medical_koutai_breakthrough_man.png","c":"医療"},{"t":"抗体で身を守る人のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjaRpGoUYOpSdkVNwHyRPciNYVZ7I2iLEiIfDXPdQVbzYPqz2I30NihR8QlX_7v7P2jcdd4SnaW2kF1ja-6T3KjWiY1NVm8lOR5QYlH_XHEo9Xsh5O7Urk4H4SzW5qnILP0PFGXpgTZUMzF/s400/medical_koutai_woman.png","c":"医療"},{"t":"抗体で身を守る人のイラスト&#65288;男性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg0HXKnivzNNhA0J2NrlIwoZQLT76PzQ-a_LTXcP6OvGh5sKJWhmvPsjx_VWTWyfMaSrgbH0VhBWmgnopFPuigW52uhT925okhjy2OlGh3LPB1diCB_l0vTXIImhU6mfANRljZMian1Btld/s400/medical_koutai_man.png","c":"医療"},{"t":"いろいろな話し合う人たちのイラスト&#65288;マスク付き&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj4Drpy9Y4CgdV6GVAaPE22g51sn8RapcmHnMt7VCYt_vfquYTWIszvg5X7ADSTFhRIO9WvV_ePpJeT0p8bAjX-xQa0THgFc_aFQiF1Qq7c_JUNPXSkptUgh7HOk8VdbgATvXxjccctcXep/s400/thumbnail_talk_mask.jpg.","c":"医療"},{"t":"いろいろな話し合う人たちのイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhox1Yzxshiyh2hvtrcda_bb2B_qWqEMYU5gs0ySysA8RVH9ClvS9mXoxMvCmagzcjBfgvJzJz8beRYURyZv6UEAb0r-fXTnC7polFxpyOR2BQCzBFbRxRGhbal86phWnC1sULn78Na4a_C/s400/thumbnail_talk.jpg.","c":"医療"},{"t":"新型コロナウイルスワクチン接種券のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivw6pnS8ulrYy6BItvRn-cik6_59s5vDqE68g1FUhPGrnp61yeMu5UZViqzVXYBhDS_XJMb05p65THI0_DxUm2YMNXRf1ELCe70O5wPrFUlSaOAlQ5-1czbug2ykKtfrTMxTZf1LrXQ-8y/s400/thumbnail_document_vaccine_sessyuken.jpg.","c":"医療"},{"t":"ワクチン接種の予約ができない人のイラスト&#65288;ネット&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgkctF6gpjPGe3Pcbj9sLkCSdLKvP4K4IZEU0CuGNSWQ2nYfYsy2BzLhXob9EQqJzXv9oYxOWtAg6A2xAMlYnRXL_KnYVgKs2Jicmn9tznUQQD4kc7qsLFtl2RPK7aTamb1arAxfrRKvfyR/s400/thumbnail_vaccine_yoyaku_smartphone_no.jpg.","c":"医療"},{"t":"ワクチン接種の予約のイラスト&#65288;ネット&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEimX8ugESQ1E2ZkzWh36vsrFOjp5MSjwTea_UQedkOXt9ECR-ysqSlw7MKRnlUzXFJv9Fr1nT1F2aozX7JgshlxW7uZix6AaiWuc6cM__AyQKy2X4osE6K2yew6LfTt1YuCqpNmLphMrVry/s400/thumbnail_vaccine_yoyaku_smartphone_yes.jpg.","c":"医療"},{"t":"ワクチン接種の予約ができない人のイラスト&#65288;電話&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhr0mg1mXwVAaSg1_YAiKClBiZ8Z4kGTmqJCgSpdWA3h631Xk9jWJGHvNV_LEj__SQzUc_jjVsmX_UaCW-ZMO-DN-40AEVpl0mhpIbzo2Fp0msTowkijYjP3wwDQxbelY4tMyvWlBzIjS4e/s400/thumbnail_vaccine_yoyaku_no.jpg.","c":"医療"},{"t":"ワクチン接種の予約のイラスト&#65288;電話&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgeXg3_LXEBhi94z8mBksP5vhOof8S_TfHMvFhhxoE_PPPXAEby7C0GoYXBAO_Nj4OWivcryYLYFZsUnaT3qpJbwc5WaITTq8Kk8p3469WOFZ4GnSxB-ZiuDhPeZO913bNEOE6uqGosvopF/s400/thumbnail_vaccine_yoyaku_yes.jpg.","c":"医療"},{"t":"ワクチンの心配をする人のイラスト&#65288;白衣&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhMTwsd0wP4lg1Dw-fWiTk7IiMPhyA6hokDJIJZMuMjce2cfXhAUunB_tCv1pS17ulV0HnQYcQ1I4g3LycvYysEKPnjVkW7265avAlaujiM0BLqcr0zi4btWRT4brObsRt_doBgamr3sTDJ/s400/thumbnail_vaccine_shinpai_doctor.jpg.","c":"医療"},{"t":"いろいろなワクチンの心配をする人のイラスト","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhcTGE0cR2awnSQGmB7lrWE3Zn5Eqgm2PmfjouOeg_Fc9fhLMpp7uT0ZiStzMA3MBHbB-ibvZSLwzKf0W4_ZAfm66Vy4wuQKfIPOrXrz3IOnlKWa064dKrjegmABHzKKG7gfAUMfTliXpI9/s400/thumbnail_vaccine_shinpai.jpg.","c":"医療"},{"t":"&#12300;黙食にご協力ください&#12301;の文字","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiEOIFI2Gp_5mMDBrUuErAjHjTF68KKTiLMYza3262cPM_N7cWvF1EkAkxKdUfqEX229bxlefwvTSQaJPayPyih0Bz6fDmlmu24z4bQfLQMgNr15aKMJxl-cH9CzcgG34Kz7kkupSltjNAK/s400/syokuji_message_mokusyoku_gokyouryoku_kudasai.png","c":"医療"},{"t":"HIV検査のイラスト&#65288;女性&#65289;","u":"https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiFAK7lUJ77Xdlc7BkiGhVyiqrSrfdqTdbrkm4R94gsu2lCTH6u2IX1a2ZDfTROxJiafQy5H6GzaJyC-yX5OKBjPlCwYDks84uzxgi2wmF6yGSxa33XzUO-Xn1gpdRW5-lvy5GlGd39ZlUv/s400/thumbnail_hiv_kensa_woman.jpg.","c":"医療"}];

// Helper: chuyển ArrayBuffer -> chuỗi base64 (chunk 32KB chống stack overflow)
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
__name(arrayBufferToBase64, "arrayBufferToBase64");

// Helper: gọi Gemini Vision NON-STREAM sinh bài học JSON từ ảnh (xoay tua key + fallback)
async function callGeminiVisionJSON(prompt, imageBase64, mimeType, env) {
  const keysString = env.GEMINI_API_KEYS;
  if (!keysString) throw new Error("Chưa cấu hình biến môi trường GEMINI_API_KEYS!");
  const apiKeys = keysString.split(",").map((k) => k.trim()).filter(Boolean);
  if (apiKeys.length === 0) throw new Error("Biến môi trường GEMINI_API_KEYS trống!");
  const startIndex = Math.floor(Math.random() * apiKeys.length);
  let lastError = "";
  for (let i = 0; i < apiKeys.length; i++) {
    const currentKey = apiKeys[(startIndex + i) % apiKeys.length];
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${currentKey}`;
      const response = await fetchWithTimeout(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: imageBase64 } }] }],
          generationConfig: {
            thinkingLevel: "low",
            maxOutputTokens: 8192
          }
        })
      }, 120000);
      if (!response.ok) {
        lastError = `Gemini API error ${response.status}: ${(await response.text()).slice(0, 300)}`;
        continue;
      }
      const data = await response.json();
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      if (!text) {
        lastError = "Gemini trả về nội dung rỗng";
        continue;
      }
      return text;
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(lastError || "Gọi Gemini Vision thất bại sau khi thử tất cả API key.");
}
__name(callGeminiVisionJSON, "callGeminiVisionJSON");


// =========================================================================
// 🟢 HELPER: fetchWithTimeout — fetch có timeout bằng Promise.race
// =========================================================================
// Mục đích: thay thế pattern `setTimeout + AbortController + clearTimeout`
// vốn dễ gây lỗi scoping (ReferenceError: fetchTimeoutId is not defined).
//
// Cách hoạt động:
//   1. Tạo AbortController nội bộ (không phụ thuộc signal của caller).
//   2. Race giữa `fetch()` và `setTimeout(() => controller.abort(), timeoutMs)`.
//   3. Dùng `.finally()` để clearTimeout — chạy dù resolve hay reject,
//      không cần lo scoping như try/catch.
//   4. `.catch()` convert AbortError (do timeout) thành AbortTimeoutError,
//      giúp caller phân biệt với abort thật từ user (nếu có).
//
// Sử dụng:
//   try {
//     const res = await fetchWithTimeout(url, opts, 30000);
//     ...
//   } catch (err) {
//     if (err.name === 'AbortTimeoutError') { /* timeout */ }
//     else { /* lỗi mạng / HTTP */ }
//   }
// =========================================================================
async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Override signal của caller bằng controller.signal nội bộ
  // (caller không thể tự abort — chỉ timeout mới abort)
  const finalOptions = { ...options, signal: controller.signal };

  try {
    return await fetch(url, finalOptions);
  } catch (err) {
    // AbortError do timeout fire → convert thành AbortTimeoutError
    // để caller phân biệt với abort thật từ user
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Timeout sau ${timeoutMs / 1000}s`);
      timeoutErr.name = 'AbortTimeoutError';
      timeoutErr.originalError = err;
      throw timeoutErr;
    }
    throw err;
  } finally {
    // 🟢 Luôn clear timeout dù thành công hay lỗi — không cần lo scoping
    clearTimeout(timeoutId);
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");

// =========================================================================
// 🟢 FIX "STREAMING BỊ ĐỨT ĐOẠN" (31/08/2026): SSE HEARTBEAT
// =========================================================================
// VẤN ĐỀ: gemini-3-flash-preview / Qwen 3.8 là REASONING MODEL — sau khi nhận request,
// chúng có thể "nghĩ" 30-90s+ KHÔNG phát một byte nào. Trong khoảng im lặng đó:
//   1. Proxy/carrier mobile (4G/5G VN) thấy connection idle → drop kết nối
//   2. Frontend per-chunk timeout (60s/25s) không nhận được byte → tự abort
//      → trả về partial text bị cụt ("đứt đoạn")
//
// GIẢI PHÁP: Bơm các dòng "comment" SSE (`: hb\n\n`) vào stream mỗi 15s khi
// upstream đang im lặng. Theo chuẩn SSE, dòng bắt đầu bằng ':' là comment —
// mọi parser đều bỏ qua → KHÔNG ảnh hưởng nội dung, nhưng:
//   - Proxy/carrier thấy có data flowing → không drop connection
//   - Frontend reader.read() nhận được byte → reset per-chunk timeout
//
// AN TOÀN: Guard `atLineBoundary` — chỉ chèn comment khi byte cuối vừa viết
// là '\n' (đang ở ranh giới dòng), tuyệt đối không chèn giữa một dòng JSON
// đang dở dang của upstream.
function withSSEHeartbeat(body, intervalMs = 15000) {
  const encoder = new TextEncoder();
  let atLineBoundary = true; // đầu stream luôn ở ranh giới dòng
  let heartbeatTimer = null;

  const bridge = new TransformStream({
    start(controller) {
      heartbeatTimer = setInterval(() => {
        if (!atLineBoundary) return; // đang giữa dòng JSON dở dang → chờ
        try {
          controller.enqueue(encoder.encode(": hb\n\n"));
        } catch (e) {
          clearInterval(heartbeatTimer); // stream đã đóng/lỗi → ngừng bơm
        }
      }, intervalMs);
    },
    transform(chunk, controller) {
      if (chunk && chunk.length > 0) {
        // Ghi nhớ byte cuối để biết có đang ở ranh giới dòng hay không
        atLineBoundary = chunk[chunk.length - 1] === 0x0A; // '\n'
        controller.enqueue(chunk);
      }
    },
    flush() {
      // Upstream kết thúc bình thường → dừng heartbeat, đóng gọn gàng
      clearInterval(heartbeatTimer);
    },
    cancel() {
      // Client ngắt kết nối (đóng tab / rớt mạng) → dừng heartbeat,
      // pipeThrough sẽ tự cancel body upstream để giải phóng tài nguyên
      clearInterval(heartbeatTimer);
    }
  });

  return body.pipeThrough(bridge);
}
__name(withSSEHeartbeat, "withSSEHeartbeat");

var worker_default = {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization" // <-- BẮT BUỘC BỔ SUNG CHỮ NÀY
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/api/dict-search") {
        const query = url.searchParams.get("query");
        if (!query) {
          return new Response(JSON.stringify({ error: "Missing query" }), { status: 400, headers: corsHeaders });
        }

        // 🟢 ĐỔI: Bỏ FTS5 MATCH (CJK không tách được token), dùng LIKE substring.
        // Lý do: FTS5 với tokenizer mặc định unicode61 không tách "花火" thành
        // "花" + "火" → query "花" không match "花火". Dùng LIKE '%花%' sẽ match
        // cả từ bắt đầu bằng, chứa, và trùng chính xác "花".
        //
        // Tìm kiếm trên 3 cột: word, reading, meaning (nghĩa tiếng Việt).
        // → Gõ "hoa" sẽ match meaning "hoa" → ra 花, 花火, 花束...
        //
        // Sort ưu tiên:
        //   0 = exact match (word = query)
        //   1 = prefix match (word bắt đầu bằng query)
        //   2 = contains match (word chứa query ở giữa/cuối)
        //   3 = reading match (không khớp word, chỉ khớp reading)
        //   4 = meaning match (chỉ khớp meaning — gõ tiếng Việt)
        // Sau đó sort phụ theo popularity DESC, length(word) ASC.
        const likeQuery = `%${query}%`;
        const prefixQuery = `${query}%`;

        const { results } = await env.DB.prepare(`
          SELECT * FROM dictionary
          WHERE word LIKE ?1 COLLATE NOCASE
             OR reading LIKE ?1 COLLATE NOCASE
             OR meaning LIKE ?1 COLLATE NOCASE
          ORDER BY
            CASE
              WHEN word = ?2 COLLATE NOCASE THEN 0
              WHEN word LIKE ?3 COLLATE NOCASE THEN 1
              WHEN word LIKE ?1 COLLATE NOCASE THEN 2
              WHEN reading LIKE ?1 COLLATE NOCASE THEN 3
              ELSE 4
            END,
            popularity DESC,
            length(word) ASC
          LIMIT 30
        `).bind(likeQuery, query, prefixQuery).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 ENDPOINT MỚI: KANJI BRIEF — Dùng riêng cho Góc Khám Phá trên Dashboard
      // Payload ~300 bytes thay vì ~15-20KB của /api/kanji-detail.
      // BỎ QUA: compounds (30 rows), examples, tags, popularity, id,
      //         stroke_count, mnemonics, components, structure_type.
      // Chỉ SELECT đúng 5 cột cần thiết cho Dashboard: kanji, hv, meaning,
      // onyomi, kunyomi. KHÔNG JOIN bảng dictionary → tiết kiệm 95%+ băng thông.
      // Dùng .first() thay vì .all() vì chỉ cần 1 row.
      // =========================================================================
      if (path === "/api/kanji-brief") {
        const kanji = url.searchParams.get("kanji");
        if (!kanji || kanji.length !== 1) {
          return new Response(JSON.stringify({ error: "Missing or invalid kanji (must be a single character)" }), {
            status: 400,
            headers: corsHeaders
          });
        }
        const row = await env.DB.prepare(
          "SELECT kanji, hv, meaning, onyomi, kunyomi FROM kanji_dictionary WHERE kanji = ?1"
        ).bind(kanji).first();

        if (!row) {
          return new Response(JSON.stringify({ error: "Kanji not found" }), {
            status: 404,
            headers: corsHeaders
          });
        }

        // CẮT NGẮN nghĩa: Dashboard chỉ cần 1-2 nghĩa đầu để hiển thị.
        // Bỏ tiền tố dạng [xxx] ở đầu nếu có, tách theo ";" hoặc "；", lấy tối đa 2 phần.
        let briefMeaning = (row.meaning || '').trim();
        if (briefMeaning) {
          briefMeaning = briefMeaning.replace(/^\[.*?\]\s*/, '').trim();
          const parts = briefMeaning.split(/\s*[;；]\s*/).filter(Boolean).slice(0, 2);
          briefMeaning = parts.join('; ');
          if (briefMeaning.length > 120) {
            briefMeaning = briefMeaning.slice(0, 117) + '...';
          }
        }

        return new Response(JSON.stringify({
          kanji: row.kanji,
          hv: (row.hv || '').trim(),
          meaning: briefMeaning,
          onyomi: row.onyomi || '',
          kunyomi: row.kunyomi || ''
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (path === "/api/kanji-detail") {
        const kanji = url.searchParams.get("kanji");
        if (!kanji) {
          return new Response(JSON.stringify({ error: "Missing kanji" }), { status: 400, headers: corsHeaders });
        }
        const kanjiQuery = env.DB.prepare("SELECT * FROM kanji_dictionary WHERE kanji = ?").bind(kanji);
        const compoundsQuery = env.DB.prepare(`
                    SELECT * FROM dictionary 
                    WHERE word LIKE ?
                      AND word NOT GLOB '*[a-zA-Z0-9]*'
                      AND length(word) >= 2 AND length(word) <= 4
                      AND trim(reading, ' \u3000' || char(9) || char(10) || char(13)) != ''
                      AND reading IS NOT NULL
                      AND hv != '' AND hv IS NOT NULL
                    ORDER BY 
                      (level != '' AND level IS NOT NULL) DESC,
                      level DESC,
                      popularity DESC,
                      length(word) ASC
                    LIMIT 30
                `).bind(`%${kanji}%`);
        const [kanjiResult, compoundsResult] = await env.DB.batch([kanjiQuery, compoundsQuery]);
        let finalCompounds = compoundsResult.results || [];
        const isJlpt = /* @__PURE__ */ __name22((lvl) => ["N1", "N2", "N3", "N4", "N5"].includes(lvl), "isJlpt");
        const jlptCount = finalCompounds.filter((r) => isJlpt(r.level)).length;
        if (jlptCount > 20) {
          finalCompounds = finalCompounds.slice(0, 30);
        } else {
          finalCompounds = finalCompounds.slice(0, 20);
        }
        return new Response(JSON.stringify({
          kanjiInfo: kanjiResult.results[0] || null,
          compounds: finalCompounds
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // =========================================================================
      // 🟢 ENDPOINT: BỐC THẺ NGẪU NHIÊN THEO JLPT LEVEL TỪ D1
      // =========================================================================
      if (path === "/api/jlpt-random") {
        const level = url.searchParams.get("level");
        const limit = parseInt(url.searchParams.get("limit")) || 100;
        
        if (!level) {
          return new Response(JSON.stringify({ error: "Missing level parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }
        
        const { results } = await env.DB.prepare(
          "SELECT * FROM dictionary WHERE level = ? ORDER BY RANDOM() LIMIT ?"
        ).bind(level, limit).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 1: LẤY TOÀN BỘ METADATA CHỦ ĐỀ GỢI Ý (AUTOCOMPLETE)
      // =========================================================================
      if (path === "/api/thematic-metadata") {
        // Sắp xếp: Gốc (Cha) xếp trước, Con xếp theo thứ tự phân đoạn (sort_order)
        const { results } = await env.DB.prepare(`
          SELECT * FROM thematic_metadata 
          ORDER BY category ASC, parent_id IS NOT NULL ASC, parent_id ASC, sort_order ASC
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 2: TRUY VẤN TỪ VỰNG D1 THEO TAG CHỦ ĐỀ SẴN CÓ
      // =========================================================================
      if (path === "/api/get-by-tag") {
        const tag = url.searchParams.get("tag");
        if (!tag) {
          return new Response(JSON.stringify({ error: "Missing tag parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // Sửa tags LIKE thành instr() để vượt rào 50-byte
        const { results } = await env.DB.prepare(`
          SELECT word, reading, meaning, hv, level, examples 
          FROM dictionary 
          WHERE instr(tags, ',' || ?1 || ',') > 0
          LIMIT 1500
        `).bind(tag).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 MỚI - ENDPOINT 3: LÀM ĐẦY (HYDRATE) TỪ THÔ BẰNG TOÁN TỬ IN TRÊN D1
      // =========================================================================
      if (path === "/api/bulk-lookup" && request.method === "POST") {
        const wordsArray = await request.json();
        if (!wordsArray || !Array.isArray(wordsArray) || wordsArray.length === 0) {
          return new Response(JSON.stringify({ error: "Invalid or empty words array" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        // BỔ SUNG CỘT tags VÀO TRUY VẤN CHỌN
        const { results } = await env.DB.prepare(`
          SELECT word, reading, meaning, hv, level, examples, tags 
          FROM dictionary 
          WHERE word IN (SELECT value FROM json_each(?1))
        `).bind(JSON.stringify(wordsArray)).all();

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // =========================================================================
      // 🟢 MỚI - ENDPOINT ĐẾM SỐ TỪ SIÊU TỐC (CHỈ TRẢ VỀ COUNT, TIẾT KIỆM BĂNG THÔNG)
      // =========================================================================
      if (path === "/api/count-by-tag") {
        const tag = url.searchParams.get("tag");
        if (!tag) {
          return new Response(JSON.stringify({ error: "Missing tag parameter" }), { 
            status: 400, 
            headers: corsHeaders 
          });
        }

        const { results } = await env.DB.prepare(`
          SELECT COUNT(*) AS total 
          FROM dictionary 
          WHERE ',' || tags || ',' LIKE ?
        `).bind(`%,${tag},%`).all();

        return new Response(JSON.stringify(results[0] || { total: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // =========================================================================
      // 🟢 ENDPOINT: NEWS CARD — Lấy 1 bản tin NHK ngẫu nhiên + thumbnail
      // (Layer 1 cho Góc Khám Phá, KHÔNG gọi AI, cache RSS 10 phút)
      // =========================================================================
      if (path === "/api/news-card") {
        try {
          // 1. Fetch RSS NHK cat0 (dùng Cache API của Cloudflare, TTL 10 phút)
          const rssCacheKey = new Request("https://internal-cache/nhk-rss-cat0");
          let items = null;
          const cachedRss = await caches.default.match(rssCacheKey);
          if (cachedRss) {
            items = await cachedRss.json();
          } else {
            const rssResponse = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            });
            if (!rssResponse.ok) {
              throw new Error(`Không thể kết nối RSS NHK (Mã lỗi: ${rssResponse.status})`);
            }
            const rssText = await rssResponse.text();
            items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
            if (!items || items.length === 0) {
              throw new Error("Không tìm thấy bản tin hợp lệ trong RSS.");
            }
            // Cache 10 phút = 600 giây
            const cacheResp = new Response(JSON.stringify(items), {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=600"
              }
            });
            ctx.waitUntil(caches.default.put(rssCacheKey, cacheResp));
          }

          // 2. Bốc ngẫu nhiên 1 bài
          const randomIndex = Math.floor(Math.random() * items.length);
          const itemContent = items[randomIndex];

          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
          const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

          const cleanCdata = (str) => {
            if (!str) return "";
            return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
          };

          const newsTitle = cleanCdata(titleMatch ? titleMatch[1] : "Bản tin thời sự");
          const newsDesc = cleanCdata(descMatch ? descMatch[1] : "");
          const newsLink = cleanCdata(linkMatch ? linkMatch[1] : "");
          const newsPubDate = cleanCdata(dateMatch ? dateMatch[1] : "");

          if (!newsLink) {
            throw new Error("Bản tin không có link.");
          }

          // 3. Scrape og:image từ trang bài báo (cache riêng 1 giờ cho mỗi link)
          let imageUrl = null;
          try {
            const imgCacheKey = new Request(`https://internal-cache/ogimg/${encodeURIComponent(newsLink)}`);
            const cachedImg = await caches.default.match(imgCacheKey);
            if (cachedImg) {
              imageUrl = await cachedImg.text();
            } else {
              const articleResponse = await fetch(newsLink, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
              });
              if (articleResponse.ok) {
                const articleHtml = await articleResponse.text();
                // Thử nhiều pattern og:image
                const ogMatch = articleHtml.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
                  || articleHtml.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
                if (ogMatch && ogMatch[1]) {
                  imageUrl = ogMatch[1];
                }
              }
              // Cache kết quả (cả khi null để khỏi scrape lại)
              const imgCacheResp = new Response(imageUrl || "", {
                headers: {
                  "Content-Type": "text/plain",
                  "Cache-Control": "public, max-age=3600"
                }
              });
              ctx.waitUntil(caches.default.put(imgCacheKey, imgCacheResp));
            }
          } catch (e) {
            // Không có ảnh cũng không sao, trả null để frontend dùng fallback
            imageUrl = null;
          }

          return new Response(JSON.stringify({
            title: newsTitle,
            desc: newsDesc,
            link: newsLink,
            image_url: imageUrl,
            pub_date: newsPubDate
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      // 🟢 ENDPOINT: BÀI ĐỌC THỜI SỰ THỰC TẾ (NHK RSS + QWEN 3.6 27B)
      // - Có tham số ?link={url} → dùng bài cụ thể + check cache D1 trước
      // - Không có ?link → random như cũ
      // =========================================================================
      // 🟢 ENDPOINT: IMAGE CARD — Học từ vựng qua hình ảnh IRASUTOYA + Vision AI
      // Pipeline: dataset IRASUTOYA (nhúng trong Worker) -> chọn ảnh theo category
      // (loại trừ ?exclude=) -> cache D1 vĩnh viễn theo image_url -> nếu chưa có:
      // tải ảnh -> base64 -> Gemini Vision sinh bài học (5 từ vựng + 2 mẫu câu + 1 quiz)
      // -> lưu cache D1 -> trả JSON. Mỗi ảnh chỉ tốn DUY NHẤT 1 lần gọi AI.
      // GET /api/image-card                      -> random toàn bộ dataset
      // GET /api/image-card?category=<nhật>       -> random trong category
      // GET /api/image-card?exclude=<image_url>   -> tránh lặp lại ảnh đang xem
      // =========================================================================
      if (path === "/api/image-card") {
        try {
          const category = url.searchParams.get("category");
          const excludeUrl = url.searchParams.get("exclude");

          // 1. Chọn ảnh ngẫu nhiên (theo category nếu có, loại trừ ảnh đang xem)
          let pool = IRASUTOYA_IMAGES;
          if (category) {
            const filtered = IRASUTOYA_IMAGES.filter((i) => i.c === category);
            if (filtered.length > 0) pool = filtered;
          }
          let candidates = pool;
          if (excludeUrl) {
            const noRepeat = pool.filter((i) => i.u !== excludeUrl);
            if (noRepeat.length > 0) candidates = noRepeat;
          }
          if (!candidates || candidates.length === 0) {
            throw new Error("Không tìm thấy ảnh phù hợp trong kho IRASUTOYA.");
          }
          const pick = candidates[Math.floor(Math.random() * candidates.length)];

          // 2. Cache D1 vĩnh viễn theo image_url — ảnh đã phân tích bao giờ cũng trả tức thì
          try {
            const cached = await env.DB.prepare(
              "SELECT lesson_json FROM image_cards WHERE image_url = ?1"
            ).bind(pick.u).first();
            if (cached && cached.lesson_json) {
              try {
                const lesson = JSON.parse(cached.lesson_json);
                lesson.cached = true;
                return new Response(JSON.stringify(lesson), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              } catch (parseErr) {
                console.warn("image_cards cache JSON hỏng:", parseErr.message);
              }
            }
          } catch (cacheErr) {
            console.warn("image_cards cache miss/err:", cacheErr.message);
          }

          // 3. Tải ảnh minh hoạ -> base64
          const imgRes = await fetchWithTimeout(pick.u, {}, 20000);
          if (!imgRes.ok) {
            throw new Error(`Không tải được ảnh minh hoạ (Mã lỗi: ${imgRes.status})`);
          }
          const mimeType = imgRes.headers.get("content-type") || "image/png";
          const imageBase64 = arrayBufferToBase64(await imgRes.arrayBuffer());

          // 4. Vision AI sinh bài học từ vựng từ bức tranh
          const aiPrompt = `Bạn là chuyên gia giảng dạy tiếng Nhật JLPT cho người Việt.
Dưới đây là một bức tranh minh hoạ dễ thương phong cách Nhật Bản (nguồn kho ảnh IRASUTOYA).
Tiêu đề gốc của tranh (tiếng Nhật): 「${pick.t}」
Danh mục tranh: ${pick.c}

NHIỆM VỤ: Nhìn kỹ bức tranh, nhận diện các đối tượng - chi tiết - hoạt động chính, rồi thiết lập bài học từ vựng tiếng Nhật cấp độ N5-N3 dựa trên tranh.

YÊU CẦU NỘI DUNG:
- "theme": tên chủ đề ngắn gọn bằng tiếng Việt (tối đa 5 chữ) tóm tắt bức tranh.
- "description": 1-2 câu tiếng Việt mô tả nội dung đang diễn ra trong tranh.
- "vocab": ĐÚNG 5 từ vựng tiêu biểu nhất gắn trực tiếp với tranh; ưu tiên từ có kanji; mỗi từ gồm: "front" (kanji/kana), "reading" (cách đọc hiragana), "meaning" (nghĩa tiếng Việt), "hv" (nghĩa Hán Việt, không có thì để chuỗi rỗng), "ex_jp" (1 câu ví dụ N5-N3 chứa từ), "ex_vn" (nghĩa câu ví dụ).
- "sentences": ĐÚNG 2 mẫu câu tiếng Nhật cấp N5-N3 mô tả bức tranh; mỗi câu gồm: "jp", "romaji", "vn".
- "quiz": 1 câu hỏi bằng TIẾNG VIỆT kiểm tra hiểu bài (về tranh hoặc từ vựng vừa học); "options" ĐÚNG 4 lựa chọn; "correct_index" 0-3; "explanation" giải thích ngắn vì sao đúng.

RÀNG BUỘC BẢO VỆ CÚ PHÁP JSON TUYỆT ĐỐI (QUAN TRỌNG NHẤT):
- CẤM TUYỆT ĐỐI dùng dấu nháy kép (") bên trong nội dung các trường văn bản. Nếu cần trích dẫn, dùng dấu nháy đơn (') hoặc dấu ngoặc 「」.
- Giữ nguyên tên các khóa JSON như mẫu.

BẮT BUỘC chỉ trả về MỘT đối tượng JSON hợp lệ duy nhất (không giải thích ngoài lề, không markdown). Định dạng mẫu:
{
  "theme": "Tên chủ đề tiếng Việt",
  "description": "Mô tả bức tranh bằng tiếng Việt",
  "vocab": [ { "front": "漢字", "reading": "かんじ", "meaning": "nghĩa tiếng Việt", "hv": "hán việt", "ex_jp": "câu ví dụ tiếng Nhật", "ex_vn": "nghĩa câu ví dụ" } ],
  "sentences": [ { "jp": "câu tiếng Nhật", "romaji": "romaji", "vn": "nghĩa tiếng Việt" } ],
  "quiz": { "question": "câu hỏi tiếng Việt", "options": ["đáp án 1", "đáp án 2", "đáp án 3", "đáp án 4"], "correct_index": 0, "explanation": "giải thích" }
}`;

          const aiText = await callGeminiVisionJSON(aiPrompt, imageBase64, mimeType, env);

          // 5. Bóc JSON từ câu trả lời AI
          let jsonStr = aiText.trim();
          const jsonStart = jsonStr.indexOf("{");
          const jsonEnd = jsonStr.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
          }
          const lesson = JSON.parse(jsonStr); // lỗi parse -> 500 với message rõ ràng
          lesson.image_url = pick.u;
          lesson.image_title = pick.t;
          lesson.category = pick.c;
          lesson.cached = false;
          const finalJson = JSON.stringify(lesson);

          // 6. Lưu cache D1 (chỉ cache bài học đủ dữ liệu; tự tạo bảng lần đầu)
          const isWellFormed = Array.isArray(lesson.vocab) && lesson.vocab.length > 0 && lesson.quiz && Array.isArray(lesson.quiz.options);
          if (isWellFormed) {
            try {
              await env.DB.prepare(
                "CREATE TABLE IF NOT EXISTS image_cards (image_url TEXT PRIMARY KEY, image_title TEXT, category TEXT, lesson_json TEXT, created_at TEXT DEFAULT (datetime('now')))"
              ).run();
              await env.DB.prepare(
                "INSERT INTO image_cards (image_url, image_title, category, lesson_json, created_at) VALUES (?1, ?2, ?3, ?4, datetime('now')) ON CONFLICT(image_url) DO NOTHING"
              ).bind(pick.u, pick.t, pick.c, finalJson).run();
            } catch (saveErr) {
              console.warn("Không save được image_cards cache:", saveErr.message);
            }
          }

          return new Response(finalJson, {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      if (path === "/api/daily-news") {
        try {
          // 🟢 MỚI: Hỗ trợ tham số ?link={url} để frontend chỉ định bài cụ thể
          // (dùng khi user bấm "Đọc & Quiz" từ card tin tức trên Góc Khám Phá)
          const requestedLink = url.searchParams.get("link");

          // 🟢 MỚI: Cache D1 — kiểm tra trước khi gọi AI
          // Bảng: news_dokkai_cache (news_url TEXT PK, news_title TEXT, dokkai_json TEXT, created_at TEXT)
          if (requestedLink) {
            try {
              const cached = await env.DB.prepare(
                "SELECT dokkai_json FROM news_dokkai_cache WHERE news_url = ?1"
              ).bind(requestedLink).first();

              if (cached && cached.dokkai_json) {
                // Cache HIT → trả ngay lập tức, không gọi AI
                return new Response(cached.dokkai_json, {
                  headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
              }
            } catch (cacheErr) {
              // Nếu bảng chưa tồn tại hoặc lỗi khác → log và tiếp tục gọi AI
              console.warn("Cache D1 miss/err:", cacheErr.message);
            }
          }

          // 1. Tải bản tin thời sự từ RSS chính thức của NHK
          const rssResponse = await fetch("https://www3.nhk.or.jp/rss/news/cat0.xml", {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          
          if (!rssResponse.ok) {
            throw new Error(`Không thể kết nối RSS NHK (Mã lỗi: ${rssResponse.status})`);
          }
          
          const rssText = await rssResponse.text();

          // 2. Sử dụng matchAll để gom TOÀN BỘ các thẻ <item> (bản tin) vào một mảng
          const items = [...rssText.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
          if (!items || items.length === 0) {
            throw new Error("Không tìm thấy bản tin hợp lệ trong dữ liệu RSS.");
          }

          // Hàm dọn dẹp thẻ dữ liệu đặc biệt CDATA của XML
          const cleanCdata = (str) => {
            if (!str) return "";
            return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").trim();
          };

          // 🟢 MỚI: Nếu có requestedLink → tìm bài tương ứng trong RSS
          // (lấy title + desc từ RSS cho chính xác, không scrape HTML)
          let itemContent = null;
          if (requestedLink) {
            for (const item of items) {
              const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
              if (linkMatch && cleanCdata(linkMatch[1]) === requestedLink) {
                itemContent = item;
                break;
              }
            }
            // Nếu không tìm thấy link trong RSS (bài cũ đã rớt khỏi RSS) →
            // fallback: tự tạo itemContent với link + title + desc trống
            if (!itemContent) {
              itemContent = `<title>Bài tin cũ</title><description>${requestedLink}</description><link>${requestedLink}</link>`;
            }
          } else {
            // Không có ?link → bốc ngẫu nhiên 1 bài như cũ
            const randomIndex = Math.floor(Math.random() * items.length);
            itemContent = items[randomIndex];
          }

          const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
          const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
          const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);

          const newsTitle = cleanCdata(titleMatch ? titleMatch[1] : "Bản tin thời sự");
          const newsDesc = cleanCdata(descMatch ? descMatch[1] : "");
          const newsLink = cleanCdata(linkMatch ? linkMatch[1] : (requestedLink || ""));

          if (!newsDesc && !requestedLink) {
            throw new Error("Bản tin trống nội dung mô tả.");
          }

          // 3. Soạn Prompt gửi cho Qwen 3.6 27B xử lý dịch thuật và bóc tách cấu trúc (Đã tối ưu chống lỗi nháy kép)
          const aiPrompt = `Bạn là chuyên gia giảng dạy tiếng Nhật JLPT.
          Dưới đây là một bản tin thời sự thực tế từ đài truyền hình quốc gia NHK:
          Tiêu đề bản tin: "${newsTitle}"
          Nội dung tóm tắt: "${newsDesc}"
          Nguồn bản tin: ${newsLink}

          Hãy phân tích bản tin này để thiết lập bài học Đọc hiểu (Dokkai) cho học sinh.
          
          ⚠️⚠️⚠️ RÀNG BUỘC BẢO VỆ CÚ PHÁP JSON TUYỆT ĐỐI (QUAN TRỌNG NHẤT):
          - CẤM TUYỆT ĐỐI: Không được phép sử dụng bất kỳ dấu nháy kép (") nào bên trong nội dung của các trường văn bản (như "explanation", "meaning", "ex_jp", "ex_vn", "title_jp", "story_jp", "story_vn").
          - Nếu muốn viết trích dẫn, nhấn mạnh từ vựng hoặc dịch nghĩa từ trong câu, bạn BẮT BUỘC phải dùng dấu nháy đơn (') hoặc dấu ngoặc góc của tiếng Nhật 「」.
          - Ví dụ SAI (Làm hỏng JSON): "explanation": "Bản tin ghi rõ: "このうち3人は"..."
          - Ví dụ ĐÚNG (Hợp lệ JSON): "explanation": "Bản tin ghi rõ: 'このうち3人は'..." hoặc "explanation": "Bản tin ghi rõ: 「このうち3人は」..."

          ⚠️ RÀNG BUỘC VỀ SỐ LƯỢNG:
          - Chỉ trích xuất TỐI ĐA 5 từ vựng (vocab) nổi bật nhất xuất hiện trong bản tin.
          - TUYỆT ĐỐI KHÔNG trích xuất bất kỳ cấu trúc ngữ pháp nào (bỏ hoàn toàn phần grammar khỏi JSON).
          - Câu hỏi trắc nghiệm ("question") BẮT BUỘC viết hoàn toàn bằng TIẾNG NHẬT (không dùng tiếng Việt cho câu hỏi này).
          - Các lựa chọn đáp án ("correct_answer" và "wrong_answers") cũng viết hoàn toàn bằng TIẾNG NHẬT để rèn luyện kỹ năng đọc hiểu thực tế của học viên.
          - Phần giải thích ("explanation") viết bằng TIẾNG VIỆT, phân tích sâu sắc giống như sách hướng dẫn giải đề thi đọc hiểu JLPT:
            1. Phân tích các từ khóa (Keywords) cốt lõi xuất hiện trong cả câu hỏi và văn bản gốc để đối chiếu nghĩa.
            2. Chỉ ra mẹo/manh mối nhận biết nhanh đáp án đúng nằm ở câu văn nào trong bài đọc (Tips/Clues).
            3. Hướng dẫn cách loại trừ các đáp án nhiễu còn lại.

          BẮT BUỘC chỉ trả về duy nhất một đối tượng JSON (Không viết thêm giải thích ngoài lề). Định dạng JSON mẫu:
          {
            "title_jp": "Tiêu đề tiếng Nhật của bản tin",
            "story_jp": "Nội dung tóm tắt bản tin tiếng Nhật sạch",
            "story_vn": "Bản dịch toàn bộ bản tin sang tiếng Việt mượt mà",
            "quiz": {
              "question": "Câu hỏi trắc nghiệm bằng TIẾNG NHẬT",
              "correct_answer": "Đáp án đúng bằng TIẾNG NHẬT",
              "wrong_answers": [
                "Đáp án sai 1 bằng TIẾNG NHẬT",
                "Đáp án sai 2 bằng TIẾNG NHẬT",
                "Đáp án sai 3 bằng TIẾNG NHẬT"
              ],
              "explanation": "Giải thích chi tiết bằng tiếng Việt: Phân tích từ khóa (keywords) cốt lõi của câu hỏi và bài đọc, mẹo tìm manh mối đáp án đúng nằm ở câu văn nào trong bài đọc giống như hướng dẫn làm đề thi đọc hiểu JLPT và cách tư duy loại trừ đáp án nhiễu."
            },
            "vocab": [
              {
                "front": "Từ vựng (Kanji)",
                "reading": "Cách đọc Hiragana",
                "meaning": "Ý nghĩa tiếng Việt",
                "hv": "Nghĩa Hán Việt (nếu có)",
                "ex_jp": "1 Câu ví dụ tiếng Nhật chứa từ vựng đó (trích từ bản tin hoặc tự soạn)",
                "ex_vn": "Nghĩa câu ví dụ"
              }
            ]
          }`;

          // Gọi Qwen 3.8 27B qua hạ tầng Groq
          const aiResponseText = await callGroqAI_NonStream(aiPrompt, env, "qwen/qwen3.8-27b");
          
          let responseText = aiResponseText.trim();
          const jsonStart = responseText.indexOf("{");
          const jsonEnd = responseText.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
              responseText = responseText.substring(jsonStart, jsonEnd + 1);
          }

          // 🟢 MỚI: Save cache D1 cho lần sau (chỉ khi có requestedLink để cache theo URL chính xác)
          if (requestedLink) {
            try {
              await env.DB.prepare(`
                INSERT INTO news_dokkai_cache (news_url, news_title, dokkai_json, created_at)
                VALUES (?1, ?2, ?3, datetime('now'))
                ON CONFLICT(news_url) DO UPDATE SET
                  news_title = excluded.news_title,
                  dokkai_json = excluded.dokkai_json,
                  created_at = datetime('now')
              `).bind(requestedLink, newsTitle, responseText).run();
            } catch (cacheSaveErr) {
              // Nếu chưa tạo bảng → bỏ qua, vẫn trả về bình thường
              console.warn("Không save được cache D1:", cacheSaveErr.message);
            }
          }

          return new Response(responseText, {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }


      // =========================================================================
      // 🟢 ENDPOINT: UPLOAD IMAGE — proxy qua imgbb để ẩn API key
      // Frontend gửi base64 → Worker gọi imgbb API (với secret key) → trả URL
      // Cách này ẩn IMGBB_API_KEY khỏi frontend, tránh bị view source lấy key
      // Ảnh tự xóa sau 1 giờ (expiration: 3600)
      // =========================================================================
      if (path === "/api/upload-image" && request.method === "POST") {
        try {
          const { image } = await request.json();
          if (!image || typeof image !== 'string') {
            return new Response(JSON.stringify({ error: "Missing image data" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          if (!env.IMGBB_API_KEY) {
            return new Response(JSON.stringify({ error: "Server chưa cấu hình IMGBB_API_KEY" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
          // Strip prefix "data:image/jpeg;base64,"
          const base64Match = image.match(/^data:image\/[a-z]+;base64,(.+)$/i);
          const base64Clean = base64Match ? base64Match[1] : image;

          // Gọi imgbb API từ server-side (key ẩn trong env)
          const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}&expiration=3600`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `image=${encodeURIComponent(base64Clean)}`
          });

          if (!imgbbResponse.ok) {
            const errText = await imgbbResponse.text().catch(() => '');
            console.warn('imgbb upload failed:', imgbbResponse.status, errText);
            return new Response(JSON.stringify({
              error: `imgbb HTTP ${imgbbResponse.status}`,
              detail: errText.slice(0, 300)
            }), {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const imgbbData = await imgbbResponse.json();
          if (!imgbbData.success || !imgbbData.data || !imgbbData.data.url) {
            return new Response(JSON.stringify({ error: "imgbb upload failed" }), {
              status: 502,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          return new Response(JSON.stringify({
            success: true,
            url: imgbbData.data.url,
            delete_url: imgbbData.data.delete_url || null,
            expiresIn: 3600
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }


      if (path === "/api/update-examples" && request.method === "POST") {
        const { word, examples } = await request.json();
        if (!word || !examples || !Array.isArray(examples)) {
          return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
        }
        const cappedExamples = examples.slice(0, 15);
        await env.DB.prepare("UPDATE dictionary SET examples = ? WHERE word = ?").bind(JSON.stringify(cappedExamples), word).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // =========================================================================
      // 🟢 ENDPOINT: AI GEMINI STREAM (Xoay tua ngẫu nhiên nhiều Key)
      // =========================================================================
      if (path === "/api/gemini" && request.method === "POST") {
        try {
          // 🟢 Refactor: hỗ trợ cả `prompt` (string) cũ và `messages` (array) mới.
          // - Nếu client gửi `messages` array → ưu tiên dùng (multi-turn cho chat)
          // - Nếu chỉ gửi `prompt` string → fallback về single-turn (backwards-compat)
          // 🟢 Multi-turn: build `contents` array với role user/model (Gemini API format)
          // 🟢 Vision: inject ảnh vào user message cuối cùng (giống Groq)
          const reqBody = await request.json();
          // 🟢 task: 'light' | 'heavy' — chọn thinkingLevel cho Gemini 3
          // - light: sinh ví dụ, mnemonic, chat, tra từ điển (task ngắn, output ngắn) → thinkingLevel "low"
          // - heavy: PDF AI, daily story, admin auto-fill, grammar analysis (task dài, output dài) → thinkingLevel "high"
          // Mặc định 'light' để tránh tốn token vô ích cho task đơn giản.
          const { prompt, images = [], messages = null, task = 'light' } = reqBody;

          const keysString = env.GEMINI_API_KEYS;
          if (!keysString) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Chưa cấu hình biến môi trường GEMINI_API_KEYS" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
          if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Biến môi trường GEMINI_API_KEYS trống" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          let startIndex = Math.floor(Math.random() * apiKeys.length);
          let lastErrorMessage = "";

          // 🟢 BUILD CONTENTS: Hỗ trợ cả single-turn (prompt string) và multi-turn (messages array)
          let contents;
          if (Array.isArray(messages) && messages.length > 0) {
            // MULTI-TURN mode: convert OpenAI format → Gemini format
            // OpenAI:  { role: "user"|"assistant"|"system", content: "..." }
            // Gemini:  { role: "user"|"model", parts: [{text: "..."}] }
            // (Gemini không có role "system" → gộp system message vào user đầu tiên)
            let systemPrefix = "";
            const turnMessages = [];
            for (const m of messages) {
              if (m.role === 'system') {
                // Gộp system messages thành prefix cho user đầu tiên
                systemPrefix += (systemPrefix ? "\n" : "") + m.content;
              } else {
                turnMessages.push(m);
              }
            }
            // Nếu có system prefix và user đầu tiên → prepend
            if (systemPrefix && turnMessages.length > 0 && turnMessages[0].role === 'user') {
              turnMessages[0] = {
                ...turnMessages[0],
                content: systemPrefix + "\n\n" + turnMessages[0].content
              };
            } else if (systemPrefix) {
              // Chỉ có system, không có user → tạo user message
              turnMessages.unshift({ role: 'user', content: systemPrefix });
            }

            contents = turnMessages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content || '' }]
            }));

            // 🟢 VISION: Inject ảnh vào user message cuối cùng (nếu có)
            if (images && Array.isArray(images) && images.length > 0) {
              let lastUserIdx = contents.length - 1;
              while (lastUserIdx >= 0 && contents[lastUserIdx].role !== 'user') lastUserIdx--;
              if (lastUserIdx >= 0) {
                const imageParts = images.map(imgString => {
                  const cleanBase64 = imgString.includes(',') ? imgString.split(',')[1] : imgString;
                  return { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } };
                });
                contents[lastUserIdx].parts = [...imageParts, ...contents[lastUserIdx].parts];
              }
            }
          } else {
            // SINGLE-TURN mode (backwards-compat): prompt string + optional images
            const partsArray = [{ text: prompt }];
            if (images && Array.isArray(images) && images.length > 0) {
              images.forEach(imgString => {
                const cleanBase64 = imgString.includes(',') ? imgString.split(',')[1] : imgString;
                partsArray.push({
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64
                  }
                });
              });
            }
            contents = [{ parts: partsArray }];
          }

          // 🟢 Refactor: thêm fetchWithTimeout cho Gemini.
          // 🟢 BUMP timeout: gemini-3-flash-preview là reasoning model → có thể mất 10-60s
          // trước byte đầu (reasoning + processing).
          const hasImages = (images && Array.isArray(images) && images.length > 0) ||
                            (Array.isArray(messages) && messages.some(m =>
                              Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')));
          // 🟢 BUMP 90s → 120s (text): timeout này chỉ phủ giai đoạn Worker chờ
          // Google gửi RESPONSE HEADERS (từ lúc fetch tới khi resolve). Với payload
          // lớn (PDF AI, long prompt) Google có thể mất >90s để chấp nhận request.
          // Sau khi headers đến, fetchWithTimeout đã tự clear timer → stream KHÔNG
          // bị cắt bởi timeout này (heartbeat lo phần giữ kết nối sau đó).
          const fetchTimeoutMs = hasImages ? 180000 : 120000;  // 180s vision, 120s text

          for (let i = 0; i < apiKeys.length; i++) {
            const currentIndex = (startIndex + i) % apiKeys.length;
            const currentKey = apiKeys[currentIndex];

            try {
              const modelName = "gemini-3-flash-preview";
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${currentKey}`;

              // 🟢 FIX (31/08/2026): thinkingBudget (số token) đã là LEGACY với Gemini 3.
              // Google thay thế bằng thinkingLevel (enum: "minimal" | "low" | "medium" | "high").
              // LƯU Ý:
              //   1. gemini-3-flash-preview hỗ trợ ĐỦ 4 mức (minimal/low/medium/high), default HIGH.
              //   2. Nếu gửi CẢ thinkingLevel VÀ thinkingBudget trong cùng request
              //      → Google trả về lỗi 400 ("You cannot use both").
              // Ánh xạ task (default của model là "high" — khá tốn token):
              //   - 'light' → "low":  task đơn giản → reasoning nhanh, không lãng phí token
              //   - 'heavy' → "high": task phức tạp → reasoning sâu, output chất lượng cao
              const thinkingLevel = (task === 'heavy') ? "high" : "low";

              const response = await fetchWithTimeout(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: contents,
                  generationConfig: {
                    // 🟢 FIX (31/08/2026): Google khuyến nghị GIỮ temperature mặc định (1.0)
                    // cho MỌI model Gemini 3 — đặt < 1.0 có thể gây hành vi bất thường
                    // (giảm chất lượng reasoning). → Xóa field temperature để dùng default.
                    maxOutputTokens: 65536,
                    thinkingConfig: {
                      thinkingLevel: thinkingLevel
                    }
                  }
                })
              }, fetchTimeoutMs);

              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error?.message || `Lỗi HTTP ${response.status} từ Google Gemini`);
              }

              // 🟢 HEARTBEAT: giữ kết nối sống khi Gemini đang think (không phát byte)
              // → chống carrier/proxy drop connection + frontend per-chunk timeout
              return new Response(withSSEHeartbeat(response.body), {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                }
              });

            } catch (error) {
              // 🟢 Phân loại lỗi timeout vs lỗi thường
              if (error.name === 'AbortTimeoutError') {
                console.warn(`⚠️ Gemini API Key thứ ${currentIndex + 1} timeout sau ${fetchTimeoutMs/1000}s`);
                lastErrorMessage = `Timeout sau ${fetchTimeoutMs/1000}s`;
              } else {
                console.warn(`⚠️ API Key thứ ${currentIndex + 1} thất bại:`, error.message);
                lastErrorMessage = error.message;
              }
            }
          }

          console.error("❌ Tất cả API Keys đều đã cạn kiệt hoặc gặp lỗi.");
          return new Response(JSON.stringify({ 
            error: 'Hệ thống AI đang bận hoặc quá tải. Vui lòng thử lại sau!',
            detail: lastErrorMessage 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      // 🟢 ENDPOINT: AI GROQ STREAM (Xoay tua ngẫu nhiên nhiều Key)
      // =========================================================================
      if (path === "/api/groq" && request.method === "POST") {
        try {
          // 🟢 BACKWARDS-COMPAT: Hỗ trợ cả `prompt` (string) cũ và `messages` (array) mới.
          // - Nếu client gửi `messages` array → ưu tiên dùng (cho phép tách role system/user)
          // - Nếu chỉ gửi `prompt` string → fallback về `[{role:"user", content: prompt}]`
          const reqBody = await request.json();
          // 🟢 Tham số `max_tokens` (optional) cho phép frontend override budget.
          // Mặc định Worker tự chọn theo model (xem MAX_COMPLETION_TOKENS_BY_MODEL).
          // Frontend có thể gửi max_tokens=8192 cho task phức tạp (PDF AI, grammar, ...).
          const { prompt, model = "qwen/qwen3.8-27b", images = [], max_tokens = null } = reqBody;
          let messages;
          if (Array.isArray(reqBody.messages) && reqBody.messages.length > 0) {
            messages = reqBody.messages;
          } else {
            messages = [{ role: "user", content: prompt }];
          }

          const keysString = env.GROQ_API_KEYS;
          if (!keysString) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Chưa cấu hình biến môi trường GROQ_API_KEYS trên Cloudflare" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
          if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Biến môi trường GROQ_API_KEYS trống" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          // 🟢 XÂY DỰNG PAYLOAD: Hỗ trợ cả TEXT thuần và VISION (ảnh)
          // OpenAI-compatible format: content có thể là string (text) hoặc mảng (text + image_url)
          // Qwen 3.8 27B và Llama 4 Maverick đều hỗ trợ image_url qua Groq API
          const hasImages = Array.isArray(images) && images.length > 0;

          if (hasImages) {
            // VISION MODE: Inject ảnh vào message cuối cùng (giả định là message của user)
            // 🟢 THÊM detail: "low" → Groq chỉ tính 85 token/ảnh (fixed)
            // thay vì tính token cho base64 string như text (~8000 token)
            // Đây là cách Groq Playground dùng để không bị TPM limit
            const lastIdx = messages.length - 1;
            const lastMsg = messages[lastIdx];
            const lastText = typeof lastMsg.content === 'string' ? lastMsg.content : '';
            lastMsg.content = [
              ...images.map(img => ({
                type: "image_url",
                image_url: { url: img, detail: "low" }
              })),
              { type: "text", text: lastText || prompt || '' }
            ];
          }

          let startIndex = Math.floor(Math.random() * apiKeys.length);
          let lastErrorMessage = "";

          // 🟢 Refactor: dùng fetchWithTimeout thay cho setTimeout + AbortController thủ công.
          // Lý do: pattern cũ gây lỗi "fetchTimeoutId is not defined" do const trong try
          // là block-scoped, catch không thấy được. fetchWithTimeout tự quản lý timer
          // nội bộ qua .finally() → không còn vấn đề scoping.
          // Timeout phân tầng: 90s cho vision (OCR + fetch ảnh), 30s cho text thuần.
          const fetchTimeoutMs = hasImages ? 90000 : 30000;

          for (let i = 0; i < apiKeys.length; i++) {
            const currentIndex = (startIndex + i) % apiKeys.length;
            const currentKey = apiKeys[currentIndex];

            try {
              let finalKey = currentKey;
              let apiUrl = "https://api.groq.com/openai/v1/chat/completions";
              let modelId = model;

              // Phân định API theo tiền tố (Hỗ trợ mở rộng tương lai)
              if (currentKey.startsWith("mistral:")) {
                apiUrl = "https://api.mistral.ai/v1/chat/completions";
                finalKey = currentKey.replace("mistral:", "");
              } else if (currentKey.startsWith("cerebras:")) {
                apiUrl = "https://api.cerebras.ai/v1/chat/completions";
                finalKey = currentKey.replace("cerebras:", "");
              }

              // 🟢 fetchWithTimeout: nếu Groq không phản hồi trong fetchTimeoutMs
              // → throw AbortTimeoutError (đã được helper convert từ AbortError)
              //
              // 🟢 FIX "max_completion_tokens must be <= 16384":
              // Groq cập nhật giới hạn output token theo từng model.
              //
              // 🟢 FIX "Requested 16572 tokens, TPM Limit 8000":
              // Qwen 3.8 là reasoning model — có xu hướng "lấp đầy" max_completion_tokens
              // bằng reasoning tokens dù câu hỏi đơn giản. Đặt 16384 → model suy nghĩ
              // 16000 token cho cả câu "bạn là ai" → vượt TPM ngay lần đầu.
              // Giải pháp: giảm budget mặc định xuống 4096 (đủ cho reasoning + answer).
              //
              // 🟢 OVERRIDE: Frontend có thể gửi `max_tokens` trong request body
              // để tăng budget cho task phức tạp (PDF AI, grammar, ...).
              // Cap tối đa 16384 theo giới hạn của Qwen 3.8 trên Groq.
              const MAX_COMPLETION_TOKENS_BY_MODEL = {
                "qwen/qwen3.8-27b": 4096,
                "meta-llama/llama-4-maverick-17b-128e-instruct": 4096
              };
              const modelDefault = MAX_COMPLETION_TOKENS_BY_MODEL[modelId] || 4096;
              // 🟢 Ưu tiên max_tokens từ frontend, nhưng cap ở 16384 để tránh lỗi 400
              const maxCompletionTokens = max_tokens
                ? Math.min(Math.max(parseInt(max_tokens, 10) || modelDefault, 512), 16384)
                : modelDefault;

              const response = await fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${finalKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: modelId,
                  messages: messages,
                  // 🟢 BUMP temperature 0.2 → 0.6: Reasoning model cần nhiệt độ cao hơn
                  // để suy nghĩ linh hoạt. 0.2 quá thấp → output bị "lười suy nghĩ".
                  temperature: 0.6,
                  // 🟢 Sử dụng max tokens động theo model (xem MAX_COMPLETION_TOKENS_BY_MODEL ở trên).
                  // Đây là ceiling, không phải tiêu thụ thực tế. Reasoning Qwen 3.8 thường ăn 3-6k tokens.
                  max_completion_tokens: maxCompletionTokens,
                  stream: true,
                  // 🟢 Đổi từ "hidden" → "parsed":
                  // - "hidden": Qwen vẫn tính reasoning tokens nhưng không trả về → tối nghĩa, lãng phí
                  // - "parsed": Reasoning được tách riêng vào delta.reasoning, content chỉ có final answer
                  // Frontend chỉ render delta.content → tự động clean, không cần regex.
                  reasoning_format: "parsed"
                })
              }, fetchTimeoutMs);

              if (!response.ok) {
                // 🟢 Log chi tiết lỗi để debug (đặc biệt cho vision request)
                let errDetail = `HTTP ${response.status}`;
                try {
                    const data = await response.json().catch(() => null);
                    if (data) {
                        errDetail = data.error?.message || data.error || data.detail || JSON.stringify(data).slice(0, 300);
                    } else {
                        const textResp = await response.text().catch(() => '');
                        if (textResp) errDetail = textResp.slice(0, 300);
                    }
                } catch (_) {}
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} thất bại (${modelId}):`, errDetail);
                throw new Error(errDetail);
              }

              // 🟢 LỌC STREAM: Khi reasoning_format="parsed", Groq gửi các chunk có dạng:
              //   data: {"choices":[{"delta":{"reasoning":"..."}}]}    ← reasoning nội bộ
              //   data: {"choices":[{"delta":{"content":"..."}}]}     ← output thật
              // Frontend chỉ quan tâm content. Ta forward thẳng response.body vì:
              // 1. parseOpenAIStream ở frontend chỉ đọc delta.content → tự động bỏ reasoning
              // 2. Giữ nguyên stream giúp SSE pass-through, không cần parse lại Worker-side
              // (Nếu sau này cần lọc triệt để, dùng TransformStream để strip reasoning chunks.)
              // 🟢 HEARTBEAT: giữ kết nối sống khi Qwen đang reason (không phát byte)
              return new Response(withSSEHeartbeat(response.body), {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                }
              });

            } catch (error) {
              // 🟢 Refactor: không còn cần clear timeout thủ công — fetchWithTimeout
              // đã tự clear qua .finally(). Chỉ cần phân loại lỗi.
              if (error.name === 'AbortTimeoutError') {
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} timeout sau ${fetchTimeoutMs/1000}s`);
                lastErrorMessage = `Timeout sau ${fetchTimeoutMs/1000}s (vision request chậm — thử gửi ảnh nhỏ hơn)`;
              } else {
                console.warn(`⚠️ Groq API Key thứ ${currentIndex + 1} thất bại:`, error.message);
                lastErrorMessage = error.message;
              }
              // 🔄 Tiếp tục vòng for thử key kế tiếp
            }
          }

          console.error("❌ Tất cả API Keys của Groq đều đã cạn kiệt hoặc gặp lỗi.");
          return new Response(JSON.stringify({
            error: 'Hệ thống Groq đang bận hoặc quá tải. Vui lòng thử lại sau!',
            detail: lastErrorMessage
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }

      // =========================================================================
      // 🟢 ENDPOINT: AI MISTRAL STREAM (Xoay tua ngẫu nhiên nhiều Key)
      // =========================================================================
      if (path === "/api/mistral" && request.method === "POST") {
        try {
          // 🟢 BACKWARDS-COMPAT: Hỗ trợ cả `prompt` (string) cũ và `messages` (array) mới.
          const reqBody = await request.json();
          const { prompt, model = "mistral-small-latest" } = reqBody;
          let messages;
          if (Array.isArray(reqBody.messages) && reqBody.messages.length > 0) {
            messages = reqBody.messages;
          } else {
            messages = [{ role: "user", content: prompt }];
          }
          
          const keysString = env.MISTRAL_API_KEYS;
          if (!keysString) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Chưa cấu hình biến môi trường MISTRAL_API_KEYS trên Cloudflare" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          const apiKeys = keysString.split(',').map(key => key.trim()).filter(key => key.length > 0);
          if (apiKeys.length === 0) {
            return new Response(JSON.stringify({ error: "Lỗi Server: Biến môi trường MISTRAL_API_KEYS trống" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          let startIndex = Math.floor(Math.random() * apiKeys.length);
          let lastErrorMessage = "";

          // 🟢 Refactor: Mistral không phải reasoning model nhưng vẫn có thể bị
          // upstream treo (half-open connection, load balancer chết mềm).
          // Thêm fetchWithTimeout 60s để fail-fast → thử key kế tiếp trong for-loop.
          // 60s là biên an toàn cho Mistral Small (thường emit token ngay < 3s).
          const fetchTimeoutMs = 60000;

          for (let i = 0; i < apiKeys.length; i++) {
            const currentIndex = (startIndex + i) % apiKeys.length;
            const currentKey = apiKeys[currentIndex];

            try {
              const response = await fetchWithTimeout("https://api.mistral.ai/v1/chat/completions", {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: model,
                  messages: messages,
                  // 🟢 BUMP temperature 0.2 → 0.6 để đồng bộ với Groq
                  temperature: 0.6,
                  stream: true
                })
              }, fetchTimeoutMs);

              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error?.message || `Lỗi HTTP ${response.status} từ Mistral`);
              }

              // 🟢 HEARTBEAT: đồng bộ với Gemini/Groq — chống đứt đoạn khi model im lặng
              return new Response(withSSEHeartbeat(response.body), {
                status: 200,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                }
              });

            } catch (error) {
              // 🟢 Phân loại lỗi timeout vs lỗi thường để log rõ ràng
              if (error.name === 'AbortTimeoutError') {
                console.warn(`⚠️ Mistral API Key thứ ${currentIndex + 1} timeout sau ${fetchTimeoutMs/1000}s`);
                lastErrorMessage = `Timeout sau ${fetchTimeoutMs/1000}s`;
              } else {
                console.warn(`⚠️ Mistral API Key thứ ${currentIndex + 1} thất bại:`, error.message);
                lastErrorMessage = error.message;
              }
            }
          }

          console.error("❌ Tất cả API Keys của Mistral đều đã cạn kiệt hoặc gặp lỗi.");
          return new Response(JSON.stringify({ 
            error: 'Hệ thống Mistral đang bận hoặc quá tải. Vui lòng thử lại sau!',
            detail: lastErrorMessage 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });

        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
      // =========================================================================
      // 🔒 PHÂN HỆ API ADMIN: BẢO VỆ & THAO TÁC CƠ SỞ DỮ LIỆU D1
      // =========================================================================
      if (path.startsWith("/api/admin/")) {
        // 1. Chốt chặn bảo mật Admin Token
        if (!checkAdminAuth(request, env)) {
          return new Response(JSON.stringify({ error: "Unauthorized: Khóa xác thực Admin không hợp lệ hoặc đã hết hạn!" }), {
            status: 401,
            headers: corsHeaders
          });
        }

        // API 1: CẬP NHẬT METADATA CHỦ ĐỀ (SƠ ĐỒ CÂY)
        if (path === "/api/admin/update-metadata" && request.method === "POST") {
          const { action, tag_id, display_name, category, parent_id, sort_order, search_keywords } = await request.json();

          if (!action || !tag_id) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400, headers: corsHeaders });
          }

          if (action === "insert" || action === "update") {
            // TỰ ĐỘNG CHUYỂN ĐỔI PHÒNG THỦ: Tránh lỗi D1_TYPE_ERROR của Cloudflare
            const db_parent_id = parent_id !== undefined ? parent_id : null;
            const db_sort_order = sort_order !== undefined ? sort_order : 0;
            const db_search_keywords = search_keywords !== undefined ? search_keywords : null;

            await env.DB.prepare(`
              INSERT INTO thematic_metadata (tag_id, display_name, category, parent_id, sort_order, search_keywords)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6)
              ON CONFLICT(tag_id) DO UPDATE SET
                display_name = excluded.display_name,
                category = excluded.category,
                parent_id = excluded.parent_id,
                sort_order = excluded.sort_order,
                search_keywords = excluded.search_keywords
            `).bind(tag_id, display_name, category, db_parent_id, db_sort_order, db_search_keywords).run();

            return new Response(JSON.stringify({ success: true, message: "Metadata synchronized successfully" }), { headers: corsHeaders });
          }

          if (action === "delete") {
            // 1. Quét tìm toàn bộ danh sách mã tag con trực thuộc tag sắp xóa
            const children = await env.DB.prepare("SELECT tag_id FROM thematic_metadata WHERE parent_id = ?1").bind(tag_id).all();
            
            const tagsToDelete = [tag_id];
            if (children.results && children.results.length > 0) {
              children.results.forEach(row => tagsToDelete.push(row.tag_id));
            }

            // 2. Tìm tất cả các từ trong từ điển có chứa bất kỳ tag nào trong danh sách bị xóa
            const instrConditions = tagsToDelete.map(() => "instr(tags, ',' || ? || ',') > 0").join(" OR ");
            const searchStmt = env.DB.prepare(`SELECT id, tags FROM dictionary WHERE ${instrConditions}`);
            
            // Chỉ cần truyền trực tiếp mã tag, không cần bọc chuỗi % ở ngoài nữa
            const bindParams = tagsToDelete;
            const { results: wordsToClean } = await searchStmt.bind(...bindParams).all();

            const batchStatements = [];

            // 3. Tiến hành bóc tách và làm sạch triệt để bằng Javascript trên từng dòng từ vựng
            if (wordsToClean && wordsToClean.length > 0) {
              const updateStmt = env.DB.prepare("UPDATE dictionary SET tags = ?2 WHERE id = ?1");
              
              wordsToClean.forEach(row => {
                const currentTags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
                
                // Gỡ bỏ chính xác tuyệt đối các nhãn nằm trong danh sách xóa
                const cleanedTags = currentTags.filter(t => !tagsToDelete.includes(t));
                
                // Chuẩn hóa và gộp mảng sạch
                const uniqueCleanedTags = [...new Set(cleanedTags)];
                // 🟢 FIX BUG: trước đây nhầm `\${...}` (escape) → cột tags bị ghi thành chuỗi
                // literal "${uniqueCleanedTags.join(',')}" khi xóa 1 tag mà từ còn tag khác.
                // Bỏ dấu \ để template literal thực sự nối danh sách tag (đúng như dòng 1545).
                const cleanTagsString = uniqueCleanedTags.length > 0 ? `,${uniqueCleanedTags.join(',')},` : null;
                
                batchStatements.push(updateStmt.bind(row.id, cleanTagsString));
              });
            }

            // 4. Tạo lệnh xóa nhãn trong sơ đồ cây thematic_metadata
            batchStatements.push(env.DB.prepare("DELETE FROM thematic_metadata WHERE parent_id = ?1").bind(tag_id));
            batchStatements.push(env.DB.prepare("DELETE FROM thematic_metadata WHERE tag_id = ?1").bind(tag_id));

            // 5. Thực thi chia nhỏ Batch 100 câu ghi đè lên D1 an toàn
            const chunkSize = 100;
            for (let i = 0; i < batchStatements.length; i += chunkSize) {
              const chunk = batchStatements.slice(i, i + chunkSize);
              await env.DB.batch(chunk);
            }

            return new Response(JSON.stringify({ success: true, message: "Metadata and word tags cleaned up successfully" }), { headers: corsHeaders });
          }
        }

        // API 2: GÁN NHÃN TAG TỪ VỰNG HÀNG LOẠT (CÓ TỰ ĐỘNG DỌN DẸP NHÃN CHA DƯ THỪA)
        if (path === "/api/admin/tag-words" && request.method === "POST") {
          const { tag_id, parent_tag_id, words } = await request.json();

          if (!tag_id || !words || !Array.isArray(words) || words.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
          }

          let stmt;
          if (parent_tag_id) {
            // Thay thế NOT LIKE bằng instr() = 0 để tránh sập giới hạn 50-Byte
            stmt = env.DB.prepare(`
              UPDATE dictionary 
              SET tags = ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ',' || ?3 || ','
              WHERE word = ?1 AND (tags IS NULL OR instr(tags, ',' || ?3 || ',') = 0)
            `);
          } else {
            // Thay thế NOT LIKE bằng instr() = 0 và dọn nốt hàm TRIM(BOTH...) cũ
            stmt = env.DB.prepare(`
              UPDATE dictionary 
              SET tags = ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ',' || ?2 || ','
              WHERE word = ?1 AND (tags IS NULL OR instr(tags, ',' || ?2 || ',') = 0)
            `);
          }

          const batchStatements = [];
          words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord) {
              if (parent_tag_id) {
                batchStatements.push(stmt.bind(cleanWord, parent_tag_id, tag_id));
              } else {
                batchStatements.push(stmt.bind(cleanWord, tag_id));
              }
            }
          });

          if (batchStatements.length > 0) {
            await env.DB.batch(batchStatements);
          }

          return new Response(JSON.stringify({ success: true, count: batchStatements.length }), { headers: corsHeaders });
        }

        // API 3: GỠ NHÃN TAG KHỎI TỪ VỰNG HÀNG LOẠT
        if (path === "/api/admin/untag-words" && request.method === "POST") {
          const { tag_id, words } = await request.json();

          if (!tag_id || !words || !Array.isArray(words) || words.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
          }

          // Xóa nhãn tag con ra khỏi chuỗi tags. Nếu sau khi xóa không còn tag nào, tự động gán về NULL
          const stmt = env.DB.prepare(`
            UPDATE dictionary 
            SET tags = CASE 
              WHEN TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') = '' THEN NULL
              ELSE ',' || TRIM(REPLACE(REPLACE(COALESCE(tags, ''), ',' || ?2 || ',', ','), ',,', ','), ',') || ','
            END
            WHERE word = ?1
          `);

          const batchStatements = [];
          words.forEach(word => {
            const cleanWord = word.trim();
            if (cleanWord) {
              batchStatements.push(stmt.bind(cleanWord, tag_id));
            }
          });

          if (batchStatements.length > 0) {
            await env.DB.batch(batchStatements);
          }

          return new Response(JSON.stringify({ success: true, count: batchStatements.length }), { headers: corsHeaders });
        }
        // API 4: LÀM SẠCH VÀ TIÊU DIỆT TOÀN BỘ NHÃN MỒ CÔI (ORPHANED TAGS) KHÔNG CÒN TRÊN SƠ ĐỒ CÂY
        if (path === "/api/admin/sanitize-db-tags" && request.method === "POST") {
          // 1. Lấy toàn bộ danh sách các mã tag đang tồn tại thực tế trên Sơ đồ cây hệ thống
          const { results: validMetadata } = await env.DB.prepare("SELECT tag_id FROM thematic_metadata").all();
          
          // Đưa vào Set để kiểm tra O(1) siêu tốc
          const validTagsSet = new Set(validMetadata ? validMetadata.map(m => m.tag_id) : []);

          // 2. Quét tìm tất cả các từ đang có gắn nhãn tags dưới từ điển
          const { results } = await env.DB.prepare("SELECT id, word, tags FROM dictionary WHERE tags IS NOT NULL AND tags != ''").all();
          
          if (!results || results.length === 0) {
            return new Response(JSON.stringify({ success: true, total_cleaned: 0 }), { headers: corsHeaders });
          }

          const batchStatements = [];
          const updateStmt = env.DB.prepare("UPDATE dictionary SET tags = ?2 WHERE id = ?1");
          
          let cleanedCount = 0;

          // 3. Thực thi thuật toán kiểm duyệt chéo bằng JS
          results.forEach(row => {
            const rawTags = row.tags.split(',').map(t => t.trim()).filter(Boolean);
            
            // CHỈ GIỮ LẠI: Các tag thực sự tồn tại trong sơ đồ cây (thematic_metadata)
            // Tự động triệt tiêu các nhãn mồ côi (đã bị xóa từ trước) và lọc trùng lặp
            const cleanedTags = rawTags.filter(t => validTagsSet.has(t));
            const uniqueTags = [...new Set(cleanedTags)];
            
            // Định cấu trúc chuỗi tag chuẩn hóa sạch sẽ
            const cleanTagsString = uniqueTags.length > 0 ? `,${uniqueTags.join(',')},` : null;
            
            // Nếu phát hiện chuỗi tag bị lệch (do có chứa nhãn mồ côi hoặc trùng lặp) -> Cập nhật
            if (cleanTagsString !== row.tags) {
              batchStatements.push(updateStmt.bind(row.id, cleanTagsString));
              cleanedCount++;
            }
          });

          // 4. Chia nhỏ Batch 100 câu ghi đè lên D1 an toàn
          const chunkSize = 100;
          for (let i = 0; i < batchStatements.length; i += chunkSize) {
            const chunk = batchStatements.slice(i, i + chunkSize);
            await env.DB.batch(chunk);
          }

          return new Response(JSON.stringify({ success: true, total_cleaned: cleanedCount }), { headers: corsHeaders });
        }
        // API 5: BIÊN TẬP VÀ CẬP NHẬT CHI TIẾT TỪ VỰNG TRỰC TIẾP TRÊN TỪ ĐIỂN GỐC D1
        if (path === "/api/admin/update-dictionary-word" && request.method === "POST") {
          const { id, word, reading, meaning, hv, level, examples } = await request.json();

          if (!id || !word || !reading || !meaning) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400, headers: corsHeaders });
          }

          // Chuẩn hóa và làm sạch chuỗi mảng ví dụ JSON trước khi ghi vào SQLite
          const examplesJsonStr = typeof examples === 'string' ? examples : JSON.stringify(examples || []);

          await env.DB.prepare(`
            UPDATE dictionary 
            SET word = ?2, reading = ?3, meaning = ?4, hv = ?5, level = ?6, examples = ?7
            WHERE id = ?1
          `).bind(
            id, 
            word.trim(), 
            reading.trim(), 
            meaning.trim(), 
            (hv || '').trim().toUpperCase(), // Hán Việt luôn ghi tự động dạng viết hoa
            level || 'N3', 
            examplesJsonStr
          ).run();

          return new Response(JSON.stringify({ success: true, message: "Dictionary word updated successfully" }), { headers: corsHeaders });
        }
      }

      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};

export {
  worker_default as default
};
