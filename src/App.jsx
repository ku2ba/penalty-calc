import React, { useState, useEffect } from "react";
import { parse, differenceInCalendarDays } from "date-fns";
import logo from "./assets/logo.jpg";
import "./App.css";

/**
 * История ключевой ставки ЦБ РФ (примерная, 2020 — середина 2025).
 * Формат дат: "YYYY-MM-DD". Поле to: null означает "до настоящего".
 * (Если нужно — мы позже уточним и дополним даты/значения.)
 */
const cbrRateHistory = [
  { from: "2025-07-25", to: null, rate: 18 },
  { from: "2025-06-06", to: "2025-07-24", rate: 20 },
  { from: "2025-02-14", to: "2025-06-05", rate: 21 },
  { from: "2024-10-28", to: "2025-02-13", rate: 21 },
  { from: "2024-09-13", to: "2024-10-27", rate: 19 },
  { from: "2024-07-26", to: "2024-09-12", rate: 18 },
  { from: "2023-12-15", to: "2024-07-25", rate: 16 },
  { from: "2023-10-26", to: "2023-12-14", rate: 15 },
  { from: "2023-09-18", to: "2023-10-25", rate: 13 },
  { from: "2023-08-15", to: "2023-09-17", rate: 12 },
  { from: "2022-12-20", to: "2023-08-14", rate: 16 },
  { from: "2022-10-30", to: "2022-12-19", rate: 15 },
  { from: "2022-09-18", to: "2022-10-29", rate: 13 },
  { from: "2022-08-15", to: "2022-09-17", rate: 12 },
  { from: "2022-07-25", to: "2022-08-14", rate: 8 },
  { from: "2022-06-14", to: "2022-07-24", rate: 9.5 },
  { from: "2022-02-28", to: "2022-06-13", rate: 20 },
  { from: "2021-12-20", to: "2022-02-27", rate: 8.5 },
  { from: "2021-10-25", to: "2021-12-19", rate: 7.5 },
  { from: "2021-09-13", to: "2021-10-24", rate: 6.75 },
  { from: "2021-07-26", to: "2021-09-12", rate: 6.5 },
  { from: "2020-07-22", to: "2021-07-25", rate: 4.25 },
  { from: "2020-04-10", to: "2020-07-21", rate: 5.5 },
  { from: "2020-02-10", to: "2020-04-09", rate: 6 },
];

/** Парсер ISO-строки "YYYY-MM-DD" -> Date (локально, без врем.зон) */
function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Получить ставку по дате в формате "dd.MM.yyyy" */
function getCbrRateByDate(dateStr) {
  try {
    const [dd, mm, yyyy] = dateStr.split(".");
    if (!dd || !mm || !yyyy) return null;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    for (const period of cbrRateHistory) {
      const from = parseISODate(period.from);
      const to = period.to ? parseISODate(period.to) : new Date(9999, 11, 31);
      if (date >= from && date <= to) return period.rate;
    }
    return null;
  } catch (err) {
    return null;
  }
}
const formatDateInput = (value) => {
  const digits = value.replace(/\D/g, "");
  let result = "";

  if (digits.length > 0) result += digits.substring(0, 2);
  if (digits.length >= 3) result += "." + digits.substring(2, 4);
  if (digits.length >= 5) result += "." + digits.substring(4, 8);

  return result;
};


export default function App() {
  const [cost, setCost] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [personType, setPersonType] = useState("Физическое лицо");
  const [cbrRate, setCbrRate] = useState(null); // число или null
  const [excludeMoratorium, setExcludeMoratorium] = useState(false);

  const [overdueDays, setOverdueDays] = useState(null);
  const [penalty, setPenalty] = useState(null);

  // Автоподбор ставки при изменении даты передачи (формат dd.MM.yyyy)
  useEffect(() => {
    if (handoverDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const rate = getCbrRateByDate(handoverDate);
      setCbrRate(rate);
    } else {
      setCbrRate(null);
    }
  }, [handoverDate]);

  const calculatePenalty = () => {
    // Парсим даты форматом dd.MM.yyyy
    const handover = parse(handoverDate, "dd.MM.yyyy", new Date());
    const current = parse(currentDate, "dd.MM.yyyy", new Date());

    let days = differenceInCalendarDays(current, handover);
    if (days < 0) days = 0;

    // Вычитаем периоды моратория, если опция включена
    if (excludeMoratorium) {
      const moratorium1Start = new Date(2022, 2, 29);
      const moratorium1End = new Date(2023, 5, 30);
      const moratorium2Start = new Date(2024, 2, 22);
      const moratorium2End = new Date(2025, 11, 31);

      const overlapDays = (start, end) => {
        const overlapStart = handover > start ? handover : start;
        const overlapEnd = current < end ? current : end;
        const diff = differenceInCalendarDays(overlapEnd, overlapStart);
        return diff > 0 ? diff : 0;
      };

      const excludedDays =
        overlapDays(moratorium1Start, moratorium1End) +
        overlapDays(moratorium2Start, moratorium2End);
      days -= excludedDays;
      if (days < 0) days = 0;
    }

    setOverdueDays(days);

    const price = parseFloat(cost.replace(/\s/g, ""));

    const rate = typeof cbrRate === "string" ? parseFloat(cbrRate.replace(",", ".")) : cbrRate;

    if (!isNaN(price) && rate !== null && !isNaN(rate) && days > 0) {
      const multiplier = personType === "Физическое лицо" ? 1 / 300 : 1 / 150;
      const calcPenalty = price * multiplier * 2 * (rate / 100) * days;
      setPenalty(calcPenalty.toFixed(2));
    } else {
      setPenalty(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    calculatePenalty();
  };

  return (
    <div className="app-container">
      <div className="form-wrapper">
        <img src={logo} alt="Логотип" className="logo" />
        <h1 className="title">Расчет неустойки</h1>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Стоимость объекта (₽)
            <input
              type="tel"
              inputMode="numeric"
              value={cost}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, ""); // только цифры
                const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
                setCost(formattedValue);
              }}
              required
            />
          </label>



          <label>
            Дата передачи квартиры по ДДУ (дд.мм.гггг)
            <input
              type="tel"
              inputMode="numeric"
              value={handoverDate}
              onChange={(e) => setHandoverDate(formatDateInput(e.target.value))}
              placeholder="дд.мм.гггг"
              maxLength={10}
              required
            />

          </label>

          <label>
            Фактическая передача квартиры (дд.мм.гггг)
            <input
              type="tel"
              inputMode="numeric"
              value={currentDate}
              onChange={(e) => setCurrentDate(formatDateInput(e.target.value))}
              placeholder="дд.мм.гггг"
              maxLength={10}
              required
            />

          </label>

          <label>
            Тип лица
            <select value={personType} onChange={(e) => setPersonType(e.target.value)}>
              <option>Физическое лицо</option>
              <option>Юридическое лицо</option>
            </select>
          </label>

          {/* Ставка ЦБ теперь отображается автоматически */}
          <label style={{ whiteSpace: "nowrap" }}>
            Ставка ЦБ (%):&nbsp;
            <span style={{ fontWeight: 700 }}>
              {cbrRate !== null ? `${cbrRate}%` : "—"}
            </span>
            <div className="small-text">
              Считается автоматически исходя из даты передачи квартиры
            </div>
          </label>


          <label className="checkbox">
            <input
              type="checkbox"
              checked={excludeMoratorium}
              onChange={(e) => setExcludeMoratorium(e.target.checked)}
            />
            Исключить периоды моратория
          </label>

          <button type="submit" className="gold-button">
            Рассчитать
          </button>
        </form>

        {overdueDays !== null && (
          <div className="result">
            <p>
              <strong>Дней просрочки:</strong> {overdueDays}
            </p>
            {penalty !== null && (
              <p>
                <strong>Неустойка:</strong> {penalty} ₽
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
