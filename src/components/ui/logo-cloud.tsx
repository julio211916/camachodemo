import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  logos: Logo[];
};

export function LogoCloud({ logos }: LogoCloudProps) {
  return (
    <div className="relative w-full">
      <div className="flex w-full items-center justify-center overflow-hidden">
        <InfiniteSlider gap={48} className="flex items-center">
          {logos.map((logo) => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              width={logo.width || 120}
              height={logo.height || 40}
              className="max-h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 dark:invert"
            />
          ))}
        </InfiniteSlider>
      </div>
      
      <ProgressiveBlur
        direction="left"
        className="pointer-events-none absolute left-0 top-0 h-full w-24"
      />
      <ProgressiveBlur
        direction="right"
        className="pointer-events-none absolute right-0 top-0 h-full w-24"
      />
    </div>
  );
}
