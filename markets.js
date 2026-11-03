(() => {
  const initMarkets = () => {
    const section = document.querySelector('#markets');
    if (!section) return;

    const marketButtons = Array.from(section.querySelectorAll('[data-market]'));
    const detailTitle = section.querySelector('[data-market-detail-title]');
    const detailCopy = section.querySelector('[data-market-detail-copy]');
    const status = section.querySelector('[data-market-status]');

    const marketCopy = {
      'nigeria': 'A clear, digital-first customer experience designed to help families make protection part of everyday planning.',
      'zambia': 'A warm, straightforward customer experience that keeps family protection easy to understand and easy to revisit.',
      'zimbabwe': 'A thoughtful digital customer experience centred on helping families protect what matters, with clarity at every step.',
      'kenya': 'A confident, mobile-ready customer experience that brings family protection closer to the moments that matter.',
      'south-africa': 'A considered digital customer experience that helps families explore protection with clarity, confidence and care.',
      'namibia': 'A calm, transparent customer experience built around family protection and a simpler way to stay connected.',
      'botswana': 'A human, digital customer experience that makes family protection feel clear, approachable and close to home.'
    };

    const countryName = (button) => button ? button.textContent.trim() : 'South Africa';

    const selectMarket = (button, announce = true) => {
      if (!button || !detailTitle || !detailCopy) return;
      const market = button.dataset.market;
      const name = countryName(button);
      marketButtons.forEach((candidate) => {
        candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
      });
      detailTitle.textContent = `Life cover for ${name}.`;
      detailCopy.textContent = marketCopy[market] || 'A considered digital customer experience centred on family protection, with clarity and care at every step.';
      if (announce && status) status.textContent = `Showing the ${name} demo experience.`;
    };

    marketButtons.forEach((button) => {
      button.addEventListener('click', () => selectMarket(button));
    });

    const selected = marketButtons.find((button) => button.getAttribute('aria-pressed') === 'true') || marketButtons.find((button) => button.dataset.market === 'south-africa') || marketButtons[0];
    if (selected) selectMarket(selected, false);

    const communityButtons = Array.from(section.querySelectorAll('[data-community-tab]'));
    const communityMessage = section.querySelector('[data-community-message]');
    communityButtons.forEach((button) => {
      button.addEventListener('click', () => {
        communityButtons.forEach((candidate) => candidate.setAttribute('aria-selected', candidate === button ? 'true' : 'false'));
        if (communityMessage) communityMessage.textContent = 'No notices published in this demo.';
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarkets, { once: true });
  } else {
    initMarkets();
  }
})();
