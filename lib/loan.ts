export type LoanInputs = {
  amount: number;
  annualRate: number;
  tenureMonths: number;
};

export type ScheduleItem = {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const calculateLoan = ({ amount, annualRate, tenureMonths }: LoanInputs) => {
  if (amount <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    return {
      emi: 0,
      totalInterest: 0,
      totalAmount: 0,
      monthlyRate: 0,
      schedule: [] as ScheduleItem[],
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const n = tenureMonths;
  const emi =
    monthlyRate === 0
      ? amount / n
      : (amount * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);

  const totalAmount = emi * n;
  const totalInterest = totalAmount - amount;

  const schedule: ScheduleItem[] = [];
  let balance = amount;

  for (let i = 1; i <= n; i += 1) {
    const interest = balance * monthlyRate;
    const principal = emi - interest;
    balance = Math.max(0, balance - principal);

    schedule.push({
      month: i,
      emi,
      principal,
      interest,
      balance,
    });
  }

  return {
    emi,
    totalInterest,
    totalAmount,
    monthlyRate,
    schedule,
  };
};

export const getPreset = (preset: string) => {
  switch (preset) {
    case "Home Loan":
      return { amount: 5000000, annualRate: 8.5, tenureMonths: 240 };
    case "Car Loan":
      return { amount: 800000, annualRate: 9.2, tenureMonths: 48 };
    case "Education Loan":
      return { amount: 1200000, annualRate: 7.1, tenureMonths: 84 };
    case "Personal Loan":
      return { amount: 300000, annualRate: 12.5, tenureMonths: 36 };
    default:
      return { amount: 1000000, annualRate: 10, tenureMonths: 60 };
  }
};
