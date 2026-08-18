/* ============================================
   SOLARADO ROOFING & SOLAR — App Logic
   Chatbot, scroll animations, mobile menu
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initMobileMenu();
  initSmoothScroll();
  initChatbot();
});

/* ============================================
   SCROLL REVEAL
   ============================================ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${i % 4 * 80}ms`;
    observer.observe(el);
  });
}

/* ============================================
   MOBILE MENU
   ============================================ */
function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.mobile-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================
   SMOOTH SCROLL
   ============================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================
   CHATBOT
   ============================================ */
function initChatbot() {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messagesEl = document.getElementById('chatMessages');
  const chipsEl = document.getElementById('chatChips');
  const badge = document.getElementById('chatBadge');

  if (!toggle || !panel) return;

  // --- State ---
  let isOpen = false;
  let hasOpened = false;
  let state = 'idle'; // idle, quote_name, quote_phone, quote_time
  let quoteData = {};

  // --- Knowledge Base ---
  const knowledge = {
    tax_credit: {
      keywords: ['tax credit', 'tax', '30%', '30 percent', 'itc', 'incentive', 'federal', 'credit'],
      response: "Great news — the federal solar Investment Tax Credit (ITC) lets you deduct 30% of your total solar installation cost from your federal taxes. For a typical Fairfield home, that can mean $6,000–$9,000 back. It applies to both the panels and battery storage, and there's no cap. Want me to set up a free quote so we can show you exactly what you'd save?"
    },
    cost: {
      keywords: ['cost', 'price', 'how much', 'expensive', 'afford', 'pricing', 'investment', 'spend'],
      response: "In the Fairfield area, a typical residential solar system runs between $15,000–$28,000 before the 30% federal tax credit. After the credit, most homeowners pay around $10,500–$19,600. With California's high electricity rates, most systems pay for themselves in 5–7 years — then it's essentially free electricity for 20+ more years. Want a free quote with exact numbers for your home?"
    },
    roof_before_solar: {
      keywords: ['need a new roof', 'roof before solar', 'roof first', 'replace roof', 'old roof', 'roof age', 'roof condition', 'roof and solar'],
      response: "If your roof is more than 10–15 years old, we generally recommend replacing it before or during your solar installation. The good news is that's exactly what makes Solarado special — we handle both the roof and solar in one project, saving you time, money, and the hassle of coordinating two contractors. Shall I set up a free inspection so we can check your roof's condition?"
    },
    combo: {
      keywords: ['combo', 'both', 'together', 'one project', 'bundle', 'package', 'roof and solar together', 'one crew'],
      response: "Our Roof + Solar Combo is our most popular service and what sets us apart. We install your new roof and solar panels in a single project with one crew, one timeline, and one warranty. You save money compared to hiring separate contractors, and there's zero finger-pointing if anything comes up later. It's truly one-stop shopping. Ready for a free quote to see how much you could save with the combo?"
    },
    financing: {
      keywords: ['financing', 'finance', 'payment', 'monthly', 'loan', 'pay', 'payment plan', 'afford', '$0 down'],
      response: "We offer several financing options to make solar affordable for every homeowner. Many of our customers go with $0-down solar loans where your monthly payment is often less than your current electric bill — so you start saving from day one. We'll walk you through all the options during your free consultation. Want me to set that up?"
    },
    cloudy: {
      keywords: ['cloudy', 'cloud', 'rain', 'shade', 'overcast', 'weather', 'foggy', 'fog', 'winter'],
      response: "Solar panels still produce energy on cloudy and overcast days — typically about 10–25% of their rated output. Fairfield gets an average of 260+ sunny days per year, which is excellent for solar. Your system is designed for annual production, so sunny summer months more than make up for cloudier winter days. Would you like a free quote that includes production estimates for your specific roof?"
    },
    battery: {
      keywords: ['battery', 'batteries', 'storage', 'powerwall', 'backup', 'power outage', 'outage', 'blackout', 'store energy', 'enphase'],
      response: "Yes, we install battery storage systems that let you store excess solar energy for use at night or during power outages. Batteries also qualify for the 30% federal tax credit. Popular options include the Tesla Powerwall and Enphase IQ Battery. With PG&E's time-of-use rates, batteries can save you even more by using stored solar during peak-rate hours. Want a free quote that includes battery options?"
    },
    timeline: {
      keywords: ['timeline', 'how long', 'long does it take', 'time', 'weeks', 'days', 'schedule', 'when', 'start', 'duration', 'turnaround'],
      response: "A typical solar installation takes 1–3 days once permits are approved. The full process from signing to turning on your system usually takes 4–8 weeks, mainly due to permitting and utility interconnection. A roof replacement adds 2–4 days. For our Roof + Solar Combo projects, we coordinate everything so there's minimal disruption. Want to get a timeline for your specific project with a free quote?"
    },
    warranty: {
      keywords: ['warranty', 'warranties', 'guarantee', 'guaranteed', 'protection', 'covered', 'workmanship', 'manufacturer'],
      response: "We stand behind our work with comprehensive warranties. Our roofing comes with a manufacturer's warranty (25–50 years depending on the material) plus our own 10-year workmanship guarantee. Solar panels carry a 25-year manufacturer warranty, and our inverters are warranted for 12–25 years. With the Roof + Solar Combo, everything is under one warranty umbrella — no runaround between contractors. Want a free quote with full warranty details?"
    },
    quote: {
      keywords: ['quote', 'estimate', 'book', 'appointment', 'schedule', 'consultation', 'free quote', 'come out', 'visit', 'inspect'],
      response: null // Special handling — triggers the quote flow
    },
    hello: {
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'howdy', 'sup', 'yo'],
      response: "Hey there! 👋 Thanks for reaching out to Solarado Roofing & Solar. I can help answer questions about roofing, solar panels, the 30% federal tax credit, costs, and more — or I can set you up with a free quote. What would you like to know?"
    },
    thanks: {
      keywords: ['thank', 'thanks', 'appreciate', 'awesome', 'great', 'perfect', 'cool'],
      response: "You're welcome! If you have any other questions about roofing or solar, feel free to ask. And whenever you're ready, I can set up a free, no-obligation quote for you. We're here to help! 😊"
    }
  };

  const fallbackResponse = "Great question — I want to make sure you get the most accurate answer. The best way to get specifics for your home is with a free, no-obligation quote. One of our experts can address that directly. Want me to set one up for you?";

  const defaultChips = [
    'How does the 30% tax credit work?',
    'Do I need a new roof before solar?',
    'How much does solar cost?',
    'Book a free quote'
  ];

  // --- Initialize ---
  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    toggle.classList.add('open');
    toggle.innerHTML = '✕';
    if (badge) badge.style.display = 'none';

    if (!hasOpened) {
      hasOpened = true;
      addBotMessage("Hi! I'm the Solarado Assistant 👋 I can answer questions about roofing, solar, pricing, and the federal tax credit — or book you a free quote. What can I help with?");
      showChips(defaultChips);
    }

    setTimeout(() => input.focus(), 100);
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('open');
    toggle.classList.remove('open');
    toggle.innerHTML = '💬';
  }

  toggle.addEventListener('click', () => {
    if (isOpen) closeChat();
    else openChat();
  });

  closeBtn.addEventListener('click', closeChat);

  // --- Messages ---
  function addBotMessage(text) {
    // Show typing indicator first
    const typingEl = document.createElement('div');
    typingEl.className = 'message bot';
    typingEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(typingEl);
    scrollToBottom();

    setTimeout(() => {
      typingEl.innerHTML = text;
      scrollToBottom();
    }, 600 + Math.random() * 400);
  }

  function addUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'message user';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 50);
  }

  function showChips(chips) {
    chipsEl.innerHTML = '';
    chips.forEach(text => {
      const chip = document.createElement('button');
      chip.className = 'chat-chip';
      chip.textContent = text;
      chip.addEventListener('click', () => handleUserInput(text));
      chipsEl.appendChild(chip);
    });
  }

  function clearChips() {
    chipsEl.innerHTML = '';
  }

  // --- Input handling ---
  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      handleUserInput(text);
      input.value = '';
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = input.value.trim();
      if (text) {
        handleUserInput(text);
        input.value = '';
      }
    }
  });

  function handleUserInput(text) {
    addUserMessage(text);
    clearChips();

    if (state === 'idle') {
      processIdle(text);
    } else if (state === 'quote_name') {
      quoteData.name = text;
      state = 'quote_phone';
      addBotMessage(`Nice to meet you, ${text}! What's the best phone number to reach you at?`);
    } else if (state === 'quote_phone') {
      quoteData.phone = text;
      state = 'quote_time';
      addBotMessage("Got it! And when's the best time for us to give you a call? (Morning, afternoon, or evening?)");
      showChips(['Morning', 'Afternoon', 'Evening', 'Anytime']);
    } else if (state === 'quote_time') {
      quoteData.time = text;
      state = 'idle';
      addBotMessage(`You're all set, ${quoteData.name}! 🎉 Here's what we have:\n\n📞 ${quoteData.phone}\n🕐 Best time: ${text}\n\nSomeone from Solarado Roofing & Solar will reach out shortly to schedule your free quote. We look forward to helping you! Is there anything else you'd like to know in the meantime?`);
      quoteData = {};
      setTimeout(() => showChips(defaultChips), 1200);
    }
  }

  function processIdle(text) {
    const lower = text.toLowerCase();

    // Check for quote intent
    const quoteKeywords = knowledge.quote.keywords;
    if (quoteKeywords.some(kw => lower.includes(kw))) {
      startQuoteFlow();
      return;
    }

    // Score each topic by keyword matches
    let bestMatch = null;
    let bestScore = 0;

    for (const [topic, data] of Object.entries(knowledge)) {
      if (topic === 'quote') continue;
      let score = 0;
      for (const kw of data.keywords) {
        if (lower.includes(kw)) {
          score += kw.length; // Longer keyword matches score higher
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = data;
      }
    }

    if (bestMatch && bestScore > 0) {
      addBotMessage(bestMatch.response);
      setTimeout(() => showChips(['Book a free quote', 'Ask another question']), 1200);
    } else {
      addBotMessage(fallbackResponse);
      setTimeout(() => showChips(['Yes, book a free quote', ...defaultChips.slice(0, 2)]), 1200);
    }
  }

  function startQuoteFlow() {
    state = 'quote_name';
    addBotMessage("Awesome, let's get you set up with a free quote! It only takes a moment. First, what's your name?");
  }

  // Handle "Ask Us Anything" button in hero
  const askBtn = document.getElementById('askBtn');
  if (askBtn) {
    askBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openChat();
    });
  }

  // Handle any "open chat" triggers
  document.querySelectorAll('[data-open-chat]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openChat();
    });
  });
}
