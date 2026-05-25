import Image from "next/image";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-lg bg-brand-500 grid place-items-center text-white font-black"
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        aria-hidden
      >
        <Image src={"/vedaai.png"} width={30} height={30} alt=""/>
      </div>
      <span className="font-semibold text-ink-900 tracking-tight">VedaAI</span>
    </div>
  );
}
