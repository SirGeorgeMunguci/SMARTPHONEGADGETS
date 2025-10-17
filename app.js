(() => {
  const form = document.getElementById('receipt-form');
  const resetBtn = document.getElementById('resetBtn');

  const elCustomer = document.getElementById('r-customer');
  const elItem = document.getElementById('r-item');
  const elAmount = document.getElementById('r-amount');
  const elDate = document.getElementById('r-date');
  const elMessage = document.getElementById('r-message');

  const inputCustomer = document.getElementById('customerName');
  const inputEmail = document.getElementById('email');
  const inputItem = document.getElementById('item');
  const inputAmount = document.getElementById('amount');
  const inputDate = document.getElementById('date');
  const inputMessage = document.getElementById('message');

  // Helpers
  function formatCurrency(amount) {
    const value = Number(amount);
    if (!isFinite(value)) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  }

  function formatDate(value) {
    try {
      if (!value) return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date());
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
    } catch (_) {
      return '—';
    }
  }

  function updateReceipt({ customer, item, amount, date, message }) {
    elCustomer.textContent = customer || '—';
    elItem.textContent = item || '—';
    elAmount.textContent = formatCurrency(amount);
    elDate.textContent = formatDate(date);
    elMessage.textContent = message || 'Thank you for choosing Gadget Co!';
  }

  function handleSubmit(event) {
    event.preventDefault();
    const data = {
      customer: inputCustomer.value.trim(),
      email: (inputEmail && inputEmail.value.trim()) || '',
      item: inputItem.value.trim(),
      amount: inputAmount.value,
      date: inputDate.value,
      message: inputMessage.value.trim()
    };

    updateReceipt(data);

    // Persist a simple copy locally
    try {
      const existing = JSON.parse(localStorage.getItem('receipts') || '[]');
      const id = Date.now();
      existing.push({ id, ...data });
      localStorage.setItem('receipts', JSON.stringify(existing));
    } catch (_) { /* ignore storage errors */ }

    // If email is provided, POST to local email endpoint
    if (data.email) {
      const payload = {
        to: data.email,
        customer: data.customer,
        item: data.item,
        amount: formatCurrency(data.amount),
        date: formatDate(data.date),
        message: data.message || ''
      };
      fetch('/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => { /* ignore errors on client */ });
    }

    // Slight delay to ensure DOM updates before print dialog
    setTimeout(() => {
      window.print();
    }, 50);
  }

  function handleReset() {
    form.reset();
    updateReceipt({ customer: '—', item: '—', amount: 0, date: '', message: 'Thank you for choosing Gadget Co!' });
  }

  // Prefill date with today
  if (!inputDate.value) {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    inputDate.value = today;
  }

  // Wire events
  form.addEventListener('submit', handleSubmit);
  resetBtn.addEventListener('click', handleReset);

  // Live preview updates
  [inputCustomer, inputEmail, inputItem, inputAmount, inputDate, inputMessage].filter(Boolean).forEach((input) => {
    input.addEventListener('input', () => {
      updateReceipt({
        customer: inputCustomer.value.trim(),
        item: inputItem.value.trim(),
        amount: inputAmount.value,
        date: inputDate.value,
        message: inputMessage.value.trim()
      });
    });
  });

  // Initial render with defaults
  updateReceipt({
    customer: '',
    item: '',
    amount: '',
    date: inputDate.value,
    message: 'Thank you for choosing Gadget Co!'
  });
})();


