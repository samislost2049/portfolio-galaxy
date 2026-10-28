(function () {
  const form = document.getElementById('customFurnitureForm');
  if (!form) return;

  const steps = [...form.querySelectorAll('.cf-form-step')];
  const progress = [...form.querySelectorAll('.cf-progress-step')];
  const backButton = document.getElementById('backButton');
  const nextButton = document.getElementById('nextButton');
  const submitButton = document.getElementById('submitButton');
  const message = document.getElementById('formMessage');
  const category = document.getElementById('furnitureCategory');
  const followup = document.getElementById('categoryFollowup');
  const fileInput = document.getElementById('referenceFiles');
  const fileList = document.getElementById('fileList');
  const reviewSummary = document.getElementById('reviewSummary');
  let currentStep = 1;
  let selectedFiles = [];

  const value = (name) => {
    const field = form.elements[name];
    return field ? field.value.trim() : '';
  };

  const checkedValues = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle('is-error', Boolean(isError));
  }

  function updateView() {
    steps.forEach((step) => {
      step.hidden = Number(step.dataset.step) !== currentStep;
    });
    progress.forEach((item) => {
      const number = Number(item.dataset.progress);
      item.classList.toggle('is-active', number === currentStep);
      item.classList.toggle('is-complete', number < currentStep);
    });
    backButton.hidden = currentStep === 1;
    nextButton.hidden = currentStep === 4;
    submitButton.hidden = currentStep !== 4;
    if (currentStep === 4) buildReview();
    showMessage('');
    window.scrollTo({ top: form.offsetTop - 110, behavior: 'smooth' });
  }

  function validateStep() {
    const step = steps.find((item) => Number(item.dataset.step) === currentStep);
    let valid = true;
    step.querySelectorAll('[required]').forEach((field) => {
      field.setCustomValidity('');
      if (!field.checkValidity()) {
        field.reportValidity();
        valid = false;
      }
    });
    if (currentStep === 2 && checkedValues('materials').length === 0) {
      showMessage('Please select at least one preferred material.', true);
      valid = false;
    }
    return valid;
  }

  function updateFollowup() {
    const selected = category.value;
    let content = '';
    if (selected === 'Sofas & Seating') {
      content = '<label for="upholsteryPreference">Upholstery preference <span>(optional)</span></label><input id="upholsteryPreference" name="upholsteryPreference" placeholder="Fabric, leather, performance material, or open to recommendations">';
    } else if (selected === 'Dining Tables') {
      content = '<label for="woodFinish">Preferred wood finish <span>(optional)</span></label><input id="woodFinish" name="woodFinish" placeholder="Natural, matte, stained, lacquered, or open to recommendations">';
    } else if (selected === 'Beds & Bedroom') {
      content = '<label for="bedDetails">Bed details <span>(optional)</span></label><input id="bedDetails" name="bedDetails" placeholder="Bed size, headboard, storage, or other details">';
    } else if (selected === 'Wardrobes & Storage') {
      content = '<label for="storageDetails">Storage details <span>(optional)</span></label><input id="storageDetails" name="storageDetails" placeholder="Doors, shelving, drawers, or interior requirements">';
    } else if (selected === 'Other') {
      content = '<label for="otherFurniture">Tell us about the furniture <span>(optional)</span></label><input id="otherFurniture" name="otherFurniture" placeholder="Describe the piece you have in mind">';
    }
    followup.innerHTML = content;
    followup.classList.toggle('is-visible', Boolean(content));
  }

  function renderFiles() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'cf-file-item';
      row.innerHTML = `<span>${file.name} (${Math.round(file.size / 1024)} KB)</span><button class="cf-file-remove" type="button" data-file-index="${index}">Remove</button>`;
      fileList.appendChild(row);
    });
  }

  function addFiles(files) {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    const incoming = [...files];
    const invalid = incoming.find((file) => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalid) {
      showMessage('Files must be JPG, PNG, or PDF and no larger than 10 MB each.', true);
      return;
    }
    selectedFiles = [...selectedFiles, ...incoming].slice(0, 5);
    renderFiles();
    showMessage('');
  }

  function buildReview() {
    const rows = [
      ['Name', value('fullName')],
      ['Business email', value('businessEmail')],
      ['Phone / WhatsApp', `${value('phoneCode')} ${value('phoneNumber')}`],
      ['Location', value('customerLocation')],
      ['Company', value('businessName') || 'Not provided'],
      ['Project', value('projectType')],
      ['Category', value('furnitureCategory')],
      ['Quantity', value('estimatedQuantity')],
      ['Dimensions', value('dimensions') || 'Not provided'],
      ['Materials', checkedValues('materials').join(', ')],
      ['Style', value('designStyle')],
      ['Budget', value('budget') ? `${value('budgetCurrency')} ${value('budget')}` : 'Not provided'],
      ['Timeline', value('timeline')],
      ['Delivery', `${value('deliveryCity')}, ${value('deliveryCountry')}`],
      ['Files', selectedFiles.length ? selectedFiles.map((file) => file.name).join(', ') : 'None']
    ];
    const followupField = followup.querySelector('input');
    if (followupField && followupField.value) rows.splice(10, 0, ['Additional detail', followupField.value]);
    reviewSummary.innerHTML = rows.map(([label, text]) => `<div class="cf-review-row"><dt>${label}</dt><dd>${text || 'Not provided'}</dd></div>`).join('');
  }

  category.addEventListener('change', updateFollowup);
  fileInput.addEventListener('change', (event) => addFiles(event.target.files));
  fileList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-file-index]');
    if (!button) return;
    selectedFiles.splice(Number(button.dataset.fileIndex), 1);
    renderFiles();
  });
  nextButton.addEventListener('click', () => {
    if (validateStep() && currentStep < 4) {
      currentStep += 1;
      updateView();
    }
  });
  backButton.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep -= 1;
      updateView();
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStep() || !document.getElementById('privacyConsent').checked) {
      showMessage('Please review the required fields and accept the privacy consent before continuing.', true);
      return;
    }
    if (form.elements.website.value) return;
    const subject = `Custom Furniture Enquiry - ${value('fullName')}`;
    const body = [
      `Name: ${value('fullName')}`,
      `Business email: ${value('businessEmail')}`,
      `Phone / WhatsApp: ${value('phoneCode')} ${value('phoneNumber')}`,
      `Customer location: ${value('customerLocation')}`,
      `Company: ${value('businessName') || 'Not provided'}`,
      `Project type: ${value('projectType')}`,
      `Furniture category: ${value('furnitureCategory')}`,
      `Quantity: ${value('estimatedQuantity')}`,
      `Dimensions: ${value('dimensions') || 'Not provided'}`,
      `Materials: ${checkedValues('materials').join(', ')}`,
      `Design style: ${value('designStyle')}`,
      `Budget: ${value('budget') ? `${value('budgetCurrency')} ${value('budget')}` : 'Not provided'}`,
      `Timeline: ${value('timeline')}`,
      `Delivery: ${value('deliveryCity')}, ${value('deliveryCountry')}`,
      `Project description: ${value('projectDescription') || 'Not provided'}`,
      `Reference files: ${selectedFiles.length ? selectedFiles.map((file) => file.name).join(', ') : 'None'}`
    ].join('\n');
    showMessage('Opening your email client with the completed enquiry. Please attach the selected files before sending.');
    window.location.href = `mailto:kasalivingtraders@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  updateView();
})();
