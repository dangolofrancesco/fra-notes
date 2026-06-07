---
title: "What Building a Pairs Trading Engine Taught Me About Quantitative Finance"
description: "I came from Computer Science. I knew nothing about statistical arbitrage. Here's what happened when I decided to build one anyway — the theory I had to learn, the bugs that cost me weeks, and what I'd do differently."
date: 2026-06-01
tags: [StatArb, KalmanFilter, Learning, QuantitativeFinance]
readingTime: 12
playlist: "Quant"
playlistSlug: "quant"
image: "/public/images/blog/quant/alpha_KF_2.png"
---

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    When I arrived in Chicago for my Master's, I had a solid background in computer science and data science. Algorithms, systems, ML pipelines; that world felt familiar. But here I kept running into people working in quantitative finance, and something about it pulled at me. It wasn't just the prestige. It was the problems: mathematically rigorous, deeply empirical, and with real stakes attached.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    I decided the best way to understand this world was to build something in it. Not a tutorial project, something I'd have to fight to understand. That's how AlphaStream-KF started.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Where it began: finding the right starting point
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    I started where most people start: searching online for resources. I found plenty of pairs trading tutorials. Most of them were thin. A rolling correlation here, a z-score there, a pretty equity curve at the end. None of them felt honest about what they were actually doing or why.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The turning point was a conversation with an Italian quant who had published a similar project. He pointed me toward the right questions: not "how do I implement this" but "why does this work, and when does it break?" That reframing changed everything about my approach to the problem.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    My method became: read the theory first, write notes, understand the math, <em>then</em> write the code. I was reading chapters on time series econometrics, stationarity tests, cointegration theory. I had a notebook full of derivations before I opened a Python file. It took longer. It was worth it.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The foundation: what stationarity actually means
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Before you can understand pairs trading, you need to understand why most price series are <em>not</em> stationary, and why that matters.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    A stock price follows something close to a random walk. Each day's price is yesterday's price plus a random shock. Mathematically:
  </p>

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto my-8 text-center text-xl font-serif overflow-x-auto">

$$P_t = P_{t-1} + \varepsilon_t, \quad \varepsilon_t \sim \mathcal{N}(0, \sigma^2)$$

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    This is an I(1) process — integrated of order one. Its mean and variance are not constant over time; they drift. You can't use the standard regression toolkit on it without consequences. Regress one random walk on another and you'll find spurious correlations everywhere. Nothing is actually happening.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">

  Cointegration is the escape hatch. Two I(1) series $Y_t$ and $X_t$ are cointegrated if there exists a linear combination:
  </div>

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto my-8 text-center text-xl font-serif overflow-x-auto">

$$S_t = Y_t - \beta X_t$$

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  that is stationary — I(0). The spread $S_t$ has a stable mean and variance. It mean-reverts. That's the thing you can trade.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The Engle-Granger two-step procedure tests this: regress $Y$ on $X$ via OLS, take the residuals, and apply an Augmented Dickey-Fuller test to check for stationarity. A p-value below 0.05 is evidence that the spread is mean-reverting and the pair might be worth trading.
  </div>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    My first serious mistake: the wrong asset universe
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    My first implementation had a problem that had nothing to do with code. I had selected assets somewhat casually — different sectors, different geographies, different business models. The ADF tests came back largely insignificant. Almost nothing was cointegrated.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    I had made the classic mistake of confusing correlation with cointegration. Two assets can move together for months and have zero long-run equilibrium relationship. The moment you need them to mean-revert, they don't.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The fix was to impose economic logic <em>before</em> running any statistics. If two companies don't share a common fundamental driver — same supply chain, same commodity exposure, same regulatory environment — there's no reason to expect their prices to form a stable equilibrium. I restructured the universe around same-sector peers: payment processors together, semiconductor manufacturers together, energy supermajors together.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The ADF hit rate improved significantly. More importantly, the pairs that passed the test now had a <em>reason</em> to pass it.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The look-ahead bias problem
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    This one cost me real time.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    My early backtest results looked implausibly good. The equity curve climbed almost monotonically. I was suspicious, and I was right to be. The issue was look-ahead bias — my backtester was using information from the future when making decisions in the past.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The specific bug: I was fitting the OLS hedge ratio on the entire dataset, including the test period, before using it to generate signals. The model had already "seen" where prices were going. When I re-ran signals using only the training-period estimate, the equity curve looked much more realistic — and much less exciting.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The fix required splitting the data cleanly:
  </p>

  <ul class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-disc">
    <li class="mb-3"><strong>Training period (2011–2016):</strong> fit the OLS prior, run cointegration tests, select pairs, estimate initial parameters</li>
    <li class="mb-3"><strong>Test period (2017–2018):</strong> run the Kalman Filter in streaming mode, one observation at a time, with no access to future data</li>
  </ul>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The general principle: every decision at time $t$ can only use information available at $t-1$ or earlier. In practice this meant delaying all signals by one day before execution. It's a small thing to implement and a large thing to get wrong.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The Kalman Filter: why static betas break
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Once I had a clean cointegration pipeline, I hit the next conceptual wall: the hedge ratio.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The OLS estimate gives you a single $\beta$ fitted on historical data. The assumption is that this relationship is stable over time. For pairs of companies, it isn't. Business conditions change. Earnings cycles diverge. The sensitivity of one asset to another drifts.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    
  A static $\beta$ slowly becomes wrong, and the spread you're trading becomes increasingly meaningless. You need to update the estimate continuously as new data arrives.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The Kalman Filter is the right tool for this. It models the state of the system — here, the pair $[\beta_t, \alpha_t]$ — as a latent variable that evolves over time, and updates it recursively with each new observation:
  </p>

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto my-8 font-serif overflow-x-auto">

$$\theta_{t|t-1} = \theta_{t-1}, \quad P_{t|t-1} = P_{t-1} + Q$$

$$e_t = y_t - H_t \theta_{t|t-1}$$

$$S_t = H_t P_{t|t-1} H_t^\top + R$$

$$K_t = \frac{P_{t|t-1} H_t^\top}{S_t}$$

$$\theta_t = \theta_{t|t-1} + K_t e_t$$

$$P_t = (I - K_t H_t) P_{t|t-1}$$

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  Where $H_t = [x_t, 1]$ is the observation matrix, $Q$ is the process noise (how fast $\beta$ can change), and $R$ is the observation noise (variance of the price measurement).
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Finding good documentation on applying the Kalman Filter specifically to financial time series was harder than I expected. Most resources are written for aerospace or control systems applications. I had to synthesize from multiple sources — papers, textbooks, GitHub repositories — before I felt like I genuinely understood what was happening at each step, rather than just copying equations.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The subtlest bug: pre-update vs. post-update innovations
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    This is the mistake I see most often in pairs trading implementations online, and the one I'm most glad I caught.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The trading signal is derived from the innovation — the prediction error of the Kalman Filter. But <em>which</em> innovation?
  </p>

  <ol class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-decimal">
  <li class="mb-4"><strong>Pre-update innovation:</strong> 
  
  $e_t = y_t - H_t \theta_{t|t-1}$ — the error <em>before</em> the filter absorbs the new observation
  </li>
  <li class="mb-4"><strong>Post-update residual:</strong> 
  
  $r_t = y_t - H_t \theta_t$ — the error <em>after</em> the state has been updated</li>
  </ol>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    
  The correct one is the pre-update innovation. Here's why: the post-update residual is computed after the filter has already moved $\beta_t$ to partially explain $y_t$. The state update algebraically reduces the residual. It's a form of look-ahead — the model has already processed the "surprise" you're trying to trade on.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The pre-update innovation $e_t$ represents the genuine market anomaly: how much today's price deviated from what the model expected, given <em>yesterday's</em> state estimate. That's the signal. Using post-update residuals as the trading signal quietly inflates your backtest results. The filter appears to predict better than it actually does.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The z-score used for signal generation is:
  </p>

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto my-8 text-center text-xl font-serif overflow-x-auto">

$$z_t = \frac{e_t}{\sqrt{S_t}}$$

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    
  Where $S_t$ is the innovation variance produced by the filter — the filter's own dynamic measure of uncertainty. This replaces the rolling-window standard deviation used in naive implementations, which breaks during volatility regime shifts because the denominator responds too slowly to changing market conditions.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Half-life: the filter that almost broke everything
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Another problem I spent too long debugging: pairs with very long half-lives.
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The half-life of mean reversion is estimated by regressing the spread change $\Delta S_t$ on the lagged spread $S_{t-1}$:
  </p>

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto my-8 text-center text-xl font-serif overflow-x-auto">

$$\Delta S_t = \lambda \cdot S_{t-1} + \mu + \varepsilon_t$$

</div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  The half-life is $-\ln(2)/\lambda$. For a pair to be tradeable at daily frequency, this needs to be in a reasonable range — I used 5 to 30 days. If the half-life is 180 days, the spread might be technically stationary but practically useless: you'd hold a position for months before it reverts, paying transaction costs the whole time.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    My initial asset universe was producing half-lives in the 60–120 day range for most pairs. The backtest results were flat because the strategy was perpetually waiting for reversions that took too long to materialize, bleeding fees in the meantime. Tightening the half-life filter to 5–30 days cut the number of tradeable pairs significantly, but the ones that remained were actually meaningful to trade.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Building the portfolio: from pairs to a system
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    My first working implementation treated each pair independently. Run cointegration, fit the filter, generate signals, backtest each pair in isolation. This is a natural starting point, but it's not how you'd actually run a strategy.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The problem: if you select multiple pairs that contain the same underlying asset, you've inadvertently taken a concentrated bet. If AAPL appears in three different pairs and AAPL crashes, all three positions move against you simultaneously. Your "diversified" strategy turns out to be a concentrated AAPL short.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The fix is a disjoint portfolio constraint: a greedy algorithm selects the top pairs while enforcing that no single ticker appears in more than one pair. This adds a meaningful risk management layer that doesn't show up in per-pair backtest results but matters enormously in practice.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    With a $100K initial capital split equally across five disjoint pairs, the combined portfolio showed something important: losses on individual pairs were partially offset by gains on others. The correlation between pair returns was low — which is exactly the property you want in a market-neutral strategy.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    What I'd do differently
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Three things I know now that I didn't at the start:
  </p>

  <div class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
  
  <strong>Calibrate Q and R properly.</strong> I spent too long tuning the Kalman Filter hyperparameters by intuition. The principled approach is to use the in-sample OLS residual variance to set $R$, and scale $Q$ as a fraction of $R$. This gives you a principled starting point and a meaningful interpretation: you're saying "the hedge ratio changes at roughly X% of the observation noise per day."
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    <strong>Model short-selling costs.</strong> The backtest ignores borrowing fees on the short leg. For large-cap liquid names this is small, but it's not zero, and for harder-to-borrow stocks it can be substantial. A serious implementation would pull borrow rates and apply them to the short leg's notional.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    <strong>Take the rolling ADF re-test more seriously.</strong> The strategy includes an optional rolling ADF re-test every 21 days during the live period. I left it disabled by default. In retrospect, making it mandatory would have caught pairs whose cointegration broke down mid-test-period before they generated a string of losing trades.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    What this project actually taught me
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Looking back, the most valuable thing wasn't the code. It was the discipline of learning the theory first and implementing second — understanding <em>why</em> each piece of the pipeline exists before touching a keyboard.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Statistical arbitrage looks deceptively simple from the outside. Two assets, one spread, trade the reversion. The complexity is in the details: which assets, which tests, which model, which signal, which execution, and — critically — which mistakes are you making that your backtest is hiding from you.
  </p>

  <blockquote class="my-10 pl-6 border-l-[4px] border-[#E85D04] text-xl italic font-serif text-gray-700">
    I came into this project knowing how to build systems. I left it understanding something about how financial markets encode information, how models can be wrong in subtle ways that look right on paper, and how much discipline it takes to build something you can actually trust.
  </blockquote>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    That feels like a reasonable foundation to keep building on.
  </p>

  <p class="text-lg md:text-xl text-gray-500 leading-relaxed font-serif italic mb-6">
    The full implementation is open-source on <a href="https://github.com/dangolofrancesco/AlphaStream-KF" class="text-[#E85D04] hover:underline">GitHub</a>. 
  </p>
  
  <p class="text-lg md:text-xl text-gray-500 leading-relaxed font-serif italic mb-6">
    If you want to go deeper, I documented everything on the <a href="/projects/alphastream-kf" class="text-[#E85D04] hover:underline">AlphaStream-KF project page</a>.
  </p>

</div>
