"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { jsPDF } from "jspdf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculateLoan, formatCurrency, getPreset } from "@/lib/loan";

const schema = z.object({
  amount: z.coerce.number().positive("Loan amount must be greater than 0"),
  annualRate: z.coerce.number().positive("Interest rate must be greater than 0"),
  tenureMonths: z.coerce.number().positive("Tenure must be greater than 0"),
});

const presets = ["Home Loan", "Car Loan", "Education Loan", "Personal Loan"];

export default function HomePage() {
  const [selectedPreset, setSelectedPreset] = useState("Home Loan");
  const [page, setPage] = useState(1);
  const [isDark, setIsDark] = useState(true);
  const [compareA, setCompareA] = useState({
    amount: 500000,
    annualRate: 8.5,
    tenureMonths: 180,
  });
  const [compareB, setCompareB] = useState({
    amount: 700000,
    annualRate: 9.2,
    tenureMonths: 240,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getPreset("Home Loan"),
  });

  const values = watch();
  const amount = Number(values.amount || 0);
  const annualRate = Number(values.annualRate || 0);
  const tenureMonths = Number(values.tenureMonths || 0);

  const result = useMemo(
    () => calculateLoan({ amount, annualRate, tenureMonths }),
    [amount, annualRate, tenureMonths],
  );

  const pieData = [
    { name: "Principal", value: amount || 0 },
    { name: "Interest", value: result.totalInterest || 0 },
  ];

  const comparisonA = useMemo(() => calculateLoan(compareA), [compareA]);
  const comparisonB = useMemo(() => calculateLoan(compareB), [compareB]);

  const emiDiff = Math.abs(comparisonA.emi - comparisonB.emi);
  const interestDiff = Math.abs(
    comparisonA.totalInterest - comparisonB.totalInterest,
  );
  const savings =
    Math.max(comparisonA.totalAmount, comparisonB.totalAmount) -
    Math.min(comparisonA.totalAmount, comparisonB.totalAmount);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(result.schedule.length / pageSize));
  const pagedSchedule = result.schedule.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const onSubmit = () => {};

  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 50;

    const addLine = (text: string, fontStyle: "normal" | "bold" = "normal", fontSize = 11) => {
      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.text(text, margin, y);
      y += fontSize + 4;
    };

    addLine("Smart EMI & Loan Calculator Pro", "bold", 18);
    addLine("", "normal", 1);
    addLine(`Loan Amount: ${formatCurrency(amount)}`);
    addLine(`Interest Rate: ${annualRate.toFixed(2)}% per annum`);
    addLine(`Tenure: ${tenureMonths} months`);
    addLine(`Monthly EMI: ${formatCurrency(result.emi)}`);
    addLine(`Total Interest: ${formatCurrency(result.totalInterest)}`);
    addLine(`Total Amount: ${formatCurrency(result.totalAmount)}`);
    addLine("", "normal", 1);
    addLine("Amortization Schedule", "bold", 12);

    const scheduleRows = result.schedule.slice(0, 24);
    if (scheduleRows.length === 0) {
      addLine("No schedule data available.");
    } else {
      scheduleRows.forEach((row) => {
        if (y > pageHeight - 80) {
          doc.addPage();
          y = 50;
        }
        addLine(
          `Month ${row.month} | EMI ${formatCurrency(row.emi)} | Principal ${formatCurrency(row.principal)} | Interest ${formatCurrency(row.interest)} | Balance ${formatCurrency(row.balance)}`,
          "normal",
          9,
        );
      });
    }

    doc.save("loan-report.pdf");
  };

  const shareSummary = async () => {
    const text = `Loan Amount: ${formatCurrency(amount)}\nEMI: ${formatCurrency(result.emi)}\nTotal Interest: ${formatCurrency(result.totalInterest)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert("Loan summary copied to clipboard!");
    }
  };

  const theme = isDark
    ? "bg-slate-950 text-slate-50"
    : "bg-slate-50 text-slate-900";
  const panel = isDark
    ? "border-white/10 bg-slate-900/50 text-slate-50"
    : "border-slate-200 bg-white text-slate-900";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const soft = isDark ? "bg-white/5" : "bg-slate-100";
  const inputClass = isDark
    ? "border-white/10 bg-white/5"
    : "border-slate-200 bg-slate-50";

  return (
    <main className={`min-h-screen ${theme}`}>
      <nav className={`sticky top-0 z-50 border-b ${isDark ? "border-white/10 bg-slate-950/80" : "border-slate-200 bg-white/80"} backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Smart EMI</p>
            <h2 className="text-sm font-semibold">Loan Calculator Pro</h2>
          </div>
          <div className="hidden gap-4 text-sm md:flex">
            <a href="#calculator" className="hover:text-cyan-400">Calculator</a>
            <a href="#comparison" className="hover:text-cyan-400">Comparison</a>
            <a href="#schedule" className="hover:text-cyan-400">Schedule</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDark((v) => !v)}
              className={`rounded-full px-3 py-2 text-sm ${isDark ? "bg-white/5" : "bg-slate-200"}`}
            >
              {isDark ? "Light" : "Dark"}
            </button>
            <a
              href="https://digitalheroesco.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Built for Digital Heroes
            </a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <section className={`rounded-3xl border p-5 shadow-2xl backdrop-blur-xl ${soft}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Smart EMI & Loan Calculator Pro</p>
              <h1 className="mt-2 text-3xl font-semibold">Loan planning made clear</h1>
            </div>
          </div>
        </section>

        <section id="calculator" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-3xl border p-5 backdrop-blur-xl ${panel}`}>
           
            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    const defaults = getPreset(preset);
                    setValue("amount", defaults.amount);
                    setValue("annualRate", defaults.annualRate);
                    setValue("tenureMonths", defaults.tenureMonths);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm ${selectedPreset === preset ? "bg-cyan-500 text-slate-950" : isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className={`text-sm ${muted}`}>Loan Amount</span>
                  <input
                    {...register("amount")}
                    type="number"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400 ${inputClass}`}
                  />
                  {errors.amount && (
                    <p className="text-xs text-rose-400">{errors.amount.message}</p>
                  )}
                </label>
                <label className="space-y-2">
                  <span className={`text-sm ${muted}`}>Interest Rate (%)</span>
                  <input
                    {...register("annualRate")}
                    type="number"
                    step="0.1"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400 ${inputClass}`}
                  />
                  {errors.annualRate && (
                    <p className="text-xs text-rose-400">{errors.annualRate.message}</p>
                  )}
                </label>
                <label className="space-y-2">
                  <span className={`text-sm ${muted}`}>Tenure (Months)</span>
                  <input
                    {...register("tenureMonths")}
                    type="number"
                    className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400 ${inputClass}`}
                  />
                  {errors.tenureMonths && (
                    <p className="text-xs text-rose-400">{errors.tenureMonths.message}</p>
                  )}
                </label>
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Calculate EMI
              </button>
            </form>
          </div>

          <aside className={`rounded-3xl border p-5 backdrop-blur-xl ${panel}`}>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className={`rounded-2xl p-4 ${soft}`}>
                <p className={`text-sm ${muted}`}>Monthly EMI</p>
                <h2 className="mt-1 text-2xl font-semibold">{formatCurrency(result.emi)}</h2>
              </div>
              <div className={`rounded-2xl p-4 ${soft}`}>
                <p className={`text-sm ${muted}`}>Total Interest</p>
                <h2 className="mt-1 text-2xl font-semibold">{formatCurrency(result.totalInterest)}</h2>
              </div>
              <div className={`rounded-2xl p-4 ${soft}`}>
                <p className={`text-sm ${muted}`}>Total Payable</p>
                <h2 className="mt-1 text-2xl font-semibold">{formatCurrency(result.totalAmount)}</h2>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-2xl p-4 ${soft}`}>
            <p className={`text-sm ${muted}`}>Effective Monthly Cost</p>
            <h3 className="mt-1 text-xl font-semibold">{formatCurrency(result.emi)}</h3>
          </div>
          <div className={`rounded-2xl p-4 ${soft}`}>
            <p className={`text-sm ${muted}`}>Interest Percentage</p>
            <h3 className="mt-1 text-xl font-semibold">{((result.totalInterest / Math.max(amount, 1)) * 100).toFixed(2)}%</h3>
          </div>
          <div className={`rounded-2xl p-4 ${soft}`}>
            <p className={`text-sm ${muted}`}>Loan-to-Interest Ratio</p>
            <h3 className="mt-1 text-xl font-semibold">{(amount / Math.max(result.totalInterest, 1)).toFixed(2)}x</h3>
          </div>
        </section>

        <section id="comparison" className={`rounded-3xl border p-5 backdrop-blur-xl ${panel}`}>
          <h2 className="text-lg font-semibold">Loan Comparison</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <p className="font-medium">Loan A</p>
              <input type="number" value={compareA.amount} onChange={(e) => setCompareA({ ...compareA, amount: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
              <input type="number" value={compareA.annualRate} onChange={(e) => setCompareA({ ...compareA, annualRate: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
              <input type="number" value={compareA.tenureMonths} onChange={(e) => setCompareA({ ...compareA, tenureMonths: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
            </div>
            <div className="space-y-3">
              <p className="font-medium">Loan B</p>
              <input type="number" value={compareB.amount} onChange={(e) => setCompareB({ ...compareB, amount: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
              <input type="number" value={compareB.annualRate} onChange={(e) => setCompareB({ ...compareB, annualRate: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
              <input type="number" value={compareB.tenureMonths} onChange={(e) => setCompareB({ ...compareB, tenureMonths: Number(e.target.value) })} className={`w-full rounded-2xl border px-3 py-2 ${inputClass}`} />
            </div>
            <div className={`rounded-2xl p-4 ${soft}`}>
              <p className={`text-sm ${muted}`}>EMI Difference</p>
              <h3 className="mt-1 text-xl font-semibold">{formatCurrency(emiDiff)}</h3>
              <p className={`mt-3 text-sm ${muted}`}>Interest Difference</p>
              <h3 className="mt-1 text-xl font-semibold">{formatCurrency(interestDiff)}</h3>
              <p className={`mt-3 text-sm ${muted}`}>Savings</p>
              <h3 className="mt-1 text-xl font-semibold">{formatCurrency(savings)}</h3>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className={`rounded-3xl border p-5 backdrop-blur-xl ${panel}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Loan Breakdown</h3>
              <span className={`text-sm ${muted}`}>Principal vs Interest</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} innerRadius={52} outerRadius={92} dataKey="value">
                    <Cell fill="#06b6d4" />
                    <Cell fill="#8b5cf6" />
                  </Pie>
                  <Tooltip formatter={(value) => (typeof value === "number" ? formatCurrency(value) : value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div id="schedule" className={`rounded-3xl border p-5 backdrop-blur-xl ${panel}`}>
            <div className="flex flex-wrap gap-2">
              <button onClick={shareSummary} className={`rounded-xl px-3 py-2 text-sm ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                Share Results
              </button>
              <button onClick={handleExportPDF} className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950">
                Export PDF
              </button>
            </div>
            <div className={`mt-4 overflow-hidden rounded-2xl border ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <table className="min-w-full text-sm">
                <thead className={`${soft} text-left`}>
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">EMI</th>
                    <th className="px-3 py-2">Principal</th>
                    <th className="px-3 py-2">Interest</th>
                    <th className="px-3 py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedSchedule.map((row) => (
                    <tr key={row.month} className={`border-t ${isDark ? "border-white/5" : "border-slate-200"}`}>
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2">{formatCurrency(row.emi)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.principal)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.interest)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-between">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`rounded-xl px-3 py-2 disabled:opacity-40 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                Previous
              </button>
              <span className="self-center text-sm">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`rounded-xl px-3 py-2 disabled:opacity-40 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className={`border-t py-6 text-center text-sm ${muted}`}>
        <div className="mx-auto max-w-7xl px-4">
          <p className="font-semibold text-blue-500">Anoop Gangwar</p>
          <p>anoopgangwar4@gmail.com</p>
          <a href="https://github.com/anoopgangwar" target="_blank" rel="noreferrer" className="mt-1 inline-block text-cyan-300">GitHub</a>
        </div>
      </footer>
    </main>
  );
}
