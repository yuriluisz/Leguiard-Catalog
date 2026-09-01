"use client";

type Category = {
  id: string;
  name: string;
  displayOrder: number;
};

type CategoryNavProps = {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  totalProductsCount: number;
  categoryCounts: Record<string, number>;
};

export function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  totalProductsCount,
  categoryCounts
}: CategoryNavProps) {
  return (
    <nav aria-label="Navegação por categorias" className="sticky top-[73px] sm:top-[81px] z-20 bg-white/95 backdrop-blur-md border-b border-zinc-100 py-3 shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto scroll-smooth py-0.5">
          {/* All category pill */}
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            style={{
              backgroundColor: activeCategory === "all" ? "var(--store-primary, #18181b)" : undefined
            }}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
              activeCategory === "all"
                ? "text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900"
            }`}
          >
            <span>Todas</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                activeCategory === "all" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {totalProductsCount}
            </span>
          </button>

          {/* Individual Category Pills */}
          {categories.map((category) => {
            const count = categoryCounts[category.id] ?? 0;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                style={{
                  backgroundColor: isActive ? "var(--store-primary, #18181b)" : undefined
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900"
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
