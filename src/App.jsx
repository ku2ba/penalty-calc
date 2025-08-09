import React, { useState } from "react";
import { parse, differenceInCalendarDays } from "date-fns";
import logo from "./assets/logo.jpg"; 
import "./App.css";

export default function App() {
  const [cost, setCost] = useState("");
  const [handoverDate, setHandoverDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [personType, setPersonType] = useState("Физическое лицо");
  const [cbrRate, setCbrRate] = useState("");
  const [excludeMoratorium, setExcludeMoratorium] = useState(false);

  const [overdueDays, setOverdueDays] = useState(null);
  const [penalty, setPenalty] = useState(null);

  const calculatePenalty = () => {
    const handover = parse(handoverDate, "dd.MM.yyyy", new Date());
    const current = parse(currentDate, "dd.MM.yyyy", new Date());

    let days = differenceInCalendarDays(current, handover);
    if (days < 0) days = 0;

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

    const rate = parseFloat(cbrRate.replace(",", "."));
    const price = parseFloat(cost);

    if (!isNaN(rate) && !isNaN(price) && days > 0) {
      const multiplier =
        personType === "Физическое лицо" ? 1 / 300 : 1 / 150;
      const calcPenalty =
        price * multiplier * 2 * (rate / 100) * days;
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
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </label>

          <label>
            Дата передачи квартиры по ДДУ (дд.мм.гггг)
            <input
              type="text"
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              placeholder="дд.мм.гггг"
              required
            />
          </label>

          <label>
            Фактическая передача квартиры (дд.мм.гггг)
            <input
              type="text"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              placeholder="дд.мм.гггг"
              required
            />
          </label>

          <label>
            Тип лица
            <select
              value={personType}
              onChange={(e) => setPersonType(e.target.value)}
            >
              <option>Физическое лицо</option>
              <option>Юридическое лицо</option>
            </select>
          </label>

          <label>
            Ставка ЦБ (%)
            <input
              type="number"
              value={cbrRate}
              onChange={(e) => setCbrRate(e.target.value)}
              step="0.01"
              required
            />
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
}
