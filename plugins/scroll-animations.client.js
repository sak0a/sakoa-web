export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    // Only run if IntersectionObserver is supported
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

      const animateOnScrollElements = document.querySelectorAll('.animate-on-scroll');

      // Animation definitions
      const animations = {
        'animate-fade-in': {
          keyframes: [
            { opacity: 0 },
            { opacity: 1 }
          ],
          options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        },
        'animate-slide-up': {
          keyframes: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        },
        'animate-slide-down': {
          keyframes: [
            { opacity: 0, transform: 'translateY(-20px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        },
        'animate-slide-in-right': {
          keyframes: [
            { opacity: 0, transform: 'translateX(20px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ],
          options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        },
        'animate-slide-in-left': {
          keyframes: [
            { opacity: 0, transform: 'translateX(-20px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ],
          options: { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
        },
        'animate-fade-in-delay-1': {
          keyframes: [
            { opacity: 0 },
            { opacity: 1 }
          ],
          options: { duration: 500, easing: 'ease-in-out', delay: 100, fill: 'forwards' }
        },
        'animate-fade-in-delay-2': {
          keyframes: [
            { opacity: 0 },
            { opacity: 1 }
          ],
          options: { duration: 500, easing: 'ease-in-out', delay: 200, fill: 'forwards' }
        },
        'animate-fade-in-delay-3': {
          keyframes: [
            { opacity: 0 },
            { opacity: 1 }
          ],
          options: { duration: 500, easing: 'ease-in-out', delay: 300, fill: 'forwards' }
        }
      };

      // Store animation instances for each element
      const elementAnimations = new Map();

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const element = entry.target;

          if (entry.isIntersecting) {
            // Element is entering the viewport

            // Get all animation classes from the element
            const classes = Array.from(element.classList);

            // Find the animation to apply
            let animationToApply = 'animate-fade-in'; // Default animation

            for (const cls of classes) {
              if (animations[cls]) {
                animationToApply = cls;
                break;
              }
            }

            // Apply the animation
            if (animations[animationToApply]) {
              const { keyframes, options } = animations[animationToApply];

              // Cancel any existing animation
              if (elementAnimations.has(element)) {
                elementAnimations.get(element).cancel();
              }

              // Create and store the new animation
              const animation = element.animate(keyframes, options);
              elementAnimations.set(element, animation);

              // Ensure it's visible during animation
              element.style.opacity = '1';
            }
          } else {
            // Element is leaving the viewport

            // Reset the element to its initial state
            element.style.opacity = '0';

            // Cancel any existing animation
            if (elementAnimations.has(element)) {
              elementAnimations.get(element).cancel();
              elementAnimations.delete(element);
            }
          }
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when at least 10% of the element is visible
      });

      // Observe all elements with the animate-on-scroll class
      animateOnScrollElements.forEach(element => {
        // Set initial state
        element.style.opacity = '0';
        observer.observe(element);
      });
    } else {
      // If IntersectionObserver is not supported or reduced motion is preferred,
      // make all elements visible without animations
      document.querySelectorAll('.animate-on-scroll').forEach(element => {
        element.style.opacity = '1';
      });
    }
  });
});
