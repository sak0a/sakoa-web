<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
      <!-- Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-950 via-gray-900 to-gray-950"></div>

      <!-- Animated Background Elements -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -1s;"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 container-custom">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Main Heading -->
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 animate-fade-in-up">
            <span class="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              saka's Dodgeball Server
            </span>
          </h1>

          <!-- Subtitle -->
          <p class="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.2s;">
            Support our Team Fortress 2 dodgeball server and help us keep the rockets flying with style and precision.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style="animation-delay: 0.4s;">
            <a href="#donate" class="btn btn-primary text-lg px-8 py-4 group">
              <span>Donate Now</span>
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
            <a href="https://discord.gg/JuxYYVEkzc" target="_blank" rel="noopener noreferrer" class="btn bg-[#5865F2] hover:bg-[#4752C4] text-white text-lg px-8 py-4 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="transition-transform group-hover:scale-110">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Join Discord</span>
            </a>
          </div>

          <!-- Stats Preview -->
          <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up" style="animation-delay: 0.6s;">
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Server Uptime</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Active Players</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">€2.5K</div>
              <div class="text-gray-400 text-sm uppercase tracking-wider">Donated This Year</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
        </svg>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section bg-gray-900">
      <div class="container-custom">
        <div class="max-w-4xl mx-auto">
          <!-- Section Header -->
          <div class="text-center mb-16 animate-on-scroll animate-fade-in">
            <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">About Our Server</h2>
            <div class="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto rounded-full"></div>
          </div>

          <!-- Description -->
          <div class="space-y-6 mb-12 animate-on-scroll animate-slide-up">
            <p class="text-lg leading-relaxed text-gray-300">
              saka's Dodgeball Server is a dedicated Team Fortress 2 server focused on providing the best dodgeball experience for players. Our server features custom maps, plugins, and configurations to enhance gameplay and create a fun, competitive environment.
            </p>
            <p class="text-lg leading-relaxed text-gray-300">
              We're committed to maintaining a friendly community and high-quality server performance. Your donations help us cover server costs, develop new features, and continue providing a great gaming experience.
            </p>
          </div>

          <!-- Features Grid -->
          <div class="card card-elevated animate-on-scroll animate-fade-in">
            <h3 class="text-2xl font-bold mb-8 text-white text-center">Server Features</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-right">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Custom Dodgeball Maps</h4>
                  <p class="text-gray-400 text-sm">Unique and challenging map rotations</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-left">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Optimized Performance</h4>
                  <p class="text-gray-400 text-sm">Low latency and smooth gameplay</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-right">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Active Moderation</h4>
                  <p class="text-gray-400 text-sm">Fair play and friendly environment</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-left">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Community Events</h4>
                  <p class="text-gray-400 text-sm">Tournaments and special competitions</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-right">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Custom Plugins</h4>
                  <p class="text-gray-400 text-sm">Enhanced features and gameplay mechanics</p>
                </div>
              </div>

              <div class="flex items-start space-x-4 animate-on-scroll animate-slide-in-left">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-semibold text-white mb-1">Friendly Community</h4>
                  <p class="text-gray-400 text-sm">Welcoming players of all skill levels</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Server Status Section -->
    <section id="server-status" class="section" style="background: linear-gradient(135deg, #23104D 0%, #734C96 50%, #9B6BC7 100%);">
      <div class="container-custom">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in text-white">Server Status</h2>
        <div class="max-w-6xl mx-auto animate-on-scroll animate-slide-up">
          <ServerStatus />
        </div>
      </div>
    </section>

    <!-- Leaderboard Section -->
    <section id="leaderboard" class="section" style="background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);">
      <div class="container-custom">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in" style="color: #734C96;">Seasonal Statistics</h2>
        <div class="max-w-6xl mx-auto animate-on-scroll animate-slide-up">
          <SeasonalLeaderboard />
        </div>
      </div>
    </section>

    <!-- Donation Section -->
    <section id="donate" class="section" style="background: linear-gradient(135deg, #1a1a1a 0%, #242424 100%);">
      <div class="container-custom">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in" style="color: #734C96;">Support Our Server</h2>
        <div class="max-w-5xl mx-auto">
          <div class="rounded-lg p-8 shadow-md border animate-on-scroll animate-slide-up" style="background-color: #242424; border-color: #333333;">
            <p class="text-lg mb-6" style="color: #d4d4d4;">
              Your donations help us maintain and improve the server. All contributions go directly toward server costs, development, and new features.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-on-scroll animate-fade-in">
              <PayPalButton v-if="donationSettings.paypalEnabled" />
              <RevolutButton v-if="donationSettings.revolutEnabled" />
              <a v-if="donationSettings.buyMeACoffeeEnabled" href="https://www.buymeacoffee.com/sakoa" target="_blank" rel="noopener noreferrer" class="inline-block transition-transform hover:scale-105">
                <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=sakoa&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff" alt="Buy Me A Coffee" class="h-12 w-auto" />
              </a>
            </div>

            <div class="bg-amber-900/30 border-l-4 border-amber-500 p-4 animate-on-scroll animate-slide-in-right">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-amber-400">Terms & Conditions</h3>
                  <div class="mt-2 text-sm text-amber-300">
                    <p class="mb-2">All contributions are final and non-refundable. Donations constitute voluntary support for server operations and are not commercial transactions that guarantee specific services or benefits.</p>
                    <p class="mb-2">Payment processing fees may vary between different payment processors (PayPal, Revolut, Buy Me a Coffee, etc.). Only the net amount received after processing fees will be counted toward donation tiers and benefits.</p>
                    <p class="mb-2">To receive community recognition and server privileges (Discord roles, in-game perks, etc.), contributors must provide their Discord username or alternative contact information during the donation process.</p>
                    <p>Contributors who wish to remain anonymous and exclude their information from public donor listings should specify this preference when making their contribution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Donation Tiers Section -->
    <section id="tiers" class="section" style="background: linear-gradient(135deg, #9B6BC7 0%, #734C96 50%, #23104D 100%);">
      <div class="container-custom">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in text-white">Donation Rewards</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto px-4 sm:px-0">
          <!-- Tier 1 -->
          <div class="card hover:border-primary hover:border-2 transition-all animate-on-scroll animate-slide-in-right flex flex-col">
            <div class="text-center mb-6">
              <span class="inline-block bg-primary text-white rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <h3 class="text-xl font-bold mt-4" style="color: #ffffff;">Thank You Tier</h3>
              <p class="mt-2" style="color: #d4d4d4;">Any amount</p>
            </div>
            <ul class="space-y-3 mb-6 flex-grow" style="color: #d4d4d4;">
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Recognition on donor list</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Our sincere gratitude</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Discord role</span>
              </li>
            </ul>
          </div>

          <!-- Tier 2 -->
          <div class="card hover:border-primary hover:border-2 transition-all transform scale-105 shadow-lg animate-on-scroll animate-slide-up flex flex-col">
            <div class="absolute -top-4 right-0 left-0 flex justify-center">
              <span class="bg-primary text-white text-sm font-bold py-1 px-4 rounded-full">POPULAR</span>
            </div>
            <div class="text-center mb-6">
              <span class="inline-block bg-primary text-white rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 class="text-xl font-bold mt-4" style="color: #ffffff;">Premium Tier</h3>
              <p class="mt-2" style="color: #d4d4d4;">€1,99/month</p>
            </div>
            <ul class="space-y-3 mb-6 flex-grow" style="color: #d4d4d4;">
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>All Thank You tier benefits</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Reserved slot on server</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom name color in-game</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom chat tag in-game</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom footprint colors in-game</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom killstreak amount</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Play as roboter</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>2x Vote weight</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Discord Role</span>
              </li>
            </ul>
          </div>

          <!-- Tier 3 -->
          <div class="card hover:border-primary hover:border-2 transition-all animate-on-scroll animate-slide-in-left flex flex-col relative">
            <!-- Coming Soon Overlay -->
            <div class="absolute inset-0 bg-black/70 backdrop-blur-lg rounded-lg flex items-center justify-center z-10">
              <div class="text-center px-4">
                <div class="px-3 py-2 sm:px-4 sm:py-2 rounded-full font-bold text-base sm:text-lg mb-2 text-white" style="background-color: #734C96;">
                  COMING SOON
                </div>
                <p class="text-white text-xs sm:text-sm">Server hosting will be available soon!</p>
              </div>
            </div>
            <!--
            <div class="text-center mb-6 opacity-30 select-none">
              <span class="inline-block bg-primary text-white rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              <h3 class="text-xl font-bold mt-4" style="color: #ffffff;">Server Tier</h3>
              <p class="mt-2" style="color: #d4d4d4;">from €4,99/month</p>
            </div>
            <ul class="space-y-3 mb-6 flex-grow opacity-30 select-none" style="color: #d4d4d4;">
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Own Private server</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>30GB NVME Storage</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>2 MySQL Databases included</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>AMD Ryzen 9900x CPU</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Server Location:
                  Frankfurt, DE</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>DDOS Protection</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>+1,49€ Dedicated IP (27015)</span>
              </li>
              <li class="flex items-start animate-on-scroll animate-fade-in-delay-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>CPU, RAM, Storage & Databases can be upgraded</span>
              </li>
            </ul>
            -->
          </div>
        </div>
      </div>
    </section>

    <!-- Donors Section -->
    <section id="donors" class="section" style="background: linear-gradient(135deg, #242424 0%, #2c2c2c 100%);">
      <div class="container-custom">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in" style="color: #734C96;">Our Generous Donors</h2>
        <div class="max-w-3xl mx-auto animate-on-scroll animate-slide-up">
          <DonorsList />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import ServerStatus from '~/components/ServerStatus.vue';
import DonorsList from '~/components/DonorsList.vue';
import SeasonalLeaderboard from '~/components/SeasonalLeaderboard.vue';

// Use donation settings
const { donationSettings, fetchDonationSettings } = useDonationSettings();

// Fetch donation settings on mount
onMounted(async () => {
  await fetchDonationSettings();
});
</script>
