import TelegramBot from "node-telegram-bot-api";

// todo: возможно стоит вынести в общую либу
const dictionary = {
  type: {
    rent: "Сдача недвижимости в аренду",
    sell: "Продажа недвижимости",
  },
  category: {
    apartment: "Квартира",
    house: "Дом",
    land: "Земельный участок",
    cottage: "Дача",
    business: "Коммерческая недвижимость",
    factory: "Заводы и фабрики",
    townhouse: "Таунхаус",
    other: "Другое",
  },
};

/**
 * Сервис для отправки сообщений в Telegram чат
 */
export const TelegramService = {
  getBot() {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const bot = new TelegramBot(TOKEN, { polling: false });

    return { bot, CHAT_ID, TOKEN };
  },
  /**
   * Отправить текстовое сообщение
   * @param {string} text - Сообщение
   * @param {object} options - Опции для сообщения
   * @param {number} message_thread_id - Номер топика в чате
   */
  sendMessage: async (text, options, message_thread_id) => {
    const { bot, CHAT_ID, TOKEN } = TelegramService.getBot();

    if (!TOKEN || !CHAT_ID) return;
    try {
      await bot.sendMessage(CHAT_ID, text, {
        parse_mode: "HTML",
        message_thread_id,
        ...options,
      });
    } catch (error) {
      console.error("Ошибка при отправке сообщения в Telegram:", error.message);
    }
  },

  /**
   * Сформировать и отправить уведомление о новой заявке
   * @param {object} order - созданная заявка
   */
  sendSellOrderNotification: async (order) => {
    if (!order) return;

    // Если нет какого-либо обязательного поля, то отправляем сообщение об ошибке
    const requiredFields = ["_id", "category", "price", "createdAt"];
    const missingFields = requiredFields.filter((field) => !order[field]);

    if (missingFields.length > 0) {
      const errorText = `❌ <b>Ошибка: не удалось отправить заявку</b>\nОтсутствуют обязательные поля: <code>${missingFields.join(", ")}</code>`;
      return await TelegramService.sendMessage(errorText);
    }

    const { _id, category, roomCount, houseSquare, price, createdAt, type } =
      order;

    // Формируем ссылку в админку
    const orderLink = `https://eis.whitedog.kz/orders/sell/${_id}`;

    // Форматируем дату и время для вывода
    const date = new Date(createdAt).toLocaleString("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    });

    const formattedPrice = Number(price)
      .toLocaleString("ru-RU")
      .replace(/\u00A0/g, " ");

    // Тело сообщения
    const message = `
<b>📢 Новая заявка на продажу недвижимости</b>

<b>🏠 Категория:</b> ${dictionary.category[category] || "Ошибка"}
<b>📝 Услуга:</b> ${dictionary.type[type] || "Ошибка"}
${roomCount ? `<b>🛏 Комнат:</b> ${roomCount}` : ""}
${houseSquare ? `<b>📐 Площадь:</b> ${houseSquare} м²` : ""}
<b>💰 Стоимость:</b> ${formattedPrice} ₸
<b>🕓 Дата:</b> ${date}

<span class="tg-spoiler"><b>🆔 ID заявки:</b> ${_id}</span>
`;

    // Кнопка в телеграме, которая открывает ссылку
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть заявку", url: orderLink }]],
      },
    };

    await TelegramService.sendMessage(message, inlineKeyboard, 2);
  },
  sendBuyOrderNotification: async (order) => {
    if (!order) return;

    // Если нет какого-либо обязательного поля, то отправляем сообщение об ошибке
    const requiredFields = ["estateId", "title"];
    const missingFields = requiredFields.filter((field) => !order[field]);

    if (missingFields.length > 0) {
      const errorText = `❌ <b>Ошибка: не удалось отправить заявку</b>\nОтсутствуют обязательные поля: <code>${missingFields.join(", ")}</code>`;
      return await TelegramService.sendMessage(errorText);
    }

    const { _id, title, createdAt, estateId } = order;

    // Формируем ссылку в админку
    const orderLink = `https://eis.whitedog.kz/admin/orders/feedback?estateId=${estateId}`;

    // Форматируем дату и время для вывода
    const date = new Date(createdAt).toLocaleString("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    });

    // Тело сообщения
    const message = `
<b>📢 Новая заявка на покупку недвижимости</b>

<b>🏠 Объект:</b> ${title}
<b>🕓 Дата:</b> ${date}

<span class="tg-spoiler"><b>🆔 ID заявки:</b> ${_id}</span>
<span class="tg-spoiler"><b>🆔 ID объекта:</b> ${estateId}</span>
`;

    // Кнопка в телеграме, которая открывает ссылку
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть заявку", url: orderLink }]],
      },
    };

    await TelegramService.sendMessage(message, inlineKeyboard, 6);
  },
};
