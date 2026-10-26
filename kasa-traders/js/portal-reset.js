(function () {
  const SUPABASE_URL = 'https://zvjj6cphulqgfnuvznzjx.supabase.co';
  const SUPABASE_ANON_KEY = '******';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const form = document.getElementById('resetPasswordForm');
  const message = document.getElementById('resetMessage');

  const setMessage = (text, error) => {
    message.textContent = text;
    message.classList.toggle('error', Boolean(error));
  };

  async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      setMessage('This reset link is invalid or has expired. Request a new one from the team login page.', true);
      form.querySelector('button').disabled = true;
      return;
    }
    setMessage('Enter and confirm your new password.');
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

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') setMessage('Enter and confirm your new password.');
  });
  checkSession();
})();
