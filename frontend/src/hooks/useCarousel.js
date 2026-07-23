import { useState, useCallback, useRef, useEffect } from 'react';

export function useCarousel() {
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef();

  useEffect(() => {
    const listener = (e) => {
      if (!carouselOpen) return;
      if (e.key === 'ArrowLeft') prevCarousel();
      if (e.key === 'ArrowRight') nextCarousel();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [carouselOpen, carouselIndex, carouselItems]);

  const openCarouselWith = useCallback((items, startIndex = 0) => {
    setCarouselItems(items || []);
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  }, []);

  const closeCarousel = useCallback(() => {
    setCarouselOpen(false);
    setCarouselItems([]);
    setCarouselIndex(0);
  }, []);

  const prevCarousel = useCallback(() => {
    setCarouselIndex(i => (i - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  const nextCarousel = useCallback(() => {
    setCarouselIndex(i => (i + 1) % carouselItems.length);
  }, [carouselItems.length]);

  return {
    carouselOpen,
    setCarouselOpen,
    carouselItems,
    setCarouselItems,
    carouselIndex,
    setCarouselIndex,
    carouselRef,
    openCarouselWith,
    closeCarousel,
    prevCarousel,
    nextCarousel,
  };
}
