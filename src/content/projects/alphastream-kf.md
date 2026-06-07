---
title: "AlphaStream-KF: Statistical Arbitrage with a Kalman Filter"
description: Building an institutional-grade pairs trading engine for large-cap US equities — from cointegration theory to a full event-driven backtest with realistic market friction.
image: /projects_images/kf/alphastream_kf_cover.svg
tags: [StatArb, KalmanFilter, Python, QuantitativeFinance, AlgorithmicTrading]
date: 2026-06-01
github: https://github.com/dangolofrancesco/AlphaStream-KF
---

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Statistical Arbitrage is one of the oldest and most intellectually rigorous strategies in quantitative finance. The premise sounds deceptively simple: find two assets whose prices move together, wait for them to temporarily diverge, and trade the reversion back to equilibrium.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The hard part is doing it right. Most implementations fail in the same ways: they use static hedge ratios that decay over time, they standardize signals with rolling windows that break during volatility shocks, and they ignore the market microstructure costs that silently erode the edge. This project was built to fix all three.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    <strong>AlphaStream-KF</strong> is a full pairs trading engine targeting same-sector large-cap US equities. It combines Engle-Granger cointegration theory with a streaming Kalman Filter for adaptive hedge ratio estimation, and validates everything through an out-of-sample backtest with realistic execution costs.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The Core Problem: Static Models in a Dynamic Market
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The classical approach to pairs trading estimates a fixed hedge ratio β via OLS regression: fit the model once on historical data, then trade on it forever. This works in a textbook. In live markets, it doesn't.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The relationship between two companies — say, two payment processors — is not constant. Business conditions change, earnings cycles diverge, macro regimes shift. A β estimated on 2020–2025 data will be systematically wrong by 2026. The OLS model doesn't know this. It just keeps generating signals based on a stale prior.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The solution is to treat the hedge ratio as a <strong>latent state variable</strong> that evolves over time, and estimate it recursively as new data arrives. That is exactly what a Kalman Filter does.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/kf/cointegration_heatmap.png" 
      alt="Cointegration heatmap across asset universe" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Cointegration heatmap across the asset universe. Darker cells indicate stronger evidence of a stationary spread (lower ADF p-value). Only shaded pairs pass the 5% significance threshold.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Step 1 — Pair Selection: Economic Logic Before Statistics
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    A common mistake is to run a cointegration scan across all possible pairs and trade whatever passes the statistical test. This leads to spurious relationships: two assets can appear cointegrated in-sample simply by chance, with no underlying economic mechanism to sustain the relationship out-of-sample.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The pipeline enforces a layered selection process before a single statistical test is run:
  </p>

  <ol class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-decimal">
    <li class="mb-4">
      <strong>Economic Pre-filtering:</strong> Assets are grouped by sector and fundamental business model. Only intra-sector pairs are considered, ensuring statistical cointegration is backed by a real economic link (e.g., two semiconductor companies competing in the same supply chain, two energy supermajors exposed to the same commodity price).
    </li>
    <li class="mb-4">
      <strong>Recent-Window Stationarity:</strong> The Augmented Dickey-Fuller (ADF) test is applied only to the most recent 252 trading days of the training set. This avoids the "10-year OLS trap", where a long-run average masks recent structural breaks. A p-value below 0.05 is required.
    </li>
    <li class="mb-4">
      <strong>Half-Life Filtering:</strong> The speed of mean reversion is estimated via OLS on the spread differences: <code>ΔS(t) = λ·S(t−1) + μ + ε</code>, giving a half-life of <code>−ln(2)/λ</code>. Only pairs with a half-life between 5 and 30 days are retained — fast enough to be exploitable at daily frequency, slow enough not to be dominated by transaction costs.
    </li>
    <li class="mb-4">
      <strong>Disjoint Portfolio (Risk Management):</strong> A greedy algorithm selects the top pairs while enforcing that no single ticker appears in more than one pair. This prevents inadvertently building a concentrated directional bet on a single asset across multiple "independent" positions.
    </li>
  </ol>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Step 2 — The Kalman Filter: A Streaming Hedge Ratio
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The Kalman Filter models the state of the pair as a 2-dimensional vector <code>θ_t = [β_t, α_t]</code>, where β_t is the time-varying hedge ratio and α_t is the intercept (drift). At each time step t, the observation is:
  </p>

<div class="my-8 text-center text-xl font-serif overflow-x-auto">

$$y_t = \beta_t \cdot x_t + \alpha_t + \varepsilon_t, \quad \varepsilon_t \sim \mathcal{N}(0, R)$$

</div>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The state evolves as a random walk: <code>θ_t = θ_{t−1} + η_t</code>, where <code>η_t ~ N(0, Q)</code>. The key design choice is the <strong>decoupled process noise matrix Q</strong>:
  </p>

<div class="my-8 text-center text-xl font-serif overflow-x-auto">

$$Q = \begin{pmatrix} 10^{-6} & 0 \\ 0 & 10^{-6} \end{pmatrix}$$

</div>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Both β and α are assigned extremely slow process variances. This reflects a deliberate prior: the fundamental economic relationship between two companies in the same sector changes slowly. A fast-adapting filter would simply forgive every market deviation, destroying the trading signal. A slow filter keeps the state anchored to the true structural relationship.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The filter is warm-started from OLS estimates on the training set, significantly reducing the convergence period compared to initializing at zero.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/kf/pair_prices.png" 
      alt="Dynamic beta estimated by the Kalman Filter over the test period" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <img 
      src="/projects_images/kf/dynamic_beta.png" 
      alt="Dynamic beta estimated by the Kalman Filter over the test period" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Dynamic hedge ratio β_t estimated by the Kalman Filter over the out-of-sample test period (2017–2018). The filter adapts smoothly to regime changes without overreacting to daily noise.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Step 3 — The Signal: Why Pre-Update Innovations Matter
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    This is the most subtle design decision in the entire engine, and the one most implementations get wrong.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    In a Kalman Filter, the <strong>innovation</strong> <code>e_t</code> is the prediction error <em>before</em> the state update: how much the observed price deviated from what the filter expected, given yesterday's state estimate. The <strong>post-update residual</strong>, by contrast, is computed after the filter has already absorbed the new observation and adjusted its parameters.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Using post-update residuals as the trading signal is a subtle form of look-ahead bias. The filter has already moved β_t toward explaining today's price, so the residual is algebraically smaller than the true "surprise". The pre-update innovation <code>e_t</code> represents the genuine market anomaly — the actual deviation from the model's prior expectation.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The trading signal is the <strong>filter Z-score</strong>, which standardizes the innovation by the filter's own dynamic measure of uncertainty:
  </p>

<div class="my-8 text-center text-xl font-serif overflow-x-auto">

$$z_t = \frac{e_t}{\sqrt{S_t}}, \quad S_t = H_t P_{t|t-1} H_t^\top + R$$

</div>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Where <code>S_t</code> is the innovation variance produced by the filter at each step. This replaces the rolling-window standard deviation used in naive implementations, which fails during volatility regime shifts. The filter Z-score is always properly scaled to the current uncertainty of the model.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/kf/spread_zscore.png" 
      alt="Spread and filter Z-score over the test period" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Kalman innovation e_t and filter Z-score z_t over the test period. Horizontal dashed lines mark entry thresholds at ±2σ and the hard stop at ±3.5σ. The signal reverts cleanly to zero between trades.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Step 4 — Execution: Adaptive Sizing and Risk Controls
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Trading rules are deliberately simple. The complexity lives in the filter, not in the signal logic:
  </p>

  <ul class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-disc">
    <li class="mb-3"><strong>Long the spread</strong> (long Y, short X) when <code>z_t ≤ −2.0</code></li>
    <li class="mb-3"><strong>Short the spread</strong> (short Y, long X) when <code>z_t ≥ +2.0</code></li>
    <li class="mb-3"><strong>Exit</strong> when <code>|z_t|</code> reverts to 0 (full mean reversion)</li>
    <li class="mb-3"><strong>Hard stop</strong> at <code>|z_t| = 3.5</code> — a structural break signal that triggers immediate liquidation</li>
  </ul>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Position sizing scales with signal strength: 0.5× at <code>|z| ∈ (1, 1.5)</code>, 0.75× at <code>(1.5, 2)</code>, 0.9× at <code>(2, 2.5)</code>, and full size at <code>|z| ≥ 2.5</code>. Critically, <strong>position size is locked at entry</strong>. This prevents the pathology of scaling out of a winning trade as it reverts to the mean — the Ornstein-Uhlenbeck dynamics provide the edge precisely during reversion, not at entry.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    To strictly prevent look-ahead bias, all signals generated on day t are executed at the open of day t+1.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Step 5 — Backtesting with Realistic Market Friction
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    A backtest is only as trustworthy as its friction model. The backtester was designed to be adversarial toward the strategy — every assumption defaults to pessimistic:
  </p>

  <ul class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-disc">
    <li class="mb-3"><strong>Transaction costs:</strong> 5 basis points per leg, applied to both entry and exit on both sides of the pair</li>
    <li class="mb-3"><strong>Dynamic slippage:</strong> Penalized proportionally to position size relative to the asset's rolling daily volume distribution. Trades that exceed the 25th–75th percentile volume range face aggressive slippage scaling</li>
    <li class="mb-3"><strong>Dollar neutrality:</strong> The short leg is sized by the current KF hedge ratio β_t at execution time — not a stale historical estimate</li>
    <li class="mb-3"><strong>Circuit breakers:</strong> A −10% portfolio stop-loss and a +20% take-profit cap manage tail risk at the portfolio level</li>
  </ul>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/kf/equity_curves.png" 
      alt="Per-pair equity curves and combined portfolio equity" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Out-of-sample equity curves for each selected pair (colored lines) and the combined portfolio (black line). Diversification across uncorrelated pairs smooths individual drawdowns and reduces path-dependence.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Results: Out-of-Sample Performance (2017–2018)
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The test period — 2017 through 2018 — was deliberately chosen for its difficulty. It included the late-2018 equity market correction, a particularly hostile environment for mean-reversion strategies that depend on stable relative pricing between assets.
  </p>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The disjoint portfolio construction proved its value during this period. The semiconductor pair, which would have suffered a −46% drawdown under a naive non-disjoint construction (due to concentrated exposure across multiple pairs containing the same underlying), was contained to a −12% drawdown through the risk controls. The combined portfolio generated consistent, uncorrelated absolute returns across the test horizon.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/kf/portfolio_downdrawn.png" 
      alt="Portfolio drawdown over the test period" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Portfolio drawdown chart over the out-of-sample test period. Short, shallow drawdown events indicate resilient recovery dynamics driven by the hard-stop and disjoint portfolio construction.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Honest Limitations
  </h2>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    A serious project requires an honest accounting of what it does not model:
  </p>

  <ul class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-disc">
    <li class="mb-3"><strong>Short-selling costs:</strong> Borrowing fees for the short leg are not modeled. For hard-to-borrow names, this can be a significant drag on returns</li>
    <li class="mb-3"><strong>Settlement delays:</strong> T+2 settlement mechanics are not explicitly modeled, which can affect capital availability calculations</li>
    <li class="mb-3"><strong>Cointegration stability:</strong> Pairs that pass the ADF test in-sample can diverge structurally out-of-sample. The optional 21-day rolling ADF re-test (disabled by default) exists to flag this, but does not prevent it</li>
    <li class="mb-3"><strong>Regime dependence:</strong> The strategy is inherently mean-reversion based and will underperform during sustained trending regimes in which correlated assets decouple persistently</li>
  </ul>

  <blockquote class="my-10 pl-6 border-l-[4px] border-[#E85D04] text-xl italic font-serif text-gray-700">
    "The goal was not to find alpha. It was to build the correct infrastructure to ask the question rigorously."
  </blockquote>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The code is fully open-source and modular — each component (data loading, Kalman Filter, strategy, backtester, plotting) is independently testable. If you are exploring statistical arbitrage, adaptive filtering, or pairs trading infrastructure, the repository is a starting point worth examining.
  </p>

</div>
