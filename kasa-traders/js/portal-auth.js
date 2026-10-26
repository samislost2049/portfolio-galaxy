(function () {
  const SUPABASE_URL = 'https://zvjj6cphulqgfnuvznzjx.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2amp6Y3BodXFsZ2ZudXZuenp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MjQ3MjcsImV4cCI6MjEwODQwMDcyN30.cMATc4F0rGoac6zqlV2YD5RHQpYxBgmZBNEufRmUqyw';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const path = window.location.pathname;
  const isLogin = path.endsWith('employee-login.html');
  const message = document.getElementById('loginMessage');
  const recoveryRedirect = 'https://kasa-traders.vercel.app/kasa-traders/employee-reset-password.html';

  const setMessage = (text, error) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('error', Boolean(error));
  };

  async function getProfile(userId) {
    const result = await supabase.from('profiles').select('full_name, role, email').eq('id', userId).single();
    if (result.error) throw result.error;
    return result.data;
  }

  if (isLogin) {
    const form = document.getElementById('portalLoginForm');
    const magicLinkButton = document.getElementById('magicLinkButton');
    const resetPasswordButton = document.getElementById('resetPasswordButton');
    const isRecovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';

    if (isRecovery) {
      window.location.replace('employee-reset-password.html' + window.location.hash);
      return;
    }

    magicLinkButton?.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      if (!email) {
        setMessage('Enter your business email first.', true);
        return;
      }
      magicLinkButton.disabled = true;
      setMessage('Sending a secure magic link...');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: 'https://kasa-traders.vercel.app/kasa-traders/employee-portal.html' }
      });
      magicLinkButton.disabled = false;
      if (error) {
        setMessage(error.message, true);
        return;
      }
      setMessage('Magic link sent. Open it from the same email account to continue.');
    });

    resetPasswordButton?.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      if (!email) {
        setMessage('Enter your business email first.', true);
        return;
      }
      resetPasswordButton.disabled = true;
      setMessage('Sending a password reset link...');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryRedirect
      });
      resetPasswordButton.disabled = false;
      if (error) {
        setMessage(error.message, true);
        return;
      }
      setMessage('Reset link sent. Open it from your business email to choose a new password.');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = form.querySelector('button');
      button.disabled = true;
      setMessage('Authenticating securely...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value
      });
      if (error) {
        button.disabled = false;
        const errorMessage = error.message === 'Invalid login credentials'
          ? 'Supabase rejected the email or password. Check that the user is confirmed and try the exact password created in Supabase.'
          : error.message;
        setMessage(errorMessage, true);
        return;
      }
      try {
        await getProfile(data.user.id);
        window.location.href = 'employee-portal.html';
      } catch (profileError) {
        await supabase.auth.signOut();
        button.disabled = false;
        setMessage('Your account has no approved portal role yet. Contact an authority.', true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = 'employee-portal.html';
    });
    return;
  }

  async function loadPortal() {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.href = 'employee-login.html';
      return;
    }
    try {
      const profile = await getProfile(sessionData.session.user.id);
      const role = profile.role;
      if (!['employee', 'manager', 'authority'].includes(role)) throw new Error('Invalid role');
      document.getElementById('portalUser').textContent = profile.full_name || profile.email || sessionData.session.user.email;
      document.getElementById('portalRole').textContent = role;
      document.querySelectorAll('[data-role-required]').forEach((panel) => {
        const required = panel.dataset.roleRequired;
        const visible = required === 'manager' ? ['manager', 'authority'].includes(role) : role === 'authority';
        panel.style.display = visible ? '' : 'none';
      });
    } catch (error) {
      await supabase.auth.signOut();
      window.location.href = 'employee-login.html';
    }
  }

  document.getElementById('logoutButton')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'employee-login.html';
  });

  const inviteForm = document.getElementById('inviteForm');
  const inviteMessage = document.getElementById('inviteMessage');
  inviteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    inviteMessage.textContent = 'Invitation service is not connected yet. The secure Supabase Edge Function must be configured before invitations can be sent.';
    inviteMessage.classList.add('error');
  });

  loadPortal();
})();
