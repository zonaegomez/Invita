import Image from "next/image";

interface GalleryProps {
  images: string[];
  variant: "grid" | "carousel" | "masonry";
}

/** La variante "grid" es la única implementada en el MVP; carousel/masonry
 * quedan como puntos de extensión declarados en ThemeConfig. */
export function Gallery({ images }: GalleryProps) {
  if (!images.length) return null;
  return (
    <section className="mx-auto max-w-lg px-6 py-6">
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            <Image src={src} alt={`Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
