export const Colors = {
  light: {
    primary: "#744C27",
    primaryDark: "#523318",
    accent: "#D2A574",
    background: "#FBF8F5",
    surface: "#FFFFFF",
    surfaceVariant: "#F3ECE4",
    border: "#E7DDD2",
    text: "#1E1815",
    textMuted: "#7B6F67",
    success: "#2E7D32",
    warning: "#B26A00",
    error: "#BA1A1A",
    whatsapp: "#25D366",
    cardGradient: ["#744C27", "#523318"],
    statusBarStyle: "dark",
  },
  dark: {
    primary: "#D2A574",
    primaryDark: "#BA8C5B",
    accent: "#E5BE94",
    background: "#12100E",
    surface: "#1B1715",
    surfaceVariant: "#27221F",
    border: "#3B332D",
    text: "#F5EFE9",
    textMuted: "#A3978E",
    success: "#66BB6A",
    warning: "#FFA726",
    error: "#FF897D",
    whatsapp: "#25D366",
    cardGradient: ["#2B231E", "#1B1613"],
    statusBarStyle: "light",
  },
};

export const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0 ج.م";
  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 0,
  }).format(val) + " ج.م";
};

export const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0";
  return new Intl.NumberFormat("ar-EG").format(val);
};

export const formatPercent = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "0%";
  return `${Math.round(val * 100)}%`;
};
