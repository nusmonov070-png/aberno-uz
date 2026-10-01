// ===== Onlayn buyurtma: mahsulotlar ro'yxati (Telegram manzili — js/main.js, ORDER_ENDPOINT) =====

// Narxlar so'mda, bitta "unit" uchun (masalan 1 quti). HOZIRCHA TAXMINIY — haqiqiy narxlarni shu yerga yozing.
// null — narxi kelishiladi (savatda "Narxi kelishiladi" deb chiqadi).
// id larni o'zgartirmang: Telegram xabarida va savatda shular ishlatiladi.
const PRODUCTS = [
  // --- Margarin va spredlar (chakana) ---
  { id: "mg-universal", group: "margarin", brand: "Margaritto", name: "Margaritto Universal 80%", img: "images/margaritto-universal.jpg",
    variants: [
      { id: "mg-universal-200", label: "200 g · qutida 30 dona", unit: "quti", price: 270000 },
      { id: "mg-universal-500", label: "500 g · qutida 12 dona", unit: "quti", price: 240000 },
    ] },
  { id: "mg-pastry", group: "margarin", brand: "Margaritto", name: "Margaritto Pastry 80% — qatlamli xamir uchun", img: "images/margaritto-pastry.jpg",
    variants: [
      { id: "mg-pastry-200", label: "200 g · qutida 30 dona", unit: "quti", price: 280000 },
      { id: "mg-pastry-500", label: "500 g · qutida 12 dona", unit: "quti", price: 250000 },
    ] },
  { id: "sm-825", group: "margarin", brand: "Smaylo", name: "Smaylo spred 82,5%", img: "images/smaylo-825.jpg",
    variants: [
      { id: "sm-825-200", label: "200 g · qutida 30 dona", unit: "quti", price: 300000 },
      { id: "sm-825-500", label: "500 g · qutida 10 dona", unit: "quti", price: 230000 },
    ] },
  { id: "sm-72-table", group: "margarin", brand: "Smaylo", name: "Smaylo «Dasturxoningiz uchun» 72%", img: "images/smaylo-72-table.jpg",
    variants: [
      { id: "sm-72-table-500", label: "500 g · qutida 20 dona", unit: "quti", price: 360000 },
    ] },

  // --- Margarin va spredlar (ulgurji) ---
  { id: "mg-82-creamy", group: "margarin", brand: "Margaritto", name: "Margaritto Universal 82% — qaymoqli ta'm", img: "images/margaritto-82-creamy.jpg",
    variants: [
      { id: "mg-82-creamy-10", label: "10 kg quti", unit: "quti", price: 280000 },
      { id: "mg-82-creamy-20", label: "20 kg quti", unit: "quti", price: 550000 },
    ] },
  { id: "mg-72-creamy", group: "margarin", brand: "Margaritto", name: "Margaritto 72% — qaymoqli ta'm", img: "images/margaritto-72-creamy.jpg",
    variants: [
      { id: "mg-72-creamy-10", label: "10 kg quti", unit: "quti", price: 240000 },
      { id: "mg-72-creamy-20", label: "20 kg quti", unit: "quti", price: 470000 },
    ] },
  { id: "mg-72-creams", group: "margarin", brand: "Margaritto", name: "Margaritto 72% — kremlar uchun", img: "images/margaritto-72-creams.jpg",
    variants: [
      { id: "mg-72-creams-10", label: "10 kg quti", unit: "quti", price: 250000 },
      { id: "mg-72-creams-20", label: "20 kg quti", unit: "quti", price: 490000 },
    ] },
  { id: "mg-80-creams", group: "margarin", brand: "Margaritto", name: "Margaritto 80% — kremlar uchun (premium)", img: "images/margaritto-80-creams.jpg",
    variants: [
      { id: "mg-80-creams-10", label: "10 kg quti", unit: "quti", price: 290000 },
      { id: "mg-80-creams-20", label: "20 kg quti", unit: "quti", price: 570000 },
    ] },
  { id: "mg-puff", group: "margarin", brand: "Margaritto", name: "Margaritto 80% — qatlamli xamir uchun", img: "images/margaritto-puff-10kg.jpg",
    variants: [
      { id: "mg-puff-10", label: "10 kg quti (5 × 2 kg)", unit: "quti", price: 300000 },
    ] },
  { id: "mg-fat-99", group: "margarin", brand: "Margaritto", name: "Margaritto 99% — eritilgan o'simlik yog'i", img: "images/margaritto-fat-99.jpg",
    variants: [
      { id: "mg-fat-99-box", label: "10 kg quti", unit: "quti", price: 320000 },
      { id: "mg-fat-99-bucket", label: "10 kg chelak", unit: "chelak", price: 330000 },
    ] },
  { id: "sm-25kg", group: "margarin", brand: "Smaylo", name: "Smaylo spred 72% — 2,5 kg", img: "images/smaylo-25kg.jpg",
    variants: [
      { id: "sm-25kg-box", label: "2,5 kg · qutida 2 dona", unit: "quti", price: 120000 },
    ] },
  { id: "sz-25kg", group: "margarin", brand: "Slivochniy Zavtrak", name: "Slivochniy Zavtrak spred 72% — 2,5 kg", img: "images/creamy-breakfast.jpg",
    variants: [
      { id: "sz-25kg-box", label: "2,5 kg · qutida 2 dona", unit: "quti", price: 115000 },
    ] },

  // --- Bulut ---
  { id: "bl-salfetka-23", group: "bulut", brand: "Bulut", name: "Bulut salfetkalari 23×23", img: "images/bulut-salfetka-23.png",
    variants: [
      { id: "bl-salfetka-23-50", label: "1 qavat · 50 ta", unit: "dona", price: 4000 },
      { id: "bl-salfetka-23-100", label: "1 qavat · 100 ta", unit: "dona", price: 7000 },
    ] },
  { id: "bl-salfetka-27", group: "bulut", brand: "Bulut", name: "Bulut salfetkalari 27×27", img: "images/bulut-salfetka-27.png",
    variants: [
      { id: "bl-salfetka-27-50", label: "1 qavat · 50 ta", unit: "dona", price: 5000 },
      { id: "bl-salfetka-27-100", label: "1 qavat · 100 ta", unit: "dona", price: 9000 },
    ] },
  { id: "bl-longer", group: "bulut", brand: "Bulut", name: "Bulut Longer salfetkasi 33×32", img: "images/bulut-salfetka-longer.png",
    variants: [{ id: "bl-longer-40", label: "2 qavat · 40 ta", unit: "dona", price: 8000 }] },
  { id: "bl-premium-box", group: "bulut", brand: "Bulut", name: "Premium salfetkalar 27×27 (quti)", img: "images/bulut-qutili-premium.png",
    variants: [{ id: "bl-premium-box-100", label: "2 qavat · 100 ta", unit: "dona", price: 12000 }] },
  { id: "bl-avto", group: "bulut", brand: "Bulut", name: "Avtoulovlar uchun salfetka 27×27", img: "images/bulut-avto-salfetka.png",
    variants: [{ id: "bl-avto-60", label: "2 qavat · 60 ta", unit: "dona", price: 10000 }] },
  { id: "bl-towel-3", group: "bulut", brand: "Bulut", name: "3 qavatli qog'oz sochiq", img: "images/bulut-sochiq-3-qavat.png",
    variants: [{ id: "bl-towel-3-2", label: "3 qavat · qadoqda 2 ta", unit: "qadoq", price: 18000 }] },
  { id: "bl-towel-2", group: "bulut", brand: "Bulut", name: "Qog'oz sochiq 2 qavatlik", img: "images/bulut-sochiq-2-qavat.png",
    variants: [{ id: "bl-towel-2-2", label: "2 qavat · qadoqda 2 ta", unit: "qadoq", price: 14000 }] },
  { id: "bl-big-towel", group: "bulut", brand: "Bulut", name: "Big sochiq", img: "images/bulut-big-sochiq.png",
    variants: [{ id: "bl-big-towel-1", label: "3 qavat · 1 ta", unit: "dona", price: 25000 }] },
  { id: "bl-tp-cellulose", group: "bulut", brand: "Bulut", name: "Sellyulozali hojatxona qog'ozi", img: "images/bulut-hojatxona-sellyuloza.png",
    variants: [{ id: "bl-tp-cellulose-8", label: "2 qavat · qadoqda 8 ta", unit: "qadoq", price: 28000 }] },
  { id: "bl-tp-rose", group: "bulut", brand: "Bulut", name: "Aroma atirgul hojatxona qog'ozi", img: "images/bulut-hojatxona-atirgul.png",
    variants: [{ id: "bl-tp-rose-8", label: "2 qavat · qadoqda 8 ta", unit: "qadoq", price: 30000 }] },
  { id: "bl-tp-lemon", group: "bulut", brand: "Bulut", name: "Aroma limon hojatxona qog'ozi", img: "images/bulut-hojatxona-limon.png",
    variants: [{ id: "bl-tp-lemon-8", label: "2 qavat · qadoqda 8 ta", unit: "qadoq", price: 30000 }] },
  { id: "bl-horeca-v", group: "bulut", brand: "Bulut", name: "V HoReCa salfetkalari (dispenser)", img: "images/bulut-horeca-v.png",
    variants: [{ id: "bl-horeca-v-150", label: "2 qavat · 150 ta", unit: "dona", price: 12000 }] },
  { id: "bl-horeca-z", group: "bulut", brand: "Bulut", name: "Z HoReCa salfetkalari (dispenser)", img: "images/bulut-horeca-z.png",
    variants: [{ id: "bl-horeca-z-200", label: "2 qavat · 200 ta", unit: "dona", price: 15000 }] },
  { id: "bl-wet-premium", group: "bulut", brand: "Bulut", name: "Premium nam salfetkalar", img: "images/bulut-nam-premium.png",
    variants: [{ id: "bl-wet-premium-120", label: "120 ta", unit: "dona", price: 18000 }] },
  { id: "bl-wet-universal", group: "bulut", brand: "Bulut", name: "Universal nam salfetkalar", img: "images/bulut-nam-universal.png",
    variants: [{ id: "bl-wet-universal-120", label: "120 ta", unit: "dona", price: 15000 }] },
  { id: "bl-wet-kids", group: "bulut", brand: "Bulut", name: "Bolalar uchun nam salfetkalar", img: "images/bulut-nam-bolalar.png",
    variants: [{ id: "bl-wet-kids-120", label: "120 ta", unit: "dona", price: 17000 }] },
];
