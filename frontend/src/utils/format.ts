import dayjs from "dayjs";

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatWeightKg(value: number | string | null | undefined) {
  const weight = Number(value ?? 0);
  return `${weight.toFixed(2)} kg`;
}

export function formatDate(value: string | Date | null | undefined, format = "DD/MM/YYYY") {
  if (!value) {
    return "";
  }
  return dayjs(value).format(format);
}

export function formatDateTime(value: string | Date | null | undefined, format = "DD/MM/YYYY HH:mm") {
  return formatDate(value, format);
}
