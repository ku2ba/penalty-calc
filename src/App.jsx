import React, { useState } from "react";
import { parse, differenceInCalendarDays } from "date-fns";
import logo from "./assets/logo.jpg"; // импорт лого

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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          color: "#000",
          border: "3px solid #c3a255",
          borderRadius: "12px",
          maxWidth: "450px",
          width: "100%",
          padding: "2rem",
          boxSizing: "border-box",
          boxShadow: "0 0 15px #c3a255",
          textAlign: "center",
        }}
      >
        {/* Аватарка */}
        <img
          src={logo}
          alt="Логотип"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #c3a255",
            marginBottom: "1rem",
          }}
        />

        <h1 style={{ marginBottom: "1.5rem", color: "#c3a255" }}>
          Расчет неустойки
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <label>
            Стоимость объекта (₽)
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.3rem",
                borderRadius: "5px",
                border: "1px solid #c3a255",
              }}
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
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.3rem",
                borderRadius: "5px",
                border: "1px solid #c3a255",
              }}
            />
          </label>

          <label>
            Текущая дата (дд.мм.гггг)
            <input
              type="text"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              placeholder="дд.мм.гггг"
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.3rem",
                borderRadius: "5px",
                border: "1px solid #c3a255",
              }}
            />
          </label>

          <label>
            Тип лица
            <select
              value={personType}
              onChange={(e) => setPersonType(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.3rem",
                borderRadius: "5px",
                border: "1px solid #c3a255",
              }}
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
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.3rem",
                borderRadius: "5px",
                border: "1px solid #c3a255",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={excludeMoratorium}
              onChange={(e) => setExcludeMoratorium(e.target.checked)}
            />
            Исключить периоды моратория
          </label>

          <button
            type="submit"
            style={{
              backgroundColor: "#c3a255",
              color: "#000",
              fontWeight: "bold",
              padding: "0.7rem",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            Рассчитать
          </button>
        </form>

        {overdueDays !== null && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#f9f9f9",
              borderRadius: "6px",
              border: "2px solid #c3a255",
              color: "#000",
            }}
          >
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
