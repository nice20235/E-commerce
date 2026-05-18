import { useLang } from '../store/lang'

const content = {
  uz: {
    title: 'Ommaviy oferta',
    updated: 'Yangilangan: 12.03.2026',
    intro1: "Ushbu ommaviy oferta (keyingi o'rinlarda — «Oferta») StepUp (keyingi o'rinlarda — «Sotuvchi») tomonidan jismoniy shaxsga (keyingi o'rinlarda — «Xaridor») quyida bayon etilgan shartlarda tovarlar sotib olish / xizmatlar ko'rsatish shartnomasini tuzish to'g'risidagi rasmiy taklifdir.",
    intro2: 'Buyurtmani amalga oshirish va uni to\'lash Xaridorning ushbu Oferta shartlariga roziligini anglatadi.',
    sections: [
      {
        title: '1. Buyurtma va to\'lov usullari',
        items: [
          'Buyurtmalar sayt orqali qabul qilinadi: https://www.sstepup.uz/',
          'To\'lov imkoniyatlari: bank kartasi (UZCARD, HUMO, Visa, MasterCard, UnionPay) orqali himoyalangan to\'lov xizmati; saytda ko\'rsatilgan boshqa to\'lov usullari.',
          'Barcha hisob-kitoblar O\'zbekiston Respublikasi so\'mida amalga oshiriladi.',
        ],
      },
      {
        title: '2. Tovarni qaytarish, xizmatdan voz kechish va pul qaytarish shartlari',
        items: [
          'Xaridor O\'zbekiston Respublikasi qonunchiligida belgilangan muddat va tartibda tovar yoki xizmatdan voz kechishga haqlidir.',
          'Tovar/xizmatdan voz kechilganda pul to\'lov amalga oshirilgan usul bilan qaytariladi.',
          'Pul qaytarish muddati odatda 7 ish kunigacha, ayrim hollarda esa bank va to\'lov tizimlariga qarab 30 ish kunigacha cho\'zilishi mumkin.',
          'Bank kartasi orqali operatsiyani bekor qilish milliy va xalqaro to\'lov tizimlari qoidalariga muvofiq amalga oshiriladi.',
        ],
      },
      {
        title: '3. Tovarlarni yetkazib berish / xizmatlar ko\'rsatish shartlari',
        items: [
          'Toshkent shahri bo\'yicha tovarlarni yetkazib berish bepul amalga oshiriladi.',
          'O\'zbekiston Respublikasining boshqa shaharlariga yetkazib berish kelishuv asosida amalga oshiriladi.',
          'Qozog\'iston, Qirg\'iziston va Tojikistonga yetkazib berish ham kelishuv asosida amalga oshiriladi.',
        ],
      },
      {
        title: '4. Operatsiyalar xavfsizligi',
        items: [
          'Bank kartalari orqali to\'lov zamonaviy himoya usullaridan foydalanadigan himoyalangan to\'lov shlyuzi orqali amalga oshiriladi.',
          'Bank kartasi ma\'lumotlari faqat to\'lov xizmati tomonidan qayta ishlanadi va Sotuvchiga uzatilmaydi.',
          'Sotuvchi mijozlarning shaxsiy ma\'lumotlari himoyalanganligini va faqat shartnomani bajarish maqsadida foydalanilishini kafolatlaydi.',
        ],
      },
      {
        title: '5. Maxfiylik siyosati',
        items: [
          'Xaridorning shaxsiy ma\'lumotlari O\'zbekiston Respublikasining 2019-yil 2-iyuldagi «Shaxsiy ma\'lumotlar to\'g\'risida»gi №ЗРУ-547-son Qonuniga muvofiq qayta ishlanadi.',
          'Sotuvchi shaxsiy ma\'lumotlarni faqat Xaridor oldidagi majburiyatlarni bajarish uchun to\'playdi va foydalanadi.',
          'Sotuvchi O\'zbekiston Respublikasi qonunchiligi bilan nazarda tutilgan hollar bundan mustasno, Xaridorning shaxsiy ma\'lumotlarini uning rozilигисиз uchinchi shaxslarga oshkor etmaslikka majburdir.',
          'Xaridor ko\'rsatgan e-mail yoki telefonga axborot xabarlarini (buyurtma, aksiyalar haqida bildirishnomalar) olishga rozi bo\'ladi.',
        ],
      },
    ],
    reqTitle: '6. Sotuvchi rekvizitlari',
    closing: 'Buyurtmani rasmiylashtirish va to\'lovga o\'tish orqali siz ushbu ommaviy oferta shartlarini o\'qib chiqqaningizni va qabul qilganingizni tasdiqlaysiz.',
  },
  ru: {
    title: 'Публичная оферта',
    updated: 'Обновлено: 12.03.2026',
    intro1: 'Настоящая публичная оферта (далее — «Оферта») является официальным предложением StepUp (далее — «Продавец») любому физическому лицу (далее — «Покупатель») заключить договор купли-продажи товаров / оказания услуг на условиях, изложенных ниже.',
    intro2: 'Осуществление заказа и его оплата означает согласие Покупателя с условиями данной Оферты.',
    sections: [
      {
        title: '1. Способы заказа и оплаты',
        items: [
          'Заказы принимаются через сайт: https://www.sstepup.uz/',
          'Оплата возможна: банковской картой (UZCARD, HUMO, Visa, MasterCard, UnionPay) через защищённый платёжный сервис; иными методами оплаты, указанными на сайте.',
          'Все расчёты производятся в сумах Республики Узбекистан.',
        ],
      },
      {
        title: '2. Условия возврата товара, отказа от услуги и возврата денежных средств',
        items: [
          'Покупатель вправе отказаться от товара или услуги в сроки и порядке, установленные законодательством Республики Узбекистан.',
          'При отказе от товара/услуги возврат денежных средств осуществляется тем же способом, которым была произведена оплата.',
          'Срок возврата денежных средств обычно составляет до 7 рабочих дней, однако в отдельных случаях может продлиться до 30 рабочих дней, в зависимости от работы банка и платёжных систем.',
          'Отмена операции по банковской карте производится в соответствии с правилами национальных и международных платёжных систем.',
        ],
      },
      {
        title: '3. Условия доставки товаров / оказания услуг',
        items: [
          'Доставка товаров по городу Ташкент осуществляется бесплатно.',
          'Доставка в другие города Республики Узбекистан осуществляется на договорных условиях.',
          'Доставка в Казахстан, Киргизстан и Таджикистан также осуществляется на договорных условиях.',
        ],
      },
      {
        title: '4. Безопасность операций',
        items: [
          'Оплата банковскими картами осуществляется через защищённый платёжный шлюз, который использует современные методы защиты.',
          'Данные банковской карты обрабатываются исключительно платёжным сервисом и не передаются Продавцу.',
          'Продавец гарантирует, что персональные данные клиентов защищены и используются только в целях исполнения договора.',
        ],
      },
      {
        title: '5. Политика конфиденциальности',
        items: [
          'Персональные данные Покупателя обрабатываются в соответствии с Законом Республики Узбекистан «О персональных данных» №ЗРУ-547 от 2 июля 2019 года.',
          'Продавец собирает и использует персональные данные исключительно для выполнения своих обязательств перед Покупателем.',
          'Продавец обязуется не разглашать персональные данные Покупателя третьим лицам без его согласия, за исключением случаев, предусмотренных законодательством Республики Узбекистан.',
          'Покупатель соглашается на получение информационных сообщений (уведомлений о заказе, акциях и т.п.) на указанный им e-mail или телефон.',
        ],
      },
    ],
    reqTitle: '6. Реквизиты продавца',
    closing: 'Продолжая оформление заказа и переходя к оплате, вы подтверждаете, что ознакомлены и принимаете условия данной публичной оферты.',
  },
}

const SECTION_ICONS = [
  <svg key="pay" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  <svg key="ret" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  <svg key="del" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  <svg key="sec" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  <svg key="priv" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
]

export default function PublicOffer() {
  const { lang } = useLang()
  const c = content[lang]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header banner */}
      <div
        className="rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-8 sm:py-10 mb-4 sm:mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2f4e 0%, #0f1e33 100%)' }}
      >
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,77,28,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(255,77,28,0.15)', border: '1px solid rgba(255,77,28,0.2)' }}>
            <svg className="w-5 h-5" style={{ color: '#ff7a50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-1">{c.title}</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.updated}</p>
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
        {/* Intro */}
        <div className="mb-7 sm:mb-10 pb-6 sm:pb-8" style={{ borderBottom: '1px solid #e8e5e0' }}>
          <p className="text-sm leading-relaxed mb-3" style={{ color: '#444' }}>{c.intro1}</p>
          <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{c.intro2}</p>
        </div>

        {/* Sections */}
        <div className="space-y-6 sm:space-y-8">
          {c.sections.map((section, idx) => (
            <div key={section.title}>
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,77,28,0.08)', color: '#ff6a3c' }}
                >
                  {SECTION_ICONS[idx]}
                </div>
                <h2 className="font-bold text-sm leading-snug" style={{ color: '#1a2f4e' }}>{section.title}</h2>
              </div>
              <ul className="space-y-2.5 ml-11">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: '#555' }}>
                    <span
                      className="mt-2 rounded-full flex-shrink-0"
                      style={{ background: '#ff4d1c', minWidth: 6, width: 6, height: 6 }}
                    />
                    <span className="break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Requisites */}
        <div
          className="rounded-2xl p-4 sm:p-6 mt-8 sm:mt-10"
          style={{ background: '#faf9f7', border: '1px solid #e8e5e0' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,77,28,0.08)', color: '#ff6a3c' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="font-bold text-sm" style={{ color: '#1a2f4e' }}>{c.reqTitle}</h2>
          </div>
          <div className="ml-11 space-y-2 text-sm" style={{ color: '#555' }}>
            <p className="font-bold" style={{ color: '#1a2f4e' }}>StepUp</p>
            <p style={{ color: '#888' }}>ИНН: 552430231</p>
            <p className="break-words">
              <span style={{ color: '#888' }}>{lang === 'uz' ? 'Yuridik manzil' : 'Юридический адрес'}:</span>{' '}
              Ташкентский об, Эшонгузар, ул. Х. Нигмон
            </p>
            <p className="break-words">
              <span style={{ color: '#888' }}>{lang === 'uz' ? 'Haqiqiy manzil' : 'Фактический адрес'}:</span>{' '}
              Ташкентский об, Эшонгузар, ул. Х. Нигмон
            </p>
            <p>
              <span style={{ color: '#888' }}>{lang === 'uz' ? 'Telefon' : 'Телефон'}:</span>{' '}
              <a href="tel:+998930919454" className="font-medium transition-colors" style={{ color: '#ff4d1c' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e03c10')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ff4d1c')}
              >
                +998 93 091 94 54
              </a>
            </p>
            <p className="break-words">
              E-mail:{' '}
              <a href="mailto:elbek1987101@icloud.com" className="font-medium transition-colors" style={{ color: '#ff4d1c' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e03c10')}
                onMouseLeave={e => (e.currentTarget.style.color = '#ff4d1c')}
              >
                elbek1987101@icloud.com
              </a>
            </p>
          </div>
        </div>

        {/* Closing note */}
        <div
          className="flex items-start gap-3 rounded-2xl p-4 mt-5 sm:mt-6"
          style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#1d4ed8' }}>{c.closing}</p>
        </div>
      </div>
    </div>
  )
}
