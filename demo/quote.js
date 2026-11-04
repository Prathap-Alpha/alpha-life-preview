(function() {
  const API_BASE = 'https://omni.alphadirect.co.bw/api/v1/alpha-life-demo';
  
  let currentQuote = null;
  let currentPolicy = null;

  const el = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const showErr = (msg) => {
    const d = el('demo-error');
    if(msg) { 
      d.textContent = msg; 
      d.hidden = false; 
      d.scrollIntoView({behavior:'smooth', block:'center'}); 
    } else { 
      d.hidden = true; 
    }
  };
  const showSucc = (msg) => {
    const d = el('demo-success');
    if(msg) { 
      d.textContent = msg; 
      d.hidden = false; 
      d.scrollIntoView({behavior:'smooth', block:'center'}); 
    } else { 
      d.hidden = true; 
    }
  };

  const friendly = (err) => err instanceof TypeError
    ? 'The demo is unavailable just now. Please try again later.'
    : err.message;

  const getAge = (dobString) => {
    const today = new Date();
    const dob = new Date(dobString);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
  };

  const switchMainPanel = (showId) => {
    ['panel-quote', 'panel-apply', 'panel-policy', 'panel-claim'].forEach(id => {
      const p = el(id);
      if(p) {
        if (id === showId) {
          p.hidden = false;
          p.classList.add('is-active');
        } else {
          p.hidden = true;
          p.classList.remove('is-active');
        }
      }
    });
    showErr('');
    showSucc('');
  };

  const products = {};
  const fillCover = () => {
    const picked = products[el('q-product').value];
    const options = picked ? picked.cover_options : [];
    el('q-cover').innerHTML = options.length
      ? options.map((v) => `<option value="${v}">$${Number(v).toLocaleString()}</option>`).join('')
      : '<option value="">Select a product first</option>';
  };
  const loadProducts = async () => {
    try {
      const data = await apiReq('/products/', 'GET');
      data.products.forEach((p) => { products[p.product] = p; });
      el('q-product').addEventListener('change', fillCover);
      fillCover();
    } catch (err) {
      showErr(friendly(err));
    }
  };

  async function apiReq(endpoint, method, payload=null) {
    const opts = { method, headers: {} };
    if(payload) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    let data;
    try { data = await res.json(); } catch(e) { data = {}; }
    
    if(!res.ok) {
      if(res.status === 503) throw new Error(data.detail || "The demo is switched off.");
      
      const err = data.detail || 
                  (data.non_field_errors && data.non_field_errors[0]) || 
                  (typeof data === 'object' && Object.values(data)[0]) || 
                  "An error occurred.";
      const errMsg = Array.isArray(err) ? err[0] : err;
      throw new Error(errMsg);
    }
    return data;
  }

  el('form-quote').addEventListener('submit', async (e) => {
    e.preventDefault();
    showErr('');
    showSucc('');
    const fd = new FormData(e.target);
    const dob = fd.get('date_of_birth');
    const age = getAge(dob);
    const limits = products[fd.get('product')];
    if (age < 0) { showErr('Date of birth cannot be in the future.'); return; }
    if (limits && (age < limits.min_age || age > limits.max_age)) {
      showErr(`${limits.name} is for ages ${limits.min_age} to ${limits.max_age}. This date of birth gives age ${age}.`);
      return;
    }

    const payload = {
      product: fd.get('product'),
      age: age,
      smoker: fd.get('smoker') === 'true',
      cover: parseFloat(fd.get('cover')),
      currency: fd.get('currency')
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = 'Calculating...';
      const result = await apiReq('/quote/', 'POST', payload);
      
      currentQuote = {
        ...payload,
        date_of_birth: dob, 
        result
      };

      el('quote-result').innerHTML = `
        <dl>
          <dt>Product</dt><dd>${esc(result.name)}</dd>
          <dt>Cover</dt><dd>${parseFloat(result.cover).toLocaleString()} USD</dd>
          <dt>Premium</dt><dd>${result.monthly_premium} ${result.currency} / month</dd>
          ${result.approx ? '<dt>Note</dt><dd>'+esc(result.note)+'</dd>' : ''}
        </dl>
      `;
      switchMainPanel('panel-apply');
    } catch(err) {
      showErr(friendly(err));
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  el('btn-back-quote').addEventListener('click', () => switchMainPanel('panel-quote'));

  el('form-apply').addEventListener('submit', async (e) => {
    e.preventDefault();
    showErr('');
    const fd = new FormData(e.target);
    const payload = {
      product: currentQuote.product,
      date_of_birth: currentQuote.date_of_birth,
      smoker: currentQuote.smoker,
      cover: currentQuote.cover,
      currency: currentQuote.currency,
      holder_name: fd.get('holder_name'),
      beneficiary_name: fd.get('beneficiary_name'),
      accept_demo: fd.get('accept_demo') === 'on',
      paid_mock: true
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = 'Issuing...';
      const result = await apiReq('/apply/', 'POST', payload);
      currentPolicy = result;

      const pdfUrl = `${API_BASE}/policy/${esc(result.number)}/pdf/?pin=${esc(result.pin)}`;
      el('policy-details').innerHTML = `
        <dl>
          <dt>Policy No.</dt><dd>${esc(result.number)}</dd>
          <dt>PIN</dt><dd>${esc(result.pin)}</dd>
          <dt>Premium</dt><dd>${result.monthly_premium} ${result.currency} / month, paid (demo)</dd>
          <dt>Document</dt><dd><a href="${pdfUrl}" target="_blank" style="color:var(--orange); text-decoration:underline;">Download PDF</a></dd>
        </dl>
      `;
      switchMainPanel('panel-policy');
      showSucc(`Policy ${esc(result.number)} issued successfully!`);
    } catch(err) {
      showErr(friendly(err));
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  el('btn-start-over').addEventListener('click', () => {
    currentQuote = null;
    currentPolicy = null;
    el('form-quote').reset();
    switchMainPanel('panel-quote');
  });

  const goClaim = () => {
    if(!currentPolicy) return;
    el('claim-policy-number').textContent = currentPolicy.number;
    switchMainPanel('panel-claim');
  };

  el('btn-show-claim').addEventListener('click', goClaim);

  el('form-claim').addEventListener('submit', async (e) => {
    e.preventDefault();
    showErr('');
    const fd = new FormData(e.target);
    const payload = {
      number: currentPolicy.number,
      pin: currentPolicy.pin,
      claim_type: fd.get('claim_type'),
      event_date: fd.get('event_date'),
      story: fd.get('story')
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      const result = await apiReq('/claim/', 'POST', payload);
      e.target.reset();
      switchMainPanel('panel-policy');
      showSucc(`Claim submitted successfully! Ref: ${result.reference}`); 
    } catch(err) {
      showErr(friendly(err));
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  el('btn-cancel-claim').addEventListener('click', () => {
    switchMainPanel('panel-policy');
  });

  el('form-lookup').addEventListener('submit', async (e) => {
    e.preventDefault();
    showErr('');
    showSucc('');
    const fd = new FormData(e.target);
    const ref = fd.get('number').trim();
    const pin = fd.get('pin').trim();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    try {
      btn.disabled = true;
      btn.textContent = 'Searching...';
      
      let html = '';
      if(ref.startsWith('DEMO-CL-')) {
        const result = await apiReq(`/claim/${ref}/?pin=${pin}`, 'GET');
        html = `
          <h4>Claim: ${result.reference}</h4>
          <dl>
            <dt>Status</dt><dd>${result.status}</dd>
            <dt>Event</dt><dd>${result.event_date}</dd>
            <dt>Type</dt><dd>${result.claim_type}</dd>
            ${result.staff_note ? `<dt>Note</dt><dd>${esc(result.staff_note)}</dd>` : ''}
          </dl>
        `;
      } else {
        const result = (await apiReq(`/policy/${ref}/?pin=${pin}`, 'GET')).policy;
        const pdfUrl = `${API_BASE}/policy/${ref}/pdf/?pin=${pin}`;
        html = `
          <h4>Policy: ${esc(result.number)}</h4>
          <dl>
            <dt>Status</dt><dd>${result.status}</dd>
            <dt>Holder</dt><dd>${esc(result.holder_name)}</dd>
            <dt>Cover</dt><dd>${parseFloat(result.cover).toLocaleString()} USD</dd>
            <dt>Premium</dt><dd>${result.monthly_premium} ${result.currency}</dd>
            <dt>Doc</dt><dd><a href="${pdfUrl}" target="_blank" style="color:var(--orange); text-decoration:underline;">Download PDF</a></dd>
          </dl>
          <button type="button" class="button button-dark" style="margin-top:16px; width:100%;" id="btn-lookup-claim">Submit Mock Claim</button>
        `;
        currentPolicy = { number: ref, pin: pin };
      }
      const resEl = el('lookup-result');
      resEl.innerHTML = html;
      resEl.hidden = false;
    } catch(err) {
      showErr(friendly(err));
      el('lookup-result').hidden = true;
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });

  el('lookup-result').addEventListener('click', (e) => {
    if(e.target.id === 'btn-lookup-claim') {
       goClaim();
    }
  });

  const yesterday = new Date(Date.now() - 86400000);
  el('c-date').value = yesterday.toISOString().split('T')[0];
  el('q-dob').max = new Date().toISOString().split('T')[0];
  loadProducts();

})();
