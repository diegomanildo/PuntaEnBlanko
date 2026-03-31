import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Paleta de colores para las barras del gráfico
const COLORES_BARRAS = [
  "rgba(0, 180, 90, 0.5)",
  "rgba(79, 158, 255, 0.5)",
  "rgba(245, 158, 11, 0.5)",
  "rgba(239, 68, 68, 0.5)",
  "rgba(168, 85, 247, 0.5)",
  "rgba(20, 184, 166, 0.5)",
  "rgba(249, 115, 22, 0.5)",
  "rgba(236, 72, 153, 0.5)",
  "rgba(234, 179, 8, 0.5)",
  "rgba(6, 182, 212, 0.5)",
];

const COLOR_HOY = "rgba(13, 202, 240, 1.0)";

function GraficoVentasMes({ porDia }) {
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const chartData = {
    labels: porDia.map((d) => {
      const [yyyy, mm, dd] = d.dia.split("-");
      const fecha = new Date(yyyy, mm - 1, dd);
      const fechaFormateada = fecha.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
      });
      return d.dia === hoyStr ? `${fechaFormateada} (Hoy)` : fechaFormateada;
    }),
    datasets: [
      {
        label: "Total del día",
        data: porDia.map((d) => d.total),
        backgroundColor: porDia.map((d, i) =>
          d.dia === hoyStr ? COLOR_HOY : COLORES_BARRAS[i % COLORES_BARRAS.length],
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => "$" + Number(context.raw).toLocaleString("es-AR"),
        },
      },
    },
    scales: {
      x: {
        grid: { display: true },
        ticks: {
          color: (ctx) => (porDia[ctx.index]?.dia === hoyStr ? "#0dcaf0" : "#666"),
          font: (ctx) => (porDia[ctx.index]?.dia === hoyStr ? { weight: "bold" } : {}),
        },
      },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: {
          callback: (v) => "$" + v.toLocaleString("es-AR"),
        },
      },
    },
  };

  return (
    <div className="card p-4 mb-4" style={{ borderRadius: 12 }}>
      <p
        className="text-muted mb-3"
        style={{
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
        }}
      >
        Ventas por día
      </p>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default GraficoVentasMes;