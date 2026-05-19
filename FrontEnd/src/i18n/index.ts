export type Lang = 'uz' | 'ru'

export const translations = {
  uz: {
    // Navbar
    shop: "Do'kon",
    orders: 'Buyurtmalar',
    admin: 'Admin',
    login: 'Kirish',
    signup: "Ro'yxatdan o'tish",
    logout: 'Chiqish',

    // Home
    newCollection: 'Yangi Kolleksiya',
    heroTitle: 'Qulaylikda',
    heroAccent: 'yuring.',
    heroSub: "Kundalik hashamat uchun tanlangan shippaklar. O'zingizga mos juftlikni toping.",
    stylesAvailable: 'uslub mavjud',
    allSlippers: 'Barcha Shippaklar',
    products: 'mahsulot',
    prev: 'Oldingi',
    next: 'Keyingi',
    pageOf: 'sahifa',
    noProducts: 'Hali shippaklar yo\'q',
    noProductsSub: 'Admin paneldan mahsulot qo\'shing',
    loadError: 'Mahsulotlar yuklanmadi',
    loadErrorSub: 'Backend 8000-portda ishlayotganiga ishonch hosil qiling',

    // ProductCard
    addToCart: "Savatga qo'shish",
    adding: "Qo'shilmoqda…",
    added: "Qo'shildi",
    outOfStock: 'Tugagan',
    size: "O'lcham",
    left: 'qoldi',

    // ProductDetail
    back: 'Orqaga',
    inStock: 'dona bor',
    quantity: 'Miqdor',
    loginToAdd: "Savatga qo'shish uchun",
    loginLink: 'kiring',
    notFound: 'Mahsulot topilmadi',

    // Cart
    cart: 'Savat',
    clearAll: 'Barchasini tozalash',
    cartEmpty: 'Savat bo\'sh',
    cartEmptySub: "Shippaklar qo'shib boshlang",
    browseShop: "Do'konga o'tish",
    subtotal: 'Jami',
    total: 'Umumiy',
    checkout: 'Buyurtma berish',
    continueShopping: 'Xarid davom ettirish',
    items: 'ta mahsulot',

    // Checkout
    checkoutTitle: 'Buyurtma',
    orderSummary: 'Buyurtma xulosasi',
    placeOrder: 'Buyurtma berish',
    backToCart: 'Savatga qaytish',
    payNowBank: 'Bank orqali to\'lash →',
    viewMyOrders: 'Buyurtmalarim',
    orderPlaced: 'Buyurtma qabul qilindi!',
    payInfo: "Buyurtma berilgandan so'ng bank to'lov sahifasiga yo'naltirilasiz.",
    placingOrder: 'Yuborilmoqda…',

    // Orders
    myOrders: 'Mening buyurtmalarim',
    noOrders: 'Hali buyurtmalar yo\'q',
    noOrdersSub: 'Buyurtmalar tarixi bu yerda ko\'rinadi',
    startShopping: 'Xarid boshlash',
    payNow: 'To\'lash',

    // Auth - Login
    welcomeBack: 'Xush kelibsiz',
    signInSub: 'StepUp hisobingizga kiring',
    username: 'Foydalanuvchi nomi',
    password: 'Parol',
    signIn: 'Kirish',
    signingIn: 'Kirilmoqda…',
    noAccount: 'Akkount yo\'qmi?',
    createOne: 'Yaratish',
    forgotPassword: 'Parolni unutdingizmi?',
    invalidCredentials: 'Login yoki parol noto\'g\'ri',
    loginFailed: 'Kirishda xatolik. Qayta urinib ko\'ring.',
    userExists: 'Bu foydalanuvchi nomi allaqachon band',
    phoneExists: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan',
    registerFailed: 'Ro\'yxatdan o\'tishda xatolik yuz berdi',

    // Auth - Register
    createAccount: 'Akkount yaratish',
    joinSub: "StepUp'ga qo'shiling",
    surname: 'Familiya',
    phone: 'Telefon',
    confirm: 'Tasdiqlash',
    creating: 'Yaratilmoqda…',
    createBtn: 'Akkount yaratish',
    alreadyHave: 'Allaqachon akkount bormi?',

    // Auth - Forgot
    resetPassword: 'Parolni tiklash',
    resetSub: 'Parolni tiklash uchun qo\'llab-quvvatlash xizmatiga murojaat qiling.',
    newPassword: 'Yangi Parol',
    resetBtn: 'Parolni tiklash',
    resetting: 'Tiklanmoqda…',
    backToLogin: 'Kirishga qaytish',
    passwordUpdated: 'Parol yangilandi!',
    redirecting: 'Kirishga yo\'naltirilmoqda…',
    resetContactSupport: 'Parolni tiklash uchun do\'kon administratori bilan bog\'laning.',

    // Validation
    allRequired: 'Barcha maydonlar majburiy',
    passwordMismatch: 'Parollar mos kelmaydi',
    passwordShort: 'Kamida 8 ta belgi',

    // Admin
    adminProducts: 'Mahsulotlar',
    adminOrders: 'Buyurtmalar',
    adminUsers: 'Foydalanuvchilar',
    newProduct: '+ Yangi',
    cancel: 'Bekor qilish',
    name: 'Nomi',
    price: 'Narx',
    stock: 'Omborda',
    actions: 'Amallar',
    edit: 'Tahrirlash',
    delete: "O'chirish",
    photo: 'Rasm',
    saving: 'Saqlanmoqda…',
    update: 'Yangilash',
    create: 'Yaratish',
    allOrders: 'Barcha buyurtmalar',
    setStatus: 'Status:',
    orderItems: 'Mahsulotlar',
    deleteConfirm: 'Bu mahsulotni o\'chirmoqchimisiz?',
    noOrdersFound: 'Buyurtmalar topilmadi',

    // Admin - Categories
    adminCategories: 'Kategoriyalar',
    newCategory: '+ Yangi kategoriya',
    categoryName: 'Kategoriya nomi',
    description: 'Tavsif',
    active: 'Faol',
    inactive: 'Nofaol',
    categoryDeleteConfirm: 'Bu kategoriyani o\'chirmoqchimisiz?',
    noCategoriesFound: 'Kategoriyalar topilmadi',

    // Home - filter
    allCategories: 'Barchasi',
    filterByCategory: 'Kategoriya bo\'yicha',
    search: 'Qidirish',
    searchPlaceholder: 'Shippak qidiring…',
    sortLabel: 'Tartiblash',

    // Profile
    profile: 'Profil',
    profileTitle: 'Mening profilim',
    profileInfo: 'Shaxsiy ma\'lumotlar',
    changePassword: 'Parolni o\'zgartirish',
    currentPassword: 'Joriy parol',
    newPasswordLabel: 'Yangi parol',
    confirmNewPassword: 'Yangi parolni tasdiqlash',
    saveChanges: 'Saqlash',
    savedSuccess: 'Muvaffaqiyatli saqlandi!',
    agreeToOffer: 'Men ommaviy oferta shartlarini o\'qib chiqdim va qabul qilaman —',
    publicOfferLink: 'ommaviy oferta',
    passwordChanged: 'Parol o\'zgartirildi!',
    currentPassRequired: 'Joriy parolni kiriting',
    newPassRequired: 'Yangi parolni kiriting',
    passMinLength: 'Kamida 8 ta belgi',
    passMismatch: 'Parollar mos kelmaydi',

    // Home - search result / show all
    searchResult: 'Qidiruv natijasi',
    showAllProducts: 'Barcha mahsulotlar',

    // Orders - count labels
    ordersCount: 'ta buyurtma',
    moreItems: 'ta yana',
  },
  ru: {
    // Navbar
    shop: 'Магазин',
    orders: 'Заказы',
    admin: 'Админ',
    login: 'Войти',
    signup: 'Регистрация',
    logout: 'Выйти',

    // Home
    newCollection: 'Новая Коллекция',
    heroTitle: 'Ходи в',
    heroAccent: 'комфорте.',
    heroSub: 'Тщательно подобранные тапочки для повседневной роскоши. Найди свою идеальную пару.',
    stylesAvailable: 'стилей доступно',
    allSlippers: 'Все Тапочки',
    products: 'товаров',
    prev: 'Назад',
    next: 'Вперёд',
    pageOf: 'страница',
    noProducts: 'Тапочек пока нет',
    noProductsSub: 'Добавьте товары через панель администратора',
    loadError: 'Не удалось загрузить товары',
    loadErrorSub: 'Убедитесь, что сервер запущен на порту 8000',

    // ProductCard
    addToCart: 'В корзину',
    adding: 'Добавляется…',
    added: 'Добавлено',
    outOfStock: 'Нет в наличии',
    size: 'Размер',
    left: 'осталось',

    // ProductDetail
    back: 'Назад',
    inStock: 'в наличии',
    quantity: 'Количество',
    loginToAdd: 'Чтобы добавить товар,',
    loginLink: 'войдите',
    notFound: 'Товар не найден',

    // Cart
    cart: 'Корзина',
    clearAll: 'Очистить всё',
    cartEmpty: 'Корзина пуста',
    cartEmptySub: 'Добавьте тапочки для начала',
    browseShop: 'В магазин',
    subtotal: 'Подытог',
    total: 'Итого',
    checkout: 'Оформить заказ',
    continueShopping: 'Продолжить покупки',
    items: 'товаров',

    // Checkout
    checkoutTitle: 'Оформление',
    orderSummary: 'Сводка заказа',
    placeOrder: 'Оформить заказ',
    backToCart: 'В корзину',
    payNowBank: 'Оплатить через банк →',
    viewMyOrders: 'Мои заказы',
    orderPlaced: 'Заказ оформлен!',
    payInfo: 'После оформления заказа вас перенаправят на страницу оплаты.',
    placingOrder: 'Отправляется…',

    // Orders
    myOrders: 'Мои заказы',
    noOrders: 'Заказов пока нет',
    noOrdersSub: 'История заказов появится здесь',
    startShopping: 'Начать покупки',
    payNow: 'Оплатить',

    // Auth - Login
    welcomeBack: 'Добро пожаловать',
    signInSub: 'Войдите в свой аккаунт StepUp',
    username: 'Имя пользователя',
    password: 'Пароль',
    signIn: 'Войти',
    signingIn: 'Вход…',
    noAccount: 'Нет аккаунта?',
    createOne: 'Создать',
    forgotPassword: 'Забыли пароль?',
    invalidCredentials: 'Неверный логин или пароль',
    loginFailed: 'Ошибка входа. Попробуйте ещё раз.',
    userExists: 'Это имя пользователя уже занято',
    phoneExists: 'Этот номер телефона уже зарегистрирован',
    registerFailed: 'Ошибка при регистрации',

    // Auth - Register
    createAccount: 'Создать аккаунт',
    joinSub: 'Присоединяйтесь к StepUp',
    surname: 'Фамилия',
    phone: 'Телефон',
    confirm: 'Подтверждение',
    creating: 'Создаётся…',
    createBtn: 'Создать аккаунт',
    alreadyHave: 'Уже есть аккаунт?',

    // Auth - Forgot
    resetPassword: 'Сброс пароля',
    resetSub: 'Для сброса пароля обратитесь в службу поддержки.',
    newPassword: 'Новый пароль',
    resetBtn: 'Сбросить пароль',
    resetting: 'Обновление…',
    backToLogin: 'Войти',
    passwordUpdated: 'Пароль обновлён!',
    redirecting: 'Перенаправление…',
    resetContactSupport: 'Для сброса пароля обратитесь к администратору магазина.',

    // Validation
    allRequired: 'Все поля обязательны',
    passwordMismatch: 'Пароли не совпадают',
    passwordShort: 'Минимум 8 символов',

    // Admin
    adminProducts: 'Товары',
    adminOrders: 'Заказы',
    adminUsers: 'Пользователи',
    newProduct: '+ Новый',
    cancel: 'Отмена',
    name: 'Название',
    price: 'Цена',
    stock: 'На складе',
    actions: 'Действия',
    edit: 'Изменить',
    delete: 'Удалить',
    photo: 'Фото',
    saving: 'Сохранение…',
    update: 'Обновить',
    create: 'Создать',
    allOrders: 'Все заказы',
    setStatus: 'Статус:',
    orderItems: 'Состав заказа',
    deleteConfirm: 'Удалить этот товар?',
    noOrdersFound: 'Заказов не найдено',

    // Admin - Categories
    adminCategories: 'Категории',
    newCategory: '+ Новая категория',
    categoryName: 'Название категории',
    description: 'Описание',
    active: 'Активна',
    inactive: 'Неактивна',
    categoryDeleteConfirm: 'Удалить эту категорию?',
    noCategoriesFound: 'Категорий не найдено',

    // Home - filter
    allCategories: 'Все',
    filterByCategory: 'По категории',
    search: 'Поиск',
    searchPlaceholder: 'Найти тапочки…',
    sortLabel: 'Сортировка',

    // Profile
    profile: 'Профиль',
    profileTitle: 'Мой профиль',
    profileInfo: 'Личные данные',
    changePassword: 'Изменить пароль',
    currentPassword: 'Текущий пароль',
    newPasswordLabel: 'Новый пароль',
    confirmNewPassword: 'Подтвердите новый пароль',
    saveChanges: 'Сохранить',
    savedSuccess: 'Успешно сохранено!',
    agreeToOffer: 'Я ознакомлен(а) и принимаю условия',
    publicOfferLink: 'публичной оферты',
    passwordChanged: 'Пароль изменён!',
    currentPassRequired: 'Введите текущий пароль',
    newPassRequired: 'Введите новый пароль',
    passMinLength: 'Минимум 8 символов',
    passMismatch: 'Пароли не совпадают',

    // Home - search result / show all
    searchResult: 'Результат поиска',
    showAllProducts: 'Все товары',

    // Orders - count labels
    ordersCount: 'заказов',
    moreItems: 'ещё',
  },
} satisfies Record<Lang, Record<string, string>>

export type TKey = keyof typeof translations.uz
