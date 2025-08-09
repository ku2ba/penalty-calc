import React, { useState, useEffect } from "react";
import { parse, differenceInCalendarDays } from "date-fns";
import logo from "./assets/logo.jpg";
import "./App.css";

// История ключевой ставки ЦБ РФ с 2020 по середину 2025 года
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

// Функция получения ставки по введённой дате (в формате dd.MM.yyyy)
function getCbrRateByDate(dateStr) {
  const [dd, mm, yyyy] = dateStr.split(".");
  const date = new Date(`${yyyy}-${mm}-${dd}`);
  for (const period of cbrRateHistory) {
    const fromDate = new Date(period.from);
    const toDate = period.to ? new Date(period.to) : new Date();
    if (date >= fromDate && date <= toDate) {
      return period.rate;
    }
  }
  return null;
}

export default function App() {
  const [cost, setCost] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [personType, setPersonType] = useState("Физическое лицо");
  const [cbrRate, setCbrRate] = useState(null);
  const [excludeMoratorium, setExcludeMoratorium] = useState(false);

  const [overdueDays, setOverdueDays] = useState(null);
  const [penalty, setPenalty] = useState(null);

  useEffect(() => {
    if (handoverDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const rate = getCbrRateByDate(handoverDate);
      setCbrRate(rate);
    }
  }, [handoverDate]);

  const calculatePenalty = () => {
    const handover = parse(handoverDate, "dd.MM.yyyy", new Date());
    const current = parse(currentDate, "dd.MM.yyyy", new Date());
    let days = differenceInCalendarDays(current, handover);
    if (days < 0) days = 0;

    if (excludeMoratorium) {
      const mor1 = [new Date(2022,2,29), new Date(2023,5,30)];
      const mor2 = [new Date(2024,2,22), new Date(2025,11,31)];
      const overlap = (s,e) => {
        const a = handover > s ? handover : s;
        const b = current < e ? current : e;
        const diff = differenceInCalendarDays(b,a);
        return diff > 0 ? diff : 0;
      };
      days -= overlap(...mor1) + overlap(...mor2);
      if (days < 0) days = 0;
    }
    setOverdueDays(days);

    const price = parseFloat(cost);
    if (!isNaN(price) && cbrRate !== null && days > 0) {
      const multiplier = personType === "Физическое лицо" ? 1/300 : 1/150;
      const calc = price * multiplier * 2 * (cbrRate / 100) * days;
      setPenalty(calc.toFixed(2));
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
          {/* ... поля формы ... */}
          <label>
            Ставка ЦБ
            <div className="subtitle">Считается автоматически исходя из даты передачи квартиры</div>
            <div className="rate-display">{cbrRate !== null ? `${cbrRate}%` : "—"}</div>
          </label>
          {/* ... кнопка и результаты ... */}
        </form>
        {overdueDays !== null && (
          <div className="result">
            <p><strong>Дней просрочки:</strong> {overdueDays}</p>
            {penalty !== null && <p><strong>Неустойка:</strong> {penalty} ₽</p>}
          </div>
        )}
      </div>
    </div>
  );
}
