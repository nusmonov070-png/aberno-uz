# Onlayn buyurtmani Telegram botga ulash

Saytdagi buyurtma (`buyurtma.html`) Google Apps Script orqali Telegram botingizga yuboriladi.
Bot tokeni faqat sizning Google hisobingizda saqlanadi. U sayt kodida ham, GitHub'da ham bo'lmaydi.

Taxminan 10 daqiqa vaqt oladi.

---

## 1. Bot tokenini tayyorlang

1. Telegram'da **@BotFather** ga kiring, `/mybots` → botingizni tanlang → **API Token**.
2. Tokenni nusxalang. U `123456789:AA...` ko'rinishida bo'ladi.

> ⚠️ Tokenni hech kimga yubormang va hech qayerga yozmang. Agar u qachondir oshkor bo'lgan bo'lsa,
> o'sha menyuda **Revoke current token** ni bosib, yangisini oling.

## 2. Botga yozing

- Buyurtmalar **o'zingizga** kelishi kerak bo'lsa: botni oching va **/start** ni bosing.
- Buyurtmalar **guruhga** kelishi kerak bo'lsa: botni guruhga qo'shing va guruhga biror xabar yozing (masalan, "salom").

## 3. Google Apps Script loyihasini yarating

1. **https://script.google.com** ga kiring (Gmail akkauntingiz bilan) → **New project**.
2. Chap yuqoridagi "Untitled project" nomini bosib, **Aberno buyurtmalar** deb nomlang.
3. Muharrirdagi barcha kodni o'chiring va shu papkadagi **`Code.gs`** faylining to'liq matnini qo'ying.
4. 💾 **Save** (yoki `Cmd+S`).

## 4. Tokenni yashirin sozlamaga kiriting

1. Chap menyuda ⚙️ **Project Settings** ga kiring.
2. Eng pastda **Script properties** → **Add script property**:
   - Property: `TELEGRAM_TOKEN`
   - Value: 1-qadamdagi token
3. **Save script properties**.

## 5. Chat ID ni toping

1. Chap menyuda **< > Editor** ga qayting.
2. Yuqoridagi funksiyalar ro'yxatidan **`chatIdTopish`** ni tanlang va ▶ **Run** ni bosing.
3. Birinchi marta Google ruxsat so'raydi: **Review permissions** → akkauntingizni tanlang →
   "Google hasn't verified this app" chiqsa **Advanced** → **Go to Aberno buyurtmalar (unsafe)** → **Allow**.
   (Bu sizning o'zingiz yozgan skript, shuning uchun Google shunday ogohlantiradi.)
4. Pastdagi **Execution log** da `TELEGRAM_CHAT_ID = ...` qatori chiqadi. Raqamni nusxalang
   (guruh ID si minus belgisi bilan boshlanadi, masalan `-1001234567890`, uni ham qo'shib oling).
5. ⚙️ **Project Settings** → **Script properties** ga yana bitta qo'shing:
   - Property: `TELEGRAM_CHAT_ID`
   - Value: nusxalangan raqam

## 6. Sinab ko'ring

Funksiyalar ro'yxatidan **`sinovXabar`** ni tanlang → ▶ **Run**.
Telegram'ga "Yangi buyurtma № 0 … Bu sinov xabari" kelsa, hammasi to'g'ri ulangan ✅

## 7. Web app sifatida e'lon qiling

1. O'ng yuqorida **Deploy** → **New deployment**.
2. ⚙️ belgisini bosib **Web app** ni tanlang.
3. Sozlamalar:
   - Description: `Aberno buyurtmalar`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy** → **Web app URL** ni nusxalang (`https://script.google.com/macros/s/.../exec`).

Bu manzil maxfiy emas, uni bemalol menga yuborishingiz mumkin. U `js/main.js` faylidagi
`ORDER_ENDPOINT` ga yoziladi va shundan keyin saytdagi buyurtmalar va formalar botingizga kela boshlaydi.

---

## Keyinchalik

- **Kodni yangilash:** `Code.gs` ni o'zgartirgandan keyin **Deploy → Manage deployments** → ✏️ →
  Version: **New version** → **Deploy**. Web app manzili o'zgarmaydi.
- **Buyurtmalarni boshqa chatga yo'naltirish:** faqat `TELEGRAM_CHAT_ID` ni o'zgartiring.
- **Tokenni almashtirish:** @BotFather'da Revoke qiling va `TELEGRAM_TOKEN` ga yangisini yozing.

## Xavfsizlik bo'yicha qisqacha

- Token va chat ID faqat Script properties da turadi, boshqa hech qayerda saqlanmaydi.
- Skript faqat to'g'ri buyurtmani qabul qiladi: ism, telefon raqami va 1–60 ta mahsulot, har biridan 1–999 tagacha.
- Bitta telefon raqamidan daqiqasiga ko'pi bilan 1 ta, jami 10 daqiqada ko'pi bilan 40 ta buyurtma o'tadi.
- Spam yuboradigan robotlar uchun formada yashirin "tuzoq" maydon bor.
- Mijoz yozgan matn Telegram'da formatlash buyrug'i sifatida ishlamaydi, oddiy matn bo'lib chiqadi.
- Narxlar saytdan keladi. Shuning uchun xabarda ular "saytdagi narxlar bo'yicha" deb belgilanadi.
  Menejer har bir buyurtmani mijoz bilan qo'ng'iroqda tasdiqlaydi.
