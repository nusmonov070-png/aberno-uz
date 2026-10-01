/**
 * Aberno — onlayn buyurtmalarni Telegram botga yuboruvchi Google Apps Script.
 *
 * Bu faylda hech qanday maxfiy ma'lumot yo'q. Bot tokeni va chat ID
 * "Project Settings → Script properties" da saqlanadi (SOZLASH.md ga qarang):
 *   TELEGRAM_TOKEN   — @BotFather bergan token
 *   TELEGRAM_CHAT_ID — buyurtmalar keladigan chat yoki guruh ID si
 */

const MAX_ITEMS = 60;
const MAX_QTY = 999;
const PHONE_COOLDOWN_SEC = 60;       // bitta raqamdan 1 daqiqada 1 ta buyurtma
const GLOBAL_LIMIT = 40;             // 10 daqiqada jami ko'pi bilan 40 ta buyurtma
const GLOBAL_WINDOW_SEC = 600;

function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 20000) return reply_({ ok: false, error: "bad_request" });
    const data = JSON.parse(e.postData.contents);

    // Botlar uchun tuzoq: odam bu maydonni ko'rmaydi. To'lgan bo'lsa — jimgina "ok" qaytaramiz.
    if (data.website) return reply_({ ok: true });

    const order = validate_(data);
    if (!order) return reply_({ ok: false, error: "invalid" });

    const cache = CacheService.getScriptCache();
    const phoneKey = "phone:" + order.phoneDigits;
    if (cache.get(phoneKey)) return reply_({ ok: false, error: "too_fast" });
    const count = Number(cache.get("global") || 0);
    if (count >= GLOBAL_LIMIT) return reply_({ ok: false, error: "busy" });

    const id = nextOrderId_();
    sendTelegram_(formatMessage_(id, order));

    cache.put(phoneKey, "1", PHONE_COOLDOWN_SEC);
    cache.put("global", String(count + 1), GLOBAL_WINDOW_SEC);
    return reply_({ ok: true, id: String(id) });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: "server" });
  }
}

// Brauzerda Web app manzilini ochib, ishlayotganini tekshirish uchun
function doGet() {
  return reply_({ ok: true, service: "aberno-orders" });
}

function validate_(d) {
  const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const name = str(d.name, 60);
  const phone = str(d.phone, 20);
  const phoneDigits = phone.replace(/\D/g, "");
  if (name.length < 2 || phoneDigits.length < 9 || phoneDigits.length > 15) return null;
  if (!Array.isArray(d.items) || d.items.length < 1 || d.items.length > MAX_ITEMS) return null;

  const items = [];
  for (const it of d.items) {
    if (!it || typeof it.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(it.id)) return null;
    const qty = Number(it.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    const price = it.price === null ? null : Number(it.price);
    if (price !== null && (!Number.isInteger(price) || price < 0 || price > 100000000)) return null;
    items.push({ name: str(it.name, 100), variant: str(it.variant, 100), unit: str(it.unit, 20), qty, price });
  }
  return {
    name, phone, phoneDigits, items,
    type: str(d.type, 40),
    address: str(d.address, 200),
    comment: str(d.comment, 500),
  };
}

function nextOrderId_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const id = Number(props.getProperty("LAST_ORDER_ID") || 1000) + 1;
    props.setProperty("LAST_ORDER_ID", String(id));
    return id;
  } finally {
    lock.releaseLock();
  }
}

function formatMessage_(id, o) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
  const time = Utilities.formatDate(new Date(), "Asia/Tashkent", "dd.MM.yyyy HH:mm");

  let total = 0;
  let unpriced = false;
  const lines = o.items.map((it, i) => {
    let sum = "narxi kelishiladi";
    if (it.price === null) unpriced = true;
    else { total += it.price * it.qty; sum = money(it.price * it.qty); }
    return `${i + 1}. ${esc(it.name)}\n    ${esc(it.variant)} — ${it.qty} ${esc(it.unit)} = ${sum}`;
  });

  const parts = [
    `🛒 <b>Yangi buyurtma № ${id}</b>`,
    `🕒 ${time}`,
    "",
    `👤 ${esc(o.name)}`,
    `📞 ${esc(o.phone)}`,
    o.type ? `🏷 ${esc(o.type)}` : "",
    o.address ? `📍 ${esc(o.address)}` : "",
    "",
    "<b>Mahsulotlar:</b>",
    lines.join("\n"),
    "",
    `💰 <b>Jami: ${money(total)}</b>${unpriced ? " + narxi kelishiladiganlar" : ""}`,
    "<i>(saytdagi narxlar bo'yicha — mijoz bilan tasdiqlang)</i>",
    o.comment ? `\n💬 ${esc(o.comment)}` : "",
  ];
  // Bo'sh qatorlar (kiritilmagan maydonlar) ketma-ket ikkitadan ko'p bo'lmasin; Telegram chegarasi 4096 belgi
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 4000);
}

function sendTelegram_(text) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("TELEGRAM_TOKEN");
  const chatId = props.getProperty("TELEGRAM_CHAT_ID");
  if (!token || !chatId) throw new Error("TELEGRAM_TOKEN yoki TELEGRAM_CHAT_ID kiritilmagan");

  const res = UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error("Telegram xatosi: " + res.getContentText());
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ===== Sozlash paytida qo'lda ishga tushiriladigan yordamchi funksiyalar =====

/** Botga yozgan chatlaringiz ID sini "Execution log" ga chiqaradi. */
function chatIdTopish() {
  const token = PropertiesService.getScriptProperties().getProperty("TELEGRAM_TOKEN");
  if (!token) throw new Error("Avval Script properties ga TELEGRAM_TOKEN ni kiriting");
  const res = JSON.parse(UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/getUpdates`).getContentText());
  const chats = {};
  (res.result || []).forEach((u) => {
    const m = u.message || u.channel_post || u.my_chat_member;
    if (m && m.chat) chats[m.chat.id] = m.chat.title || [m.chat.first_name, m.chat.last_name].filter(Boolean).join(" ");
  });
  if (!Object.keys(chats).length) console.log("Chat topilmadi. Botga /start yozing (yoki guruhda xabar yozing) va qayta ishga tushiring.");
  Object.entries(chats).forEach(([id, title]) => console.log(`TELEGRAM_CHAT_ID = ${id}   (${title})`));
}

/** Sozlamalar to'g'riligini tekshirish uchun sinov buyurtmasini yuboradi. */
function sinovXabar() {
  sendTelegram_(formatMessage_(0, {
    name: "Sinov", phone: "+998 90 000 00 00", type: "Sinov", address: "", comment: "Bu sinov xabari — bot to'g'ri ulangan ✅",
    items: [{ name: "Margaritto Universal 80%", variant: "200 g · qutida 30 dona", unit: "quti", qty: 1, price: 270000 }],
  }));
  console.log("Yuborildi — Telegram'ni tekshiring.");
}
