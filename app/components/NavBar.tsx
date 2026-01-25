import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Link, useLocation, useNavigate } from "react-router";
import { Image } from "@unpic/react";
import pl_book from "~/assets/pl_book.svg";

// Copypasted from https://craftedbylunar.netlify.app/app/bottom-nav
// Adapted to have types and use TailwindCSS

// ngl dit ziet er echt niet uit de nieuwe ui is van alles het langzaamst aan het gaan...
// en hij is niet eens heel nodig imo
// - siem

export default function NavBar({ items, className = "" }: { items: { label: string; to: string }[]; children?: React.ReactNode; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSelectorRef = useRef<HTMLDivElement | null>(null);
  const hoverSelectorRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const idx = items.findIndex((it) => location.pathname === it.to || location.pathname.startsWith(it.to + "/"));
    if (idx >= 0) setActiveIndex(idx);
  }, [location.pathname, items]);

  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];
    const itemsContainer = itemsContainerRef.current;

    if (activeItem && itemsContainer && activeSelectorRef.current) {
      const { offsetWidth: width } = activeItem;
      const containerRect = itemsContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const relativeLeft = itemRect.left - containerRect.left;

      gsap.to(activeSelectorRef.current, {
        x: relativeLeft,
        width,
        duration: 0.45,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
      });
    }
  }, [activeIndex, items]);

  const handleItemMouseIn = (index: number) => {
    const currentItem = itemRefs.current[index];

    if (currentItem && hoverSelectorRef.current && itemsContainerRef.current) {
      const { offsetWidth: width } = currentItem;
      const containerRect = itemsContainerRef.current.getBoundingClientRect();
      const itemRect = currentItem.getBoundingClientRect();
      const relativeLeft = itemRect.left - containerRect.left;

      gsap.to(hoverSelectorRef.current, {
        opacity: 1,
        x: relativeLeft - 15,
        width: width + 30,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
      });
    }
  };

  const handleItemMouseLeave = () => {
    if (hoverSelectorRef.current) {
      gsap.to(hoverSelectorRef.current, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleItemClick = (index: number) => {
    const target = items[index];
    setActiveIndex(index);
    if (target && target.to) navigate(target.to);
  };

  return (
    <div
      className={`backdrop-blur-3xl fixed top-4 left-0 right-0 z-50 flex w-full justify-center bg-transparent ${className}`}
      onMouseLeave={handleItemMouseLeave}
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="rounded-full bg-neutral-800/60 backdrop-blur-md [-webkit-backdrop-filter:blur(8px)] py-1 px-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-8">
            <Link to="/" className="ml-4 inline-flex justify-center items-center rounded-full cursor-pointer relative shrink-0">
              <Image src={pl_book} alt="PolarLearn Logo" width={30} height={30} />
            </Link>

            <div className="flex relative items-center h-12.5 gap-8 max-[590px]:hidden" ref={itemsContainerRef}>
              <div
                ref={activeSelectorRef}
                className="lunarNavActiveSelector absolute h-[85%] flex justify-center items-end left-0 pointer-events-none origin-left transform-gpu"
              >
                <div className="h-1 w-1 bg-white rounded-full mb-1" />
              </div>
              <div
                ref={hoverSelectorRef}
                className="lunarNavHoverSelector absolute h-[95%] bg-neutral-700 backdrop-blur-sm rounded-[30px] border border-[rgba(0,0,0,0.08)] px-6 opacity-0 pointer-events-none origin-left transform-gpu shadow-[0_8px_20px_rgba(0,0,0,0.12)] will-change-[transform,opacity]"
              />
              {items.map((item, index) => (
                <div
                  key={index}
                  ref={(el: HTMLDivElement | null) => { itemRefs.current[index] = el }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleItemClick(index);
                    }
                  }}
                  className={`cursor-pointer relative px-2 py-1 transition-colors duration-200 ${activeIndex === index ? "text-white font-bold" : "text-white/70 hover:text-white"}`}
                  onMouseEnter={() => handleItemMouseIn(index)}
                  onClick={() => handleItemClick(index)}
                  aria-current={activeIndex === index ? "page" : undefined}
                >
                  <span className="text-[18px] font-medium whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="flex items-center gap-3">
            {children}
          </div> */}
        </div>
      </div>
    </div>
  );
}
