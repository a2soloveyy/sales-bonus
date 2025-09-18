/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
     if (!purchase) return 0;
  const { discount = 0, sale_price = 0, quantity = 0 } = purchase;
  const discountFactor = 1 - (Number(discount) || 0) / 100;
  return (Number(sale_price) || 0) * (Number(quantity) || 0) * discountFactor;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
     const profit = seller?.profit ?? 0;

      if (index === 0) {
    // 15% — лидер по прибыли
    return +(profit * 0.15).toFixed(2);
  } else if (index === 1 || index === 2) {
    // 10% — 2–3 места
    return +(profit * 0.10).toFixed(2);
  } else if (index === total - 1) {
    // 0% — последний
    return 0;
  } else {
    // 5% — всем остальным
    return +(profit * 0.05).toFixed(2);
  }
}


/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
      if (
    !data ||
    !Array.isArray(data.sellers) || data.sellers.length === 0 ||
    !Array.isArray(data.products) || data.products.length === 0 ||
    !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
  ) {
    throw new Error('Некорректные входные данные');
  }

    // @TODO: Проверка наличия опций
     if (!options || typeof options !== 'object') {
    throw new Error('Не переданы опции расчётов');
  }
  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || !calculateBonus) {
    throw new Error('Отсутствуют функции calculateRevenue / calculateBonus');
  }

    // @TODO: Подготовка промежуточных данных для сбора статистики
     const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {}, // { [sku]: quantity }
  }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(s => [s.id, s]));
    const productIndex = Object.fromEntries(data.products.map(p => [p.sku, p]));


    // @TODO: Расчет выручки и прибыли для каждого продавца
     data.purchase_records.forEach((record) => {
  const seller = sellerIndex[record.seller_id];
  if (!seller) return;

  seller.sales_count += 1;

  const receiptRevenue =
    (Number(record.total_amount) || 0) - (Number(record.total_discount) || 0);
  seller.revenue += receiptRevenue;

  record.items.forEach((item) => {
    const product = productIndex[item.sku];
    if (!product) return;

    const revenue = calculateRevenue(item, product);
    const cost = (Number(product.purchase_price) || 0) * (Number(item.quantity) || 0);
    const profit = revenue - cost;

    seller.profit += profit;

    if (!seller.products_sold[item.sku]) {
      seller.products_sold[item.sku] = 0;
    }
    seller.products_sold[item.sku] += Number(item.quantity) || 0;
  });
});


    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    
    // @TODO: Назначение премий на основе ранжирования
    const total = sellerStats.length;
sellerStats.forEach((seller, index) => {
  seller.bonus = calculateBonus(index, total, seller);

  // Топ-10 продуктов по количеству
  seller.top_products = Object.entries(seller.products_sold)
    .map(([sku, quantity]) => ({ sku, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
});

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map((s) => ({
    seller_id: s.id,
    name: s.name,
    revenue: +s.revenue.toFixed(2),
    profit: +s.profit.toFixed(2),
    sales_count: s.sales_count,
    top_products: s.top_products,
    bonus: +s.bonus.toFixed(2),
  }));
}


if (typeof module !== 'undefined') {
  module.exports = {
    calculateSimpleRevenue,
    calculateBonusByProfit,
    analyzeSalesData,
  };
}