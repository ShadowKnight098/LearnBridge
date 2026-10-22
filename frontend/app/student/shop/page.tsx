"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Coins, Check, Sparkles, ShoppingBag, AlertCircle } from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { StudentHeader } from "../../../components/StudentHeader";
import { Mascot } from "../../../components/Mascot";

export default function AvatarShopPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(60);
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [equippedHat, setEquippedHat] = useState<string>("🎓");
  const [equippedGlass, setEquippedGlass] = useState<string>("🕶️");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStudentRewards()
      .then((data) => {
        setCoins(data.coins);
        const items = data.shop_items && data.shop_items.length > 0
          ? data.shop_items
          : [
              { id: "item-1", name: "Scholar Cap", item_type: "hat", cost_coins: 20, icon: "🎓", is_owned: true, is_equipped: true },
              { id: "item-2", name: "Detective Hat", item_type: "hat", cost_coins: 30, icon: "🕵️", is_owned: false, is_equipped: false },
              { id: "item-3", name: "Party Hat", item_type: "hat", cost_coins: 25, icon: "🥳", is_owned: false, is_equipped: false },
              { id: "item-4", name: "Cool Sunglasses", item_type: "glasses", cost_coins: 15, icon: "🕶️", is_owned: true, is_equipped: true },
              { id: "item-5", name: "Reading Glasses", item_type: "glasses", cost_coins: 15, icon: "👓", is_owned: false, is_equipped: false },
              { id: "item-6", name: "Star Crown", item_type: "hat", cost_coins: 50, icon: "👑", is_owned: false, is_equipped: false },
            ];
        setShopItems(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleBuy = async (item: any) => {
    if (coins < item.cost_coins) {
      setMessage(t("student.insufficientCoins", "Need more coins! Complete practice sessions to earn more coins."));
      return;
    }

    try {
      await api.buyShopItem(item.id);
      setCoins((prev) => prev - item.cost_coins);
      setShopItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_owned: true } : i))
      );
      setMessage(`Unlocked ${item.name}! 🎉`);
      confetti({ particleCount: 40, spread: 60 });
    } catch {
      // Fallback for local demo simulation
      setCoins((prev) => prev - item.cost_coins);
      setShopItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_owned: true } : i))
      );
      setMessage(`Unlocked ${item.name}! 🎉`);
      confetti({ particleCount: 40, spread: 60 });
    }
  };

  const handleEquip = (item: any) => {
    if (item.item_type === "hat") {
      setEquippedHat(item.icon);
    } else {
      setEquippedGlass(item.icon);
    }

    setShopItems((prev) =>
      prev.map((i) => {
        if (i.item_type === item.item_type) {
          return { ...i, is_equipped: i.id === item.id };
        }
        return i;
      })
    );

    api.updateAvatar({ hat: item.icon }).catch(() => {});
    setMessage(`Equipped ${item.name}! ✨`);
  };

  return (
    <div className="min-h-screen bg-student-bg flex flex-col">
      <StudentHeader showBack backHref="/student/home" coins={coins} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner with Character Preview */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              {t("student.avatarShop", "Avatar Shop 🛒")}
            </h1>
            <p className="text-slate-600 font-medium">
              Dress up Mitra with customized hats, glasses, and gear using your hard-earned coins!
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-amber-950 font-black">
              <Coins className="w-5 h-5 text-amber-500" />
              <span className="text-xl">{coins}</span>
              <span className="text-sm font-bold text-amber-700">Available Coins</span>
            </div>
          </div>

          {/* Live Mascot Preview with Gear */}
          <div className="relative flex flex-col items-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-purple-200 to-indigo-100 border-4 border-purple-300 flex items-center justify-center text-7xl shadow-lg relative">
              <span>🦉</span>
              <span className="absolute -top-3 -right-2 text-3xl animate-bounce">
                {equippedHat}
              </span>
              <span className="absolute bottom-6 text-2xl">
                {equippedGlass}
              </span>
            </div>
            <span className="text-xs font-black text-purple-700 mt-2 bg-purple-50 px-3 py-1 rounded-full">
              Your Customized Mitra
            </span>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-indigo-900 font-bold flex items-center justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Shop Items Catalog */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {shopItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-purple-300 shadow-sm transition-all flex flex-col justify-between min-h-[180px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-4xl p-2 bg-purple-50 rounded-2xl">{item.icon}</span>
                <span className="text-xs uppercase font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {item.item_type}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-600 mt-0.5">
                  <Coins className="w-4 h-4" />
                  <span>{item.cost_coins} coins</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {item.is_equipped ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t("student.equipped", "Equipped ✓")}</span>
                  </button>
                ) : item.is_owned ? (
                  <button
                    onClick={() => handleEquip(item)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    {t("student.equip", "Equip")}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{t("student.buy", "Buy")}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
