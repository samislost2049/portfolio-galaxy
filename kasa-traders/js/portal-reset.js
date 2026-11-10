(function () {
  const SUPABASE_URL = 'https://zvjjzcphuqlgfnuvnzzx.supabase.co';
  const SUPABASE_ANON_KEY = '******';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const form = document.getElementById('resetPasswordForm');
  const message = document.getElementById('resetMessage');

  const setMessage = (text, error) => {
    message.textContent = text;
    message.classList.toggle('error', Boolean(error));
  };

  async function checkSession() {
    let settled = false;
    let timeoutId;
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        settled = true;
        window.clearTimeout(timeoutId);
        subscription.data.subscription.unsubscribe();
        setMessage('Enter and confirm your new password.');
      }
    });

    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      settled = true;
      window.clearTimeout(timeoutId);
      subscription.data.subscription.unsubscribe();
      setMessage('Enter and confirm your new password.');
      return;
    }

    timeoutId = window.setTimeout(() => {
      if (settled) return;
      subscription.data.subscription.unsubscribe();
      setMessage(error
        ? 'Unable to verify this reset link. Please request a new one.'
        : 'This reset link is invalid or has expired. Request a new one from the team login page.', true);
      form.querySelector('button').disabled = true;
    }, 3000);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = document.getElementById('newPassword').value;
    const confirmation = document.getElementById('confirmPassword').value;
    if (password !== confirmation) {
      setMessage('The passwords do not match.', true);
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    setMessage('Saving your new password...');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      button.disabled = false;
      setMessage(error.message, true);
      return;
    }
    await supabase.auth.signOut();
    setMessage('Password updated. Redirecting to team login...');
    window.setTimeout(() => {
      window.location.href = 'employee-login.html';
    }, 1200);
  });

  checkSession();
})();
