<template>
  <div class="login-box">
    <GoogleSignInButton
      @success="handleLoginSuccess"
      @error="handleLoginError"
    ></GoogleSignInButton>
    <p v-if="errorMessage" class="login-error" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { GoogleSignInButton, type CredentialResponse } from "vue3-google-signin";

const supabase = useSupabaseClient();
const errorMessage = ref('');

definePageMeta({
  title: 'Login',
  layout: 'auth'
})

// Google gave us an ID token: trade it for a Supabase session, then let the
// server register the user (it reads identity from the session, not from us).
const handleLoginSuccess = async (response: CredentialResponse) => {
  errorMessage.value = '';
  const { credential } = response;

  if (!credential) {
    errorMessage.value = 'Google did not return a credential. Please try again.';
    return;
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
  });

  if (error) {
    console.error('Supabase login failed:', error.message);
    errorMessage.value = 'Sign-in failed: ' + error.message;
    return;
  }

  try {
    await $fetch('/api/login', { method: 'POST' });
  } catch (err: any) {
    console.error('Login registration failed:', err?.data?.statusMessage || err?.message);
    errorMessage.value = 'Sign-in failed: ' + (err?.data?.statusMessage || 'could not register your account');
    await supabase.auth.signOut();
    return;
  }

  await navigateTo('/confirm');
};

const handleLoginError = () => {
  console.error("Google login failed");
  errorMessage.value = 'Google sign-in failed. Please try again.';
};
</script>

<style scoped>
  .login-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .login-error {
    color: #e5484d;
    margin: 0;
  }
</style>
