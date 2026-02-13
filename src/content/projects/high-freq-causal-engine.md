---
title: Building a 4-Microsecond HFT Engine for Crypto Arbitrage
description: How I optimized a strategy from milliseconds to microseconds using C++, Pybind11, and Order Book Imbalance.
image: /projects_images/hft/header_hft-proget.png
tags: [ HFT, C++, Python, QuantitativeFinance, AlgorithmicTrading]
date: 2026-12-02
github: https://github.com/dangolofrancesco/high-freq-causal-engine.git
---


<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    In High-Frequency Trading (HFT), a millisecond is an eternity. It’s the difference between being a "maker" providing liquidity and a "taker" paying fees on a stale price.
  </p>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    When I started designing my crypto arbitrage strategy, I did what everyone does: I opened a Jupyter Notebook. I loaded tick data into Pandas, calculated signals using vectorized operations, and felt productive. But then I hit a wall.
  </p>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Vectorized backtesting is great for research, but it suffers from <strong>Look-Ahead Bias</strong>. To simulate a real trading environment, you need an Event-Driven system, one that processes the market tick-by-tick, just like a live exchange feed.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/hft/plot_slidebar.png" 
      alt="Streamlit Dashboard" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    When I tried to run a true event-driven loop in pure Python over millions of trades, the performance was unacceptable. The latency per tick was hovering around <strong>1-2 milliseconds</strong>. In the crypto markets, where price discovery happens in microseconds, my "fast" Python bot was a dinosaur.
  </p>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    I realized that to build a portfolio-worthy engine, I needed the best of both worlds: the ease of Python for data analysis and the raw speed of C++ for execution.
  </p>
  
  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The Architecture: A Hybrid "Ferrari" Engine
  </h2>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    I redesigned the system with a clear separation of concerns. I call it the "Hybrid Core" architecture.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/hft/system_architecture.png" 
      alt="Hybrid Core Architecture Diagram" 
      class="w-auto h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Data flows from Python, gets processed in the C++ Core, and results are analyzed back in Python.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <ul class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-disc">
    <li>
      <strong>The Brain (C++17):</strong> I wrote the OrderBook logic and signal processing in C++. By using <code>std::unique_ptr</code> and memory-aligned structures, I minimized cache misses. This module handles the heavy lifting: reconstructing the limit order book and calculating imbalances.
    </li>
    <li>
      <strong>The Orchestrator (Python):</strong> I kept Python for what it does best—Data Engineering (ETL) and Visualization.
    </li>
    <li>
      <strong>The Bridge (Pybind11):</strong> This was the game-changer. <code>pybind11</code> allowed me to expose my C++ classes to Python with zero-copy overhead.
    </li>
  </ul>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    The result? I could feed a tick from Python to C++, update the state, calculate a signal, and return the decision in <strong>~4.5 microseconds</strong>. That is 400x faster than my original pure Python implementation.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    The Logic: Exploiting Microstructure
  </h2>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Speed is useless without a strategy. I focused on Latency Arbitrage between correlated assets: Bitcoin (BTC) and Ethereum (ETH). The hypothesis is simple: <strong>Bitcoin leads, Ethereum follows.</strong>
  </p>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    When a massive buy order hits Bitcoin, arbitrage bots will eventually correct Ethereum's price upwards. There is a tiny window of time where BTC has moved, but ETH hasn't yet. To detect this, I measure the Order Book Imbalance (OBI) of the Leader (BTC):
  </p>

<div class="my-8 text-center text-xl font-serif overflow-x-auto">

$$
OBI_t = \frac{V_t^{bid} - V_t^{ask}}{V_t^{bid} + V_t^{ask}}
$$

</div>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    If <strong>OBI &gt; 0.3</strong>: Buyers are aggressively lifting the offer on BTC. Action: Buy ETH immediately.<br/>
    If <strong>OBI &lt; -0.3</strong>: Sellers are hitting the bid on BTC. Action: Short Sell ETH immediately.
  </p>

</div>

<figure class="col-span-1 md:col-span-5 w-full md:w-[90%] mx-auto my-12">
    <img 
      src="/projects_images/hft/equity_plot.png" 
      alt="Streamlit Dashboard showing Alpha" 
      class="w-full h-auto object-cover rounded-lg shadow-lg"
    />
    <figcaption class="mt-4 text-center text-sm text-gray-500 font-serif italic">
      Visualizing the Alpha: The purple equity curve rises even as the market (blue line) crashes.
    </figcaption>
</figure>

<div class="hidden md:block md:col-span-1"></div>

<div class="col-span-1 md:col-span-3 max-w-3xl mx-auto">

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Visualizing the Alpha
  </h2>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Numbers in a terminal are dry. I built a custom Streamlit Dashboard to visually verify the "Causality" of the signals. In the chart above, you can see the <strong>"Flip" Mechanism</strong> in action during a market crash.
  </p>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Unlike a basic "Long Only" bot that sits on its hands during a crash, my engine executes a Position Reversal. It sells the existing Long position and immediately opens a Short position. This allows the equity curve to rise even while the market bleeds.
  </p>

  <h2 class="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6 mt-12">
    Lessons Learned
  </h2>
  
  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    Building this engine taught me three critical engineering lessons that you don't learn in a bootcamp:
  </p>

  <ol class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6 ml-6 list-decimal">
    <li>
      <strong>Memory Management Matters:</strong> In Python, the Garbage Collector handles everything. In C++, a memory leak in a high-frequency loop crashes your system in seconds. Using smart pointers was non-negotiable.
    </li>
    <li>
      <strong>The "Zero-Copy" Rule:</strong> Passing data between Python and C++ can be slow if you copy memory. Learning to use pointers and references via <code>pybind11</code> was key to keeping latency under 5µs.
    </li>
    <li>
      <strong>Visual Debugging:</strong> A backtest can lie. Building the dashboard showed me bugs in my logic (like the "Exit on Neutral" issue) that I would have never found just by looking at the final ROI number.
    </li>
  </ol>

  <blockquote class="my-10 pl-6 border-l-[4px] border-[#E85D04] text-xl italic font-serif text-gray-700">
    "This project started as an attempt to speed up a loop and ended as a full-stack engineering challenge."
  </blockquote>

  <p class="text-lg md:text-xl text-gray-800 leading-relaxed font-serif mb-6">
    It bridges the gap between Quantitative Research and Systems Engineering. The code is open-source and available on my GitHub. If you are interested in HFT architecture or C++ optimization, feel free to check it out.
  </p>

</div>
