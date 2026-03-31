const COLOR_MAP = {
  blue: { row: "#dceefb", badge: "#185FA5" },
  green: { row: "#eaf3de", badge: "#3B6D11" },
  purple: { row: "#eeedfe", badge: "#534AB7" },
  teal: { row: "#e1f5ee", badge: "#0F6E56" },
  orange: { row: "#faeeda", badge: "#854F0B" },
  pink: { row: "#fbeaf0", badge: "#993556" },
};

export const rowStyle = (color) =>
  color ? { backgroundColor: COLOR_MAP[color]?.row + " !important" } : {};

export const badgeStyle = (color) =>
  color
    ? {
        backgroundColor: COLOR_MAP[color]?.row,
        color: COLOR_MAP[color]?.badge,
        border: `1px solid ${COLOR_MAP[color]?.badge}33`,
      }
    : null;
