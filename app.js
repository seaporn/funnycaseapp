// Подключаем Telegram Web App API
const tg = window.Telegram.WebApp;

// Говорим Telegram, что приложение готово
tg.ready();

// Раскрываем приложение на всю доступную высоту
tg.expand();

/*
  Список кейсов.
  У каждого кейса есть:
  - name: название
  - price: цена открытия
  - items: подарки, которые могут выпасть
*/
const cases = {
  cheap: {
    name: "Бомж-кейс",
    price: 100,
    items: [
      {
        name: "Пакет из Пятёрочки",
        icon: "🛍️",
        rarity: "common",
        chance: 35
      },
      {
        name: "Один носок",
        icon: "🧦",
        rarity: "common",
        chance: 30
      },
      {
        name: "Кнопочный телефон деда",
        icon: "📟",
        rarity: "rare",
        chance: 20
      },
      {
        name: "Шаурма удачи",
        icon: "🌯",
        rarity: "epic",
        chance: 10
      },
      {
        name: "Золотой дошик",
        icon: "🍜",
        rarity: "legendary",
        chance: 5
      }
    ]
  },

  funny: {
    name: "Мем-кейс",
    price: 250,
    items: [
      {
        name: "Кот в очках",
        icon: "😎",
        rarity: "common",
        chance: 30
      },
      {
        name: "Стикер с кринжем",
        icon: "🤡",
        rarity: "common",
        chance: 25
      },
      {
        name: "Пульт от жизни",
        icon: "🎮",
        rarity: "rare",
        chance: 20
      },
      {
        name: "Банка воздуха",
        icon: "🥫",
        rarity: "epic",
        chance: 15
      },
      {
        name: "Мемный трон",
        icon: "👑",
        rarity: "legendary",
        chance: 10
      }
    ]
  },

  legendary: {
    name: "Легендарный кринж",
    price: 500,
    items: [
      {
        name: "Слёзы админа",
        icon: "😭",
        rarity: "rare",
        chance: 35
      },
      {
        name: "VIP тапок",
        icon: "🩴",
        rarity: "rare",
        chance: 25
      },
      {
        name: "Голубь-бизнесмен",
        icon: "🐦",
        rarity: "epic",
        chance: 20
      },
      {
        name: "Кепка босса",
        icon: "🧢",
        rarity: "epic",
        chance: 12
      },
      {
        name: "Легендарная картошка",
        icon: "🥔",
        rarity: "legendary",
        chance: 8
      }
    ]
  }
};

// Текущий выбранный кейс
let selectedCase = "cheap";

// Проверяем, есть ли сохранённый баланс.
// Если нет, даём 1000 мем-коинов.
let balance = Number(localStorage.getItem("balance")) || 1000;

// Загружаем инвентарь из памяти браузера.
// Если инвентаря нет, создаём пустой массив.
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];

// Флаг, чтобы нельзя было открыть кейс во время анимации
let isOpening = false;

// Получаем элементы из HTML
const balanceElement = document.getElementById("balance");
const caseButtons = document.querySelectorAll(".case-card");
const openCaseBtn = document.getElementById("openCaseBtn");
const roulette = document.getElementById("roulette");
const result = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const resultName = document.getElementById("resultName");
const resultRarity = document.getElementById("resultRarity");
const inventoryElement = document.getElementById("inventory");

// Обновляем баланс на экране
function updateBalance() {
  balanceElement.textContent = balance;
  localStorage.setItem("balance", balance);
}

// Сохраняем инвентарь
function saveInventory() {
  localStorage.setItem("inventory", JSON.stringify(inventory));
}

// Рисуем инвентарь на экране
function renderInventory() {
  inventoryElement.innerHTML = "";

  // Если инвентарь пустой
  if (inventory.length === 0) {
    inventoryElement.innerHTML = "<p>Пока пусто. Открой кейс.</p>";
    return;
  }

  // Добавляем каждый предмет в инвентарь
  inventory.forEach((item) => {
    const div = document.createElement("div");
    div.className = `inventory-item ${item.rarity}`;

    div.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div class="name">${item.name}</div>
    `;

    inventoryElement.appendChild(div);
  });
}

// Функция выбора случайного предмета с учётом шанса
function getRandomItem(items) {
  /*
    Например:
    Подарок 1 — chance 35
    Подарок 2 — chance 30
    Подарок 3 — chance 20

    Мы складываем все шансы и выбираем случайное число.
  */

  const totalChance = items.reduce((sum, item) => sum + item.chance, 0);

  let random = Math.random() * totalChance;

  for (const item of items) {
    random -= item.chance;

    if (random <= 0) {
      return item;
    }
  }

  // Запасной вариант, если что-то пошло не так
  return items[0];
}

// Создаём ленту рулетки
function buildRoulette(finalItem) {
  roulette.innerHTML = "";

  const selectedItems = cases[selectedCase].items;

  /*
    Делаем много элементов в рулетке.
    Финальный предмет ставим ближе к концу,
    чтобы анимация красиво остановилась на нём.
  */
  const rouletteItems = [];

  for (let i = 0; i < 45; i++) {
    const randomItem = selectedItems[Math.floor(Math.random() * selectedItems.length)];
    rouletteItems.push(randomItem);
  }

  // На эту позицию поставим выигрышный предмет
  const winningIndex = 38;
  rouletteItems[winningIndex] = finalItem;

  // Рисуем элементы
  rouletteItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = `roulette-item ${item.rarity}`;

    div.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div class="name">${item.name}</div>
    `;

    roulette.appendChild(div);
  });

  return winningIndex;
}

// Открытие кейса
function openCase() {
  // Если уже идёт открытие — ничего не делаем
  if (isOpening) return;

  const currentCase = cases[selectedCase];

  // Проверяем баланс
  if (balance < currentCase.price) {
    alert("Недостаточно мем-коинов");
    return;
  }

  // Списываем цену кейса
  balance -= currentCase.price;
  updateBalance();

  // Скрываем прошлый результат
  result.classList.add("hidden");

  // Блокируем кнопку
  isOpening = true;
  openCaseBtn.disabled = true;
  openCaseBtn.textContent = "Открываем...";

  // Выбираем предмет, который выпадет
  const finalItem = getRandomItem(currentCase.items);

  // Создаём рулетку и получаем индекс выигрышного предмета
  const winningIndex = buildRoulette(finalItem);

  /*
    Сбрасываем позицию рулетки перед стартом.
    Это нужно, чтобы повторная анимация работала нормально.
  */
  roulette.style.transition = "none";
  roulette.style.transform = "translateX(0px)";

  // Небольшая задержка, чтобы браузер успел сбросить позицию
  setTimeout(() => {
    const itemWidth = 142;

    /*
      Вычисляем сдвиг.
      Нужно сдвинуть ленту так, чтобы выигрышный предмет
      оказался примерно по центру под красной линией.
    */
    const wrapperWidth = document.querySelector(".roulette-wrapper").offsetWidth;
    const centerOffset = wrapperWidth / 2 - itemWidth / 2;
    const targetPosition = winningIndex * itemWidth - centerOffset;

    // Возвращаем анимацию
    roulette.style.transition = "transform 5s cubic-bezier(0.15, 0.85, 0.25, 1)";
    roulette.style.transform = `translateX(-${targetPosition}px)`;
  }, 50);

  // После окончания анимации показываем результат
  setTimeout(() => {
    showResult(finalItem);

    // Добавляем предмет в инвентарь
    inventory.unshift(finalItem);
    saveInventory();
    renderInventory();

    // Разблокируем кнопку
    isOpening = false;
    openCaseBtn.disabled = false;
    openCaseBtn.textContent = "Открыть кейс";

  }, 5200);
}

// Показываем результат открытия
function showResult(item) {
  resultIcon.textContent = item.icon;
  resultName.textContent = item.name;
  resultRarity.textContent = getRarityText(item.rarity);

  result.classList.remove("hidden");
}

// Перевод редкости на русский
function getRarityText(rarity) {
  const rarityNames = {
    common: "Обычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный"
  };

  return rarityNames[rarity] || "Неизвестно";
}

// Выбор кейса
caseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Нельзя менять кейс во время открытия
    if (isOpening) return;

    // Убираем active у всех кейсов
    caseButtons.forEach((btn) => btn.classList.remove("active"));

    // Добавляем active выбранному кейсу
    button.classList.add("active");

    // Запоминаем выбранный кейс
    selectedCase = button.dataset.case;
  });
});

// Кнопка открытия кейса
openCaseBtn.addEventListener("click", openCase);

// Первый запуск приложения
updateBalance();
renderInventory();
