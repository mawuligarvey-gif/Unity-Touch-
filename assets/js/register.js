// Client-side validation and Formspree submission for registration form
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    if (!form) return;

    const alertBox = document.getElementById('form-alert');

    function setError(id, msg) {
        const el = document.getElementById(id);
        if (el) el.textContent = msg || '';
    }

    function validate() {
        let valid = true;
        // Clear previous errors
        ['firstName','lastName','email','phone','dob','program','consent','guardian','guardianPhone'].forEach(id => setError('error-' + id, ''));

        const firstName = form.firstName.value.trim();
        const lastName = form.lastName.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        const dob = form.dob.value;
        const program = form.program.value;
        const consent = form.consent.checked;
        const guardian = form.guardian.value.trim();
        const guardianPhone = form.guardianPhone.value.trim();

        if (!firstName) { setError('error-firstName', 'First name is required'); valid = false; }
        if (!lastName) { setError('error-lastName', 'Last name is required'); valid = false; }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setError('error-email', 'A valid email is required'); valid = false; }
        if (!phone) { setError('error-phone', 'Phone number is required'); valid = false; }
        if (!dob) { setError('error-dob', 'Date of birth is required'); valid = false; }
        if (!program) { setError('error-program', 'Please select a program'); valid = false; }
        if (!consent) { setError('error-consent', 'Consent is required'); valid = false; }
        if (!guardian) { setError('error-guardian', 'Guardian / Parent name is recommended'); }
        if (!guardianPhone) { setError('error-guardianPhone', 'Guardian phone is recommended'); }

        return valid;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        alertBox.style.display = 'none';

        if (!validate()) return;

        const action = form.getAttribute('action');
        if (!action || action.includes('YOUR_FORM_ID')) {
            alertBox.style.display = 'block';
            alertBox.textContent = 'Formspree endpoint not configured. Replace YOUR_FORM_ID in form action with your Formspree form id.';
            return;
        }

        // Prepare submission - use FormData to support file uploads
        const hasFile = form.idCopy && form.idCopy.files && form.idCopy.files.length > 0;
        if (hasFile) {
            const fd = new FormData();
            // append all form fields
            Array.from(form.elements).forEach(el => {
                if (!el.name) return;
                if (el.type === 'file') {
                    if (el.files && el.files.length) fd.append(el.name, el.files[0]);
                } else if (el.type === 'checkbox') {
                    fd.append(el.name, el.checked ? 'yes' : 'no');
                } else {
                    fd.append(el.name, el.value);
                }
            });

            fetch(action, {
                method: 'POST',
                body: fd,
                headers: { 'Accept': 'application/json' }
            }).then(res => {
                if (res.ok) {
                    alertBox.style.display = 'block';
                    alertBox.textContent = 'Thank you! Your registration was submitted.';
                    form.reset();
                } else {
                    return res.json().then(json => { throw json; });
                }
            }).catch(err => {
                alertBox.style.display = 'block';
                alertBox.textContent = 'Submission failed. Please try again later.';
            });

        } else {
            // No files: send JSON
            const data = {};
            Array.from(form.elements).forEach(el => {
                if (!el.name) return;
                if (el.type === 'checkbox') data[el.name] = el.checked ? 'yes' : 'no';
                else data[el.name] = el.value;
            });

            fetch(action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => res.json())
              .then(json => {
                  // Formspree may respond differently; prefer checking res.ok in file branch
                  if (json.ok || json.success || json.status === 200) {
                      alertBox.style.display = 'block';
                      alertBox.textContent = 'Thank you! Your registration was submitted.';
                      form.reset();
                  } else {
                      alertBox.style.display = 'block';
                      alertBox.textContent = 'Submission failed. Please try again later.';
                  }
              }).catch(err => {
                  alertBox.style.display = 'block';
                  alertBox.textContent = 'Submission error. Please try again later.';
              });
        }
    });
});