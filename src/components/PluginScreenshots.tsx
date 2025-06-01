import { useState, useEffect, useRef } from 'react';

interface Image {
  src: string;
  alt: string;
  caption: string;
}

interface PluginScreenshotsProps {
  images: Image[];
}

export default function PluginScreenshots({ images }: PluginScreenshotsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageSources = images.map(img => img.src);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px 0px', // Cargar cuando esté a 200px de entrar en el viewport
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const openLightbox = (src: string) => {
    setCurrentImageIndex(imageSources.indexOf(src));
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageSources.length) % imageSources.length);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageSources.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        previousImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    if (isLightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  if (!isVisible) {
    return (
      <section ref={sectionRef} className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Capturas de Pantalla</h2>
        <div className="grid grid-cols-2 gap-4">
          {images.map((_, index) => (
            <div key={index} className="aspect-video bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Capturas de Pantalla</h2>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <figure 
            key={index}
            className="cursor-pointer" 
            onClick={() => openLightbox(image.src)}
          >
            <img 
              src={image.src} 
              alt={image.alt} 
              className="rounded-lg shadow-md w-full h-auto" 
              loading="lazy"
            />
            <figcaption className="text-sm text-gray-600 mt-2">
              {image.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button 
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={closeLightbox}
          >
            ×
          </button>
          <button 
            className="absolute left-4 text-white text-4xl hover:text-gray-300"
            onClick={previousImage}
          >
            ‹
          </button>
          <button 
            className="absolute right-4 text-white text-4xl hover:text-gray-300"
            onClick={nextImage}
          >
            ›
          </button>
          <img 
            src={images[currentImageIndex].src}
            alt={images[currentImageIndex].alt}
            className="max-h-[90vh] max-w-[90vw] object-contain" 
          />
        </div>
      )}
    </section>
  );
} 