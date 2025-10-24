(() => {
  //EmailJS Configuration
  const EMAILJS_SERVICE_ID = 'service_85bpmi4'; 
  const EMAILJS_TEMPLATE_ID = 'template_z83qgqp'; 
  const EMAILJS_PUBLIC_KEY = 'oLqZO8rzTywylXUXu';

  try {
      // Initialize EmailJS
      emailjs.init(EMAILJS_PUBLIC_KEY);
  } catch (e) {
      console.error("EmailJS not loaded. Is the CDN script tag correct?", e);
  }
  // -------------------------------------------------------------

  const form = document.getElementById('receipt-form');
  const resetBtn = document.getElementById('resetBtn');
  const addItemBtn = document.getElementById('addItemBtn');
  const sendEmailBtn = form.querySelector('.actions button:nth-child(3)'); 

  const elCustomer = document.getElementById('r-customer');
  const elItemsContainer = document.getElementById('r-items-container'); 
  const elTotal = document.getElementById('r-total');
  const elDate = document.getElementById('r-date');
  const elMessage = document.getElementById('r-message');

  const inputCustomer = document.getElementById('customerName');
  const inputEmail = document.getElementById('email');
  const inputItem = document.getElementById('item');
  const inputAmount = document.getElementById('amount');
  const inputDate = document.getElementById('date');
  const inputMessage = document.getElementById('message');
  
  let lineItems = [];
  let pendingItem = null;

  addItemBtn.addEventListener('click', () => {
    const item = inputItem.value.trim();
    const amount = Number(inputAmount.value);

    if (item && amount > 0) {
      lineItems.push({ item, amount });
      
      inputItem.value = '';
      inputAmount.value = '';
      pendingItem = null; 

      updateReceipt(getCurrentData());
    } else {
        alert("Please enter a valid Item name and Amount before adding.");
    }
  });

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

  function getCurrentData() {
      return {
          customer: inputCustomer.value.trim(),
          email: (inputEmail && inputEmail.value.trim()) || '',
          item: inputItem.value.trim(),
          amount: inputAmount.value,
          date: inputDate.value,
          message: inputMessage.value.trim()
      };
  }

  function updateReceipt(data) {
    elCustomer.textContent = data.customer || '—';
    elDate.textContent = formatDate(data.date);
    elMessage.textContent = data.message || 'Thank you for choosing SMART PHONES UGANDA!';

    const allItems = [...lineItems];
    if (data.item && Number(data.amount) > 0) {
        allItems.push({ item: data.item, amount: Number(data.amount) });
    }
    
    const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
    elTotal.textContent = formatCurrency(totalAmount);
    
    let itemsHtml = '';
    if (allItems.length === 0) {
        itemsHtml = '<p class="no-items">No items added yet.</p>';
    } else {
        itemsHtml = `
            ${allItems.map(item => `
                <div class="item-row">
                    <span>${item.item}</span>
                    <span>${formatCurrency(item.amount)}</span>
                </div>
            `).join('')}
        `;
    }
    elItemsContainer.innerHTML = itemsHtml;
  }
  
  // --- Email Logic ---
  async function sendReceiptEmail(data, totalAmount) {
    if (!data.email) {
      alert("Please enter a customer email address to send the receipt.");
      return;
    }
    
    if (lineItems.length === 0) {
        alert("Cannot send email: No items have been added to the receipt.");
        return;
    }

    //--- HTML for item rows ---
    const itemRowsHTML = lineItems.map(i => 
        `<tr>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">${i.item}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${formatCurrency(i.amount)}</td>
        </tr>`
    ).join('');

    try {
        const emailParams = {
            // Recipient and Customer Info
            to_email: data.email, 
            customer_name: data.customer || 'Valued Customer',
            
            // Template Variables
            receipt_date: formatDate(data.date),
            total_amount: formatCurrency(totalAmount),
            item_details: itemRowsHTML, 
            appreciation_message: data.message || 'Thank you for choosing SMART PHONES UGANDA!',
        };

        const result = await emailjs.send(
            EMAILJS_SERVICE_ID, 
            EMAILJS_TEMPLATE_ID, 
            emailParams
        );
        
        //console.log('Email successfully sent!', result.status, result.text);
        alert(`Receipt sent to ${data.email} successfully!`);

    } catch (error) {
        console.error('Email sending failed:', error);
        alert('Failed to send receipt email. Check console for details.');
    }
  }
  // -------------------------------------------------------------------
  
  function finalizeReceiptData() {
    // Add pending item before generating data
    const pendingItemName = inputItem.value.trim();
    const pendingAmountVal = Number(inputAmount.value);
    if (pendingItemName && pendingAmountVal > 0) {
         lineItems.push({ item: pendingItemName, amount: pendingAmountVal });
         inputItem.value = '';
         inputAmount.value = '';
    }

    const data = getCurrentData();
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // Final update on the display
    updateReceipt(data); 
    
    return { data, totalAmount };
  }

  function handleGenerateAndPrint(event) {
    event.preventDefault(); 
    
    const { data, totalAmount } = finalizeReceiptData();

    // Persist a simple copy locally
    try {
      const existing = JSON.parse(localStorage.getItem('receipts') || '[]');
      const id = Date.now();
      existing.push({ id, customer: data.customer, total: totalAmount, items: lineItems, date: data.date });
      localStorage.setItem('receipts', JSON.stringify(existing));
    } catch (_) { /* ignore storage errors */ }

    setTimeout(() => {
      window.print();
    }, 50);
  }

  function handleSendEmail(event) {
      event.preventDefault(); 
      
      const { data, totalAmount } = finalizeReceiptData();
      
      sendReceiptEmail(data, totalAmount);
  }


  function handleReset() {
    form.reset();
    lineItems = []; 
    updateReceipt({ customer: '', item: '', amount: '', date: '', message: 'Thank you for choosing SMART PHONES UGANDA!' });
    
    if (!inputDate.value) {
        const tzOffset = new Date().getTimezoneOffset() * 60000;
        const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
        inputDate.value = today;
    }
  }

  if (!inputDate.value) {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
    inputDate.value = today;
  }

  // Wire events
  form.querySelector('.actions button:nth-child(2)').addEventListener('click', handleGenerateAndPrint);
  sendEmailBtn.addEventListener('click', handleSendEmail);
  form.addEventListener('submit', handleGenerateAndPrint); 
  resetBtn.addEventListener('click', handleReset);


  // Live preview updates
  [inputCustomer, inputEmail, inputItem, inputAmount, inputDate, inputMessage].filter(Boolean).forEach((input) => {
    input.addEventListener('input', () => {
        updateReceipt(getCurrentData());
    });
  });

  // Initial render with defaults
  updateReceipt({
    customer: '',
    item: '',
    amount: '',
    date: inputDate.value,
    message: 'Thank you for choosing SMART PHONES UGANDA!'
  });
})();