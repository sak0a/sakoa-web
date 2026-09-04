<template>
  <div class="home-page arena-page">
    <section id="top" class="hero" aria-labelledby="hero-title">
      <div class="hero-grid arena-frame">
        <div class="hero-copy">
          <p class="eyebrow"><span>TF2</span> Frankfurt / community server</p>
          <h1 id="hero-title">Read the rocket.<br><em>Own the air.</em></h1>
          <p class="hero-intro">
            Fast rounds, sharp redirects, and a leaderboard that remembers every hit.
            This is saka's dodgeball server.
          </p>
          <div class="hero-actions">
            <a href="#server-status" class="arena-button arena-button--primary">Find a live server <span aria-hidden="true">↘</span></a>
            <a href="#leaderboard" class="text-link">View season rankings <span aria-hidden="true">→</span></a>
          </div>
          <dl class="hero-facts" aria-label="Community facts">
            <div><dt>Availability</dt><dd>{{ heroStatsError ? '—' : heroStats.uptime }}</dd></div>
            <div><dt>Players tracked</dt><dd>{{ heroStatsError ? '—' : heroStats.activePlayers.toLocaleString('en-GB') }}</dd></div>
            <div><dt>Monthly support</dt><dd>{{ heroStatsError ? '—' : `€${heroStats.monthlyDonations}` }}</dd></div>
          </dl>
        </div>

        <aside id="server-status" class="hero-status" aria-labelledby="live-heading">
          <div class="panel-heading">
            <div>
              <p class="section-index">01 / Live feed</p>
              <h2 id="live-heading">Server status</h2>
            </div>
            <span class="signal-label">Auto-refreshing</span>
          </div>
          <ServerStatus />
        </aside>
      </div>
      <div class="hero-rule" aria-hidden="true"><span>airblast / anticipate / redirect</span></div>
    </section>

    <section id="about" class="manifesto arena-frame" aria-labelledby="manifesto-title">
      <p class="section-index">The format</p>
      <div class="manifesto-grid">
        <h2 id="manifesto-title">One rocket.<br>Two teams.<br>No excuses.</h2>
        <div class="manifesto-copy">
          <p>
            TF2 dodgeball strips the game down to timing and nerve. Airblast an incoming
            rocket, send it back faster, and stay alive as the arena closes around you.
          </p>
          <ol class="principles">
            <li><span>01</span><strong>Learn the line</strong><p>Track speed, angle, and the player across from you.</p></li>
            <li><span>02</span><strong>Hold your nerve</strong><p>Late reflects win exchanges. Panic gives them away.</p></li>
            <li><span>03</span><strong>Climb the board</strong><p>Every session feeds the seasonal rankings below.</p></li>
          </ol>
          <a :href="discordUrl" target="_blank" rel="noopener noreferrer" class="text-link">Meet the community on Discord <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>

    <section id="leaderboard" class="leaderboard-section" aria-labelledby="leaderboard-heading">
      <div class="arena-frame">
        <div class="section-heading">
          <div>
            <p class="section-index">02 / Competition</p>
            <h2 id="leaderboard-heading">Season rankings</h2>
          </div>
          <p>Search every tracked player, change the metric, and inspect the run behind each rank.</p>
        </div>
        <SeasonalLeaderboard />
      </div>
    </section>

    <section id="donate" class="support-section" aria-labelledby="support-heading">
      <div class="arena-frame support-grid">
        <div class="support-story">
          <p class="section-index">03 / Keep it running</p>
          <h2 id="support-heading">The server is funded by the people playing it.</h2>
          <p>
            Contributions cover hosting and ongoing development. The target resets monthly;
            every amount moves the same shared server forward.
          </p>
          <ProgressBar
            :current="heroStatsError ? 0 : heroStats.monthlyDonations"
            :target="heroStats.monthlyGoal"
            label="Monthly server costs"
            currency="€"
            :milestones="[
              { value: 25, label: '25%' },
              { value: 50, label: '50%' },
              { value: 75, label: '75%' }
            ]"
          />
        </div>

        <div class="payment-panel">
          <p class="payment-title">Choose a payment route</p>
          <div class="payment-list">
            <PayPalButton v-if="donationSettings.paypalEnabled" />
            <RevolutButton v-if="donationSettings.revolutEnabled" />
            <a
              v-if="donationSettings.buyMeACoffeeEnabled"
              href="https://www.buymeacoffee.com/sakoa"
              target="_blank"
              rel="noopener noreferrer"
              class="provider-button provider-button--coffee"
            >
              <span>Buy me a coffee</span><span aria-hidden="true">↗</span>
            </a>
          </div>
          <details class="terms">
            <summary>Contribution terms</summary>
            <div>
              <p>Contributions are voluntary, final, and non-refundable. Payment fees are deducted before tier benefits are calculated.</p>
              <p>Include a Discord username or another contact method if you want server privileges. Ask to remain anonymous if you do not want to appear on the donor list.</p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <section id="tiers" class="rewards-section" aria-labelledby="rewards-heading">
      <div class="arena-frame">
        <div class="section-heading section-heading--compact">
          <div>
            <p class="section-index">04 / Recognition</p>
            <h2 id="rewards-heading">Support rewards</h2>
          </div>
          <p>Useful perks for regulars, without changing the skill ceiling.</p>
        </div>

        <div class="reward-grid">
          <article class="reward-tier reward-tier--base">
            <div class="tier-number">A</div>
            <div>
              <p class="tier-kicker">Any contribution</p>
              <h3>Supporter</h3>
              <p>Public recognition, a supporter Discord role, and our thanks.</p>
            </div>
            <a href="#donate" class="text-link">Contribute <span aria-hidden="true">→</span></a>
          </article>

          <article class="reward-tier reward-tier--premium">
            <div class="tier-number">B</div>
            <div>
              <p class="tier-kicker">€1.99 / month</p>
              <h3>Premium player</h3>
              <ul>
                <li>Reserved server slot</li>
                <li>Custom in-game name color and chat tag</li>
                <li>Robot character model</li>
                <li>Double vote weight</li>
                <li>Premium Discord role</li>
              </ul>
            </div>
            <a href="#donate" class="arena-button arena-button--primary">Choose premium <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </div>
    </section>

    <section id="donors" class="donors-section" aria-labelledby="donors-heading">
      <div class="arena-frame">
        <div class="section-heading section-heading--compact">
          <div>
            <p class="section-index">05 / Backed by players</p>
            <h2 id="donors-heading">The donor wall</h2>
          </div>
          <p>Players who chose to keep the server in motion—and opted to be listed.</p>
        </div>
        <DonorsList />
      </div>
    </section>
  </div>
</template>

<script setup>
import DonorsList from '~/components/DonorsList.vue'
import PayPalButton from '~/components/PayPalButton.vue'
import ProgressBar from '~/components/ProgressBar.vue'
import RevolutButton from '~/components/RevolutButton.vue'
import SeasonalLeaderboard from '~/components/SeasonalLeaderboard.vue'
import ServerStatus from '~/components/ServerStatus.vue'

useHead({
  title: 'TF2 Dodgeball Community',
  meta: [
    { name: 'description', content: 'Play on saka\'s Team Fortress 2 dodgeball server, follow live server status and seasonal rankings, and support the community.' },
    { property: 'og:title', content: 'saka\'s Dodgeball Server' },
    { property: 'og:description', content: 'Live TF2 dodgeball status, player rankings, and community support.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
})

const { heroStats, error: heroStatsError, fetchHeroStats, startAutoRefresh, stopAutoRefresh } = useHeroStats()
const { donationSettings, fetchDonationSettings } = useDonationSettings()
const { settings, getSettings } = useSettings()

await Promise.all([fetchHeroStats(), fetchDonationSettings(), getSettings()])

const discordUrl = computed(() => settings.value?.discord?.inviteUrl || 'https://discord.gg/JuxYYVEkzc')

onMounted(() => {
  if (heroStats.value.autoUpdateDonations || heroStats.value.autoUpdatePlayers) startAutoRefresh(5)
})
onUnmounted(stopAutoRefresh)
</script>

<style scoped>
.home-page { overflow: clip; }
.arena-frame { width: min(100% - 2rem, 86rem); margin-inline: auto; }
.hero { position: relative; min-height: 100dvh; padding: 8.5rem 0 4rem; isolation: isolate; }
.hero::after { content: ''; position: absolute; z-index: -1; width: min(44vw, 42rem); aspect-ratio: 1; right: -8%; top: 8%; border: 1px solid rgba(142, 111, 200, .2); border-radius: 50%; box-shadow: 0 0 0 5rem rgba(142, 111, 200, .025), 0 0 0 10rem rgba(142, 111, 200, .018); }
.hero-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(26rem, .9fr); gap: clamp(3rem, 7vw, 8rem); align-items: center; }
.hero-copy { padding: clamp(1rem, 5vw, 4rem) 0; }
.eyebrow, .section-index, .tier-kicker, .signal-label { color: var(--arena-muted); font: 650 .68rem/1.3 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; }
.eyebrow span { display: inline-block; margin-right: .8rem; padding: .3rem .45rem; background: var(--arena-violet); color: white; letter-spacing: .06em; }
.hero h1 { max-width: 12ch; margin: 1.5rem 0 1.75rem; font-family: var(--font-display); font-size: clamp(3.65rem, 7.5vw, 8.2rem); font-weight: 760; line-height: .84; letter-spacing: -.065em; text-wrap: balance; }
.hero h1 em { color: var(--arena-violet-soft); font-style: normal; }
.hero-intro { max-width: 37rem; margin: 0; color: var(--arena-text-soft); font-size: clamp(1.02rem, 1.5vw, 1.3rem); line-height: 1.65; text-wrap: pretty; }
.hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1.4rem; margin-top: 2.25rem; }
.arena-button { display: inline-flex; align-items: center; justify-content: space-between; min-width: 12rem; gap: 1.5rem; padding: .9rem 1rem; border: 1px solid var(--arena-line-strong); color: var(--arena-text); font-size: .83rem; font-weight: 700; text-decoration: none; transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease; }
.arena-button--primary { background: var(--arena-violet); border-color: var(--arena-violet); }
.arena-button:hover { transform: translateY(-2px); border-color: var(--arena-violet-soft); }
.arena-button--primary:hover { background: #7658aa; }
.arena-button:active { transform: translateY(1px); }
.text-link { display: inline-flex; gap: .55rem; align-items: center; color: var(--arena-text-soft); font-weight: 650; font-size: .85rem; text-decoration: none; border-bottom: 1px solid var(--arena-line-strong); padding-bottom: .3rem; }
.text-link:hover { color: white; border-color: var(--arena-violet-soft); }
.hero-facts { display: grid; grid-template-columns: repeat(3, auto); justify-content: start; gap: clamp(1.25rem, 4vw, 3.5rem); margin: 4rem 0 0; }
.hero-facts dt { color: var(--arena-muted); font: 600 .64rem/1.4 var(--font-mono); text-transform: uppercase; letter-spacing: .08em; }
.hero-facts dd { margin: .35rem 0 0; color: var(--arena-text); font: 650 clamp(1rem, 2vw, 1.35rem)/1 var(--font-mono); font-variant-numeric: tabular-nums; }
.hero-status { align-self: center; padding: 1.1rem; background: #111016; border: 1px solid var(--arena-line-strong); box-shadow: 1.5rem 1.5rem 0 rgba(142, 111, 200, .07); }
.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; padding: .35rem .3rem 1rem; border-bottom: 1px solid var(--arena-line); }
.panel-heading h2 { margin: .35rem 0 0; font-family: var(--font-display); font-size: 1.35rem; }
.signal-label { color: var(--arena-violet-soft); }
.hero-rule { width: min(100% - 2rem, 86rem); margin: 3rem auto 0; padding-top: 1rem; border-top: 1px solid var(--arena-line); color: var(--arena-dim); font: 600 .62rem/1 var(--font-mono); letter-spacing: .18em; text-align: right; text-transform: uppercase; }
.manifesto, .leaderboard-section, .support-section, .rewards-section, .donors-section { scroll-margin-top: 5rem; }
.manifesto { padding: clamp(6rem, 11vw, 11rem) 0; }
.manifesto-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: clamp(3rem, 9vw, 10rem); margin-top: 1rem; }
.manifesto h2, .section-heading h2, .support-story h2 { font-family: var(--font-display); letter-spacing: -.05em; }
.manifesto h2 { margin: 0; font-size: clamp(3rem, 6vw, 6.7rem); line-height: .92; }
.manifesto-copy > p { max-width: 40rem; margin: 0; font-size: clamp(1.05rem, 1.5vw, 1.28rem); line-height: 1.75; color: var(--arena-text-soft); }
.principles { list-style: none; padding: 0; margin: 3rem 0; border-top: 1px solid var(--arena-line); }
.principles li { display: grid; grid-template-columns: 2.5rem 10rem 1fr; gap: 1rem; padding: 1.15rem 0; border-bottom: 1px solid var(--arena-line); align-items: baseline; }
.principles span { color: var(--arena-violet-soft); font: 600 .7rem var(--font-mono); }
.principles strong { font-size: .9rem; }
.principles p { margin: 0; color: var(--arena-muted); font-size: .86rem; }
.leaderboard-section, .donors-section { padding: clamp(5rem, 9vw, 9rem) 0; background: var(--arena-panel); border-block: 1px solid var(--arena-line); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 3rem; margin-bottom: 2.25rem; }
.section-heading h2 { margin: .55rem 0 0; font-size: clamp(2.5rem, 5vw, 5rem); line-height: .95; }
.section-heading > p { max-width: 31rem; margin: 0; color: var(--arena-muted); font-size: .96rem; line-height: 1.6; }
.support-section { padding: clamp(6rem, 10vw, 10rem) 0; }
.support-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(20rem, .8fr); gap: clamp(3rem, 8vw, 8rem); align-items: start; }
.support-story h2 { max-width: 13ch; margin: .8rem 0 1.5rem; font-size: clamp(2.8rem, 5.5vw, 5.8rem); line-height: .94; }
.support-story > p:not(.section-index) { max-width: 40rem; color: var(--arena-muted); font-size: 1rem; line-height: 1.75; }
.support-story :deep(.progress-bar-container) { margin-top: 3.5rem; }
.payment-panel { padding: 1.5rem; background: var(--arena-panel); border-top: 2px solid var(--arena-violet); }
.payment-title { margin: 0 0 1rem; color: var(--arena-text); font-size: .8rem; font-weight: 700; }
.payment-list { display: grid; gap: .65rem; }
.provider-button { display: flex; justify-content: space-between; padding: .95rem 1rem; color: #171419; background: #e8c86a; font-size: .84rem; font-weight: 750; text-decoration: none; transition: transform 180ms ease, filter 180ms ease; }
.provider-button:hover { transform: translateX(3px); filter: brightness(1.04); }
.terms { margin-top: 1.5rem; border-top: 1px solid var(--arena-line); color: var(--arena-muted); }
.terms summary { padding: 1rem 0 .4rem; color: var(--arena-text-soft); font-size: .78rem; font-weight: 650; cursor: pointer; }
.terms p { font-size: .75rem; line-height: 1.65; }
.rewards-section { padding: clamp(5rem, 9vw, 9rem) 0; }
.section-heading--compact { margin-bottom: 3.5rem; }
.reward-grid { display: grid; grid-template-columns: .78fr 1.22fr; gap: 1px; background: var(--arena-line-strong); border: 1px solid var(--arena-line-strong); }
.reward-tier { min-height: 26rem; padding: clamp(1.5rem, 4vw, 3.5rem); display: grid; grid-template-rows: auto 1fr auto; gap: 2.5rem; background: var(--arena-ink); }
.reward-tier--premium { background: #17141d; }
.tier-number { color: var(--arena-dim); font: 500 4rem/.8 var(--font-display); }
.tier-kicker { color: var(--arena-violet-soft); }
.reward-tier h3 { margin: .55rem 0 1.1rem; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.8rem); letter-spacing: -.045em; }
.reward-tier p:not(.tier-kicker) { max-width: 28rem; color: var(--arena-muted); font-size: .92rem; }
.reward-tier ul { columns: 2; column-gap: 2rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
.reward-tier li { break-inside: avoid; padding: .65rem 0; color: var(--arena-text-soft); border-bottom: 1px solid var(--arena-line); font-size: .82rem; }
.reward-tier .arena-button { justify-self: start; }
.donors-section { border-bottom: 0; }

@media (max-width: 960px) {
  .hero-grid, .manifesto-grid, .support-grid { grid-template-columns: 1fr; }
  .hero { padding-top: 7rem; }
  .hero-copy { padding-bottom: 0; }
  .hero-status { width: min(100%, 42rem); }
  .manifesto-grid { gap: 2.5rem; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 1rem; }
}

@media (max-width: 680px) {
  .hero { padding-bottom: 2.5rem; }
  .hero h1 { font-size: clamp(3.3rem, 17vw, 5.2rem); }
  .hero-facts { grid-template-columns: 1fr 1fr; }
  .hero-facts div:last-child { grid-column: 1 / -1; }
  .panel-heading { align-items: flex-start; flex-direction: column; }
  .principles li { grid-template-columns: 2rem 1fr; }
  .principles p { grid-column: 2; }
  .reward-grid { grid-template-columns: 1fr; }
  .reward-tier { min-height: auto; }
  .reward-tier ul { columns: 1; }
}
</style>
