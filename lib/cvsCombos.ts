export interface ComboItem {
  name: string;
  price: number;
}

export interface Combo {
  title: string;
  items: ComboItem[];
  note?: string;
}

export const CVS_COMBOS: Combo[] = [
  {
    title: "제일 든든하게",
    items: [
      { name: "도시락(제육)", price: 5500 },
      { name: "흰우유 500ml", price: 1800 },
      { name: "바나나 2입", price: 2200 },
    ],
  },
  {
    title: "가볍게 한 끼",
    items: [
      { name: "주먹밥", price: 2500 },
      { name: "두유", price: 1500 },
      { name: "삶은계란 2입", price: 2400 },
      { name: "방울토마토", price: 2800 },
    ],
  },
  {
    title: "컵라면이 먹고 싶으면",
    items: [
      { name: "샌드위치", price: 3200 },
      { name: "흰우유 500ml", price: 1800 },
      { name: "컵과일", price: 3000 },
    ],
    note: "라면 대신 이 조합이면 단백질·과일이 채워져요.",
  },
];

export function comboTotal(combo: Combo): number {
  return combo.items.reduce((sum, item) => sum + item.price, 0);
}

export function fitsUnderBudget(combo: Combo): boolean {
  return comboTotal(combo) <= 10000;
}
