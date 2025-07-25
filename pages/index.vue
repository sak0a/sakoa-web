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
            <a href="#donate" class="btn btn-primary btn-ripple text-lg px-8 py-4 group">
              <span>Donate Now</span>
              <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
            <a href="https://discord.gg/JuxYYVEkzc" target="_blank" rel="noopener noreferrer" class="btn btn-ripple bg-[#5865F2] hover:bg-[#4752C4] text-white text-lg px-8 py-4 group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="transition-transform group-hover:scale-110">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Join Discord</span>
            </a>
          </div>

          <!-- Stats Preview -->
          <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up" style="animation-delay: 0.6s;">
            <StatsCounter
              :value="heroStats.uptime"
              label="Server Uptime"
              :duration="2"
              :glow="true"
            />
            <StatsCounter
              :value="heroStats.activePlayers"
              label="Active Players"
              suffix="+"
              :duration="2"
              :glow="true"
            />
            <StatsCounter
              :value="heroStats.monthlyDonations"
              label="Donated This Month"
              format="currency"
              currency="€"
              :duration="3"
              :glow="true"
            />
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
    <section id="about" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-tr to-gray-950 via-gray-900 from-primary-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/4 -left-20 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -1s;"></div>
        <div class="absolute top-1/2 left-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
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
          <div class="glass-card p-8 animate-on-scroll animate-fade-in">
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
    <section id="server-status" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-950 via-gray-900 to-gray-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/3 -right-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -1.5s;"></div>
        <div class="absolute top-0 right-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 animate-on-scroll animate-fade-in">
            <span class="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Server Status
            </span>
          </h2>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto animate-on-scroll animate-fade-in" style="animation-delay: 0.2s;">
            Real-time monitoring of our TF2 dodgeball servers
          </p>
        </div>

        <div class="max-w-6xl mx-auto animate-on-scroll animate-slide-up" style="animation-delay: 0.4s;">
          <ServerStatus />
        </div>
      </div>
    </section>

    <!-- Leaderboard Section -->
    <section id="leaderboard" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-950 via-gray-900 to-gray-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -2.5s;"></div>
        <div class="absolute top-2/3 right-1/4 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in" style="color: #734C96;">Seasonal Statistics</h2>
        <div class="max-w-6xl mx-auto animate-on-scroll animate-slide-up">
          <SeasonalLeaderboard />
        </div>
      </div>
    </section>

    <!-- Donation Section -->
    <section id="donate" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-tl to-primary-950 via-gray-900 from-gray-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/2 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -1s;"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
        <!-- Section Header -->
        <div class="text-center mb-16 animate-on-scroll animate-fade-in">
          <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">Support Our Server</h2>
          <div class="w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto rounded-full"></div>
        </div>

        <div class="max-w-5xl mx-auto">
          <!-- Donation Progress -->
          <div class="glass-card p-8 mb-12 animate-on-scroll animate-scale-in">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-white mb-2">Monthly Goal Progress</h3>
              <p class="text-gray-400">Help us reach our monthly server costs</p>
            </div>
            <ProgressBar
              :current="heroStats.monthlyDonations"
              :target="heroStats.monthlyGoal"
              label="Monthly Server Costs"
              currency="€"
              :milestones="[
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' }
              ]"
            />
          </div>

          <!-- Donation Methods -->
          <div class="glass-card p-8 animate-on-scroll animate-slide-up">
            <div class="text-center mb-8">
              <h3 class="text-2xl font-bold text-white mb-4">Choose Your Payment Method</h3>
              <p class="text-lg text-gray-300 leading-relaxed">
                Your donations help us maintain and improve the server. All contributions go directly toward server costs, development, and new features.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-on-scroll animate-fade-in">
              <PayPalButton v-if="donationSettings.paypalEnabled" />
              <RevolutButton v-if="donationSettings.revolutEnabled" />
              <a v-if="donationSettings.buyMeACoffeeEnabled" href="https://www.buymeacoffee.com/sakoa" target="_blank" rel="noopener noreferrer" class="inline-block transition-transform hover:scale-105">
                <img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=sakoa&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff" alt="Buy Me A Coffee" class="h-12 w-auto rounded-lg" />
              </a>
            </div>

            <!-- Terms & Conditions -->
            <div class="glass-card border border-amber-500/20 p-6 animate-on-scroll animate-slide-in-right" style="background: rgba(245, 158, 11, 0.05);">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-amber-400">Terms & Conditions</h3>
                    <button
                      @click="termsExpanded = !termsExpanded"
                      class="text-xs text-amber-300 hover:text-amber-200 transition-colors flex items-center space-x-1"
                    >
                      <span>{{ termsExpanded ? 'Show Less' : 'Read More' }}</span>
                      <svg
                        class="w-3 h-3 transition-transform duration-200"
                        :class="{ 'rotate-180': termsExpanded }"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <!-- Preview Text (always visible) -->
                  <div class="text-xs text-amber-200/70 leading-snug">
                    <p>All contributions are final and non-refundable. Donations constitute voluntary support for server operations.</p>
                  </div>

                  <!-- Expandable Full Text -->
                  <Transition name="expand">
                    <div v-if="termsExpanded" class="mt-3 space-y-2 text-xs text-amber-200/70 leading-snug">
                      <p>Payment processing fees may vary between different payment processors (PayPal, Revolut, Buy Me a Coffee, etc.). Only the net amount received after processing fees will be counted toward donation tiers and benefits.</p>
                      <p>To receive community recognition and server privileges (Discord roles, in-game perks, etc.), contributors must provide their Discord username or alternative contact information during the donation process.</p>
                      <p>Contributors who wish to remain anonymous and exclude their information from public donor listings should specify this preference when making their contribution.</p>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Donation Tiers Section -->
    <section id="tiers" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-tr from-primary-950 via-gray-900 to-gray-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-0 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute top-1/3 -right-32 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -1.5s;"></div>
        <div class="absolute bottom-1/4 right-1/3 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
        <!-- Section Header -->
        <div class="text-center mb-12 md:mb-16 animate-on-scroll animate-fade-in px-4">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 text-white">Donation Rewards</h2>
          <div class="w-16 md:w-24 h-1 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto rounded-full"></div>
          <p class="text-lg md:text-xl text-gray-300 mt-4 md:mt-6 max-w-2xl mx-auto leading-relaxed">
            Support our server and unlock exclusive perks that enhance your gaming experience
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-4">
          <!-- Tier 1 - Thank You -->
          <div class="reward-card reward-card-basic interactive-card animate-on-scroll animate-slide-in-right">
            <div class="reward-card-header">
              <div class="reward-icon reward-icon-basic">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 class="reward-title">Thank You Tier</h3>
              <div class="reward-price">
                <span class="text-2xl font-bold text-white">Any</span>
                <span class="text-gray-400 text-sm">amount</span>
              </div>
            </div>

            <div class="reward-features">
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Recognition on donor list</span>
              </div>
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Our sincere gratitude</span>
              </div>
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Discord supporter role</span>
              </div>
            </div>

            <div class="reward-cta">
              <a href="#donate" class="btn btn-outline w-full">Get Started</a>
            </div>
          </div>

          <!-- Tier 2 - Premium (Popular) -->
          <div class="reward-card reward-card-premium interactive-card animate-on-scroll animate-slide-up">
            <div class="popular-badge">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              MOST POPULAR
            </div>
            <div class="reward-card-header">
              <div class="reward-icon reward-icon-premium">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 class="reward-title">Premium Tier</h3>
              <div class="reward-price">
                <span class="text-3xl font-bold text-white">€1.99</span>
                <span class="text-gray-400 text-sm">/month</span>
              </div>
              <div class="reward-savings">
                <span class="text-primary-300 text-sm font-medium">Best Value!</span>
              </div>
            </div>
            <div class="reward-features">
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>All Thank You tier benefits</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Reserved slot on server</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom name color in-game</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom chat tag in-game</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Play as robot character</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>2x Vote weight</span>
              </div>
              <div class="reward-feature reward-feature-premium">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Premium Discord role</span>
              </div>
            </div>

            <div class="reward-cta">
              <a href="#donate" class="btn btn-primary w-full">Choose Premium</a>
            </div>
          </div>

          <!-- Tier 3 - Coming Soon -->
          <div class="reward-card reward-card-coming-soon interactive-card animate-on-scroll animate-slide-in-left">
            <!-- Coming Soon Overlay -->
            <div class="coming-soon-overlay">
              <div class="coming-soon-content">
                <div class="coming-soon-badge">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  FUTURE PLANS
                </div>
                <h3 class="coming-soon-title">Server Hosting</h3>
                <p class="coming-soon-description">Potential expansion into dedicated server hosting services for the community.</p>
                <div class="coming-soon-notify">
                  <button class="btn btn-outline btn-sm">
                    Stay Updated
                  </button>
                </div>
              </div>
            </div>
            <!-- Background Content (Blurred) -->
            <div class="reward-card-header opacity-10">
              <div class="reward-icon reward-icon-server">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 class="reward-title">Server Hosting</h3>
              <div class="reward-price">
                <span class="text-3xl font-bold text-white">€4.99</span>
                <span class="text-gray-400 text-sm">/month</span>
              </div>
            </div>

            <div class="reward-features opacity-30">
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Own private server</span>
              </div>
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>30GB NVMe storage</span>
              </div>
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>AMD Ryzen 9900x CPU</span>
              </div>
              <div class="reward-feature">
                <svg class="reward-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>DDoS protection included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Donors Section -->
    <section id="donors" class="section relative overflow-hidden">
      <!-- Background Gradient (same as hero) -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-950 via-gray-900 to-gray-950"></div>

      <!-- Animated Background Elements (same as hero but different positions) -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-float"></div>
        <div class="absolute bottom-1/3 -right-32 w-80 h-80 bg-primary-500/15 rounded-full blur-3xl animate-float" style="animation-delay: -2s;"></div>
        <div class="absolute top-2/3 left-0 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div class="container-custom relative z-10">
        <h2 class="text-3xl font-bold mb-8 text-center animate-on-scroll animate-fade-in" style="color: #734C96;">Our Generous Donors</h2>
        <div class="max-w-5xl mx-auto animate-on-scroll animate-slide-up">
          <DonorsList />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Component imports
import ServerStatus from '~/components/ServerStatus.vue';
import DonorsList from '~/components/DonorsList.vue';
import SeasonalLeaderboard from '~/components/SeasonalLeaderboard.vue';
import StatsCounter from '~/components/StatsCounter.vue';
import ProgressBar from '~/components/ProgressBar.vue';

// SEO and meta tags
useHead({
  title: 'saka\'s Dodgeball Server - TF2 Community',
  meta: [
    { name: 'description', content: 'Join saka\'s Team Fortress 2 dodgeball server for fast-paced rocket dodging action. Support our community and enjoy premium features.' },
    { name: 'keywords', content: 'TF2, Team Fortress 2, dodgeball, server, gaming, community, rockets' },
    { property: 'og:title', content: 'saka\'s Dodgeball Server - TF2 Community' },
    { property: 'og:description', content: 'Join our TF2 dodgeball server for fast-paced rocket dodging action.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
});

// Hero statistics
const { heroStats, fetchHeroStats, startAutoRefresh, stopAutoRefresh } = useHeroStats();

// Use donation settings
const { donationSettings, fetchDonationSettings } = useDonationSettings();

// Terms & Conditions expansion state
const termsExpanded = ref(false);

// Load hero statistics and donation settings on mount
onMounted(async () => {
  await fetchHeroStats();
  await fetchDonationSettings();

  // Start auto-refresh if enabled
  if (heroStats.value.autoUpdateDonations || heroStats.value.autoUpdatePlayers) {
    startAutoRefresh(5); // Refresh every 5 minutes
  }
});

// Cleanup on unmount
onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
/* Terms & Conditions Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  max-height: 200px;
  opacity: 1;
  transform: translateY(0);
}
</style>


