import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger)

    // Performance optimization - prevent layout thrashing
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      autoSleep: 60,
      units: {
        left: "px",
        top: "px",
        rotation: "deg"
      }
    })

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Show all elements immediately if reduced motion is preferred
      gsap.set('.animate-on-scroll', { opacity: 1, y: 0, x: 0, scale: 1 })
      return;
    }

    // Enhanced GSAP Animation System
    const createScrollAnimation = (selector, animation, options = {}) => {
      const elements = document.querySelectorAll(selector)
      if (!elements.length) return

      elements.forEach((element, index) => {
        // Set initial state
        gsap.set(element, animation.from)

        // Create scroll trigger animation with performance optimizations
        gsap.to(element, {
          ...animation.to,
          duration: animation.duration || 0.8,
          ease: animation.ease || 'power2.out',
          delay: (options.stagger || 0) * index,
          force3D: true,
          willChange: 'transform, opacity',
          scrollTrigger: {
            trigger: element,
            start: options.start || 'top 85%',
            end: options.end || 'bottom 15%',
            toggleActions: 'play none none reverse',
            fastScrollEnd: true,
            preventOverlaps: true,
            ...options.scrollTrigger
          }
        })
      })
    }

    // Modern Animation Definitions
    const animations = {
      'animate-fade-in': {
        from: { opacity: 0 },
        to: { opacity: 1 },
        duration: 0.6,
        ease: 'power2.out'
      },
      'animate-fade-in-up': {
        from: { opacity: 0, y: 30 },
        to: { opacity: 1, y: 0 },
        duration: 0.8,
        ease: 'power3.out'
      },
      'animate-fade-in-down': {
        from: { opacity: 0, y: -30 },
        to: { opacity: 1, y: 0 },
        duration: 0.8,
        ease: 'power3.out'
      },
      'animate-slide-up': {
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        duration: 0.7,
        ease: 'power2.out'
      },
      'animate-slide-down': {
        from: { opacity: 0, y: -40 },
        to: { opacity: 1, y: 0 },
        duration: 0.7,
        ease: 'power2.out'
      },

      'animate-slide-in-right': {
        from: { opacity: 0, x: 30 },
        to: { opacity: 1, x: 0 },
        duration: 0.7,
        ease: 'power2.out'
      },
      'animate-slide-in-left': {
        from: { opacity: 0, x: -30 },
        to: { opacity: 1, x: 0 },
        duration: 0.7,
        ease: 'power2.out'
      },
      'animate-scale-in': {
        from: { opacity: 0, scale: 0.9 },
        to: { opacity: 1, scale: 1 },
        duration: 0.6,
        ease: 'back.out(1.7)'
      },
      'animate-bounce-in': {
        from: { opacity: 0, scale: 0.3 },
        to: { opacity: 1, scale: 1 },
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      }
    }

    // Apply animations to elements
    Object.keys(animations).forEach(animationClass => {
      createScrollAnimation(`.${animationClass}`, animations[animationClass], {
        stagger: 0.1,
        start: 'top 85%'
      })
    })

    // Special staggered animations for delay classes
    const delayAnimations = [
      { selector: '.animate-fade-in-delay-1', delay: 0.1 },
      { selector: '.animate-fade-in-delay-2', delay: 0.2 },
      { selector: '.animate-fade-in-delay-3', delay: 0.3 },
      { selector: '.animate-fade-in-delay-4', delay: 0.4 }
    ]

    delayAnimations.forEach(({ selector, delay }) => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        gsap.set(element, { opacity: 0 })
        gsap.to(element, {
          opacity: 1,
          duration: 0.6,
          delay: delay,
          ease: 'power2.out'
        })
      })
    })

    // Enhanced micro-interactions
    const initMicroInteractions = () => {
      // Button hover effects
      const buttons = document.querySelectorAll('.btn')
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          gsap.to(button, {
            scale: 1.02,
            duration: 0.2,
            ease: 'power2.out'
          })
        })

        button.addEventListener('mouseleave', () => {
          gsap.to(button, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out'
          })
        })
      })

      // Card hover effects
      const cards = document.querySelectorAll('.card')
      cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -5,
            duration: 0.3,
            ease: 'power2.out'
          })
        })

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
          })
        })
      })

      // Enhanced Navigation scroll effect - Compact instead of hide
      let lastScrollY = window.scrollY
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY
        const nav = document.querySelector('.navigation')
        const navContainer = nav?.querySelector('.nav-container')
        const navTitle = nav?.querySelector('.nav-title')
        const navLogo = nav?.querySelector('.nav-logo-img')

        if (nav && navContainer) {
          if (currentScrollY > 100) {
            // Make navigation compact
            nav.classList.add('nav-compact')

            gsap.to(navContainer, {
              padding: '0.5rem 1.5rem',
              duration: 0.3,
              ease: 'power2.out'
            })

            if (navTitle) {
              gsap.to(navTitle, {
                fontSize: '0.875rem',
                duration: 0.3,
                ease: 'power2.out'
              })
            }

            if (navLogo) {
              gsap.to(navLogo, {
                width: '32px',
                height: '32px',
                duration: 0.3,
                ease: 'power2.out'
              })
            }
          } else {
            // Return to normal size
            nav.classList.remove('nav-compact')

            gsap.to(navContainer, {
              padding: '1rem 1.5rem',
              duration: 0.3,
              ease: 'power2.out'
            })

            if (navTitle) {
              gsap.to(navTitle, {
                fontSize: '1rem',
                duration: 0.3,
                ease: 'power2.out'
              })
            }

            if (navLogo) {
              gsap.to(navLogo, {
                width: '40px',
                height: '40px',
                duration: 0.3,
                ease: 'power2.out'
              })
            }
          }
        }

        lastScrollY = currentScrollY
      })
    }

    // Initialize micro-interactions
    initMicroInteractions()

    // Parallax effects for hero background elements
    const parallaxElements = document.querySelectorAll('[class*="animate-float"]')
    parallaxElements.forEach((element, index) => {
      gsap.to(element, {
        y: -20,
        duration: 3 + index * 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      })
    })

    // Page transition animations
    const pageTransition = () => {
      const tl = gsap.timeline()

      tl.from('main > *', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      })

      return tl
    }

    // Initialize page transition
    pageTransition()
  });
});
