<template>
      <GoogleSignInButton
    @success="handleLoginSuccess"
    @error="handleLoginError"
  ></GoogleSignInButton>
</template>

<script setup lang="ts">

import { GoogleSignInButton, type CredentialResponse } from "vue3-google-signin";

definePageMeta({
  title: 'Login',
  layout: 'auth'
})

function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

// handle success event
const handleLoginSuccess = async (response: CredentialResponse) => {
  const { credential } = response;

  const decodedCredentials = decodeJwtResponse(credential);
  
  const res = await $fetch('/api/login', {
    method: 'POST',
    body: decodedCredentials
  })
  console.log("Access Token", decodedCredentials);
};

// handle an error event
const handleLoginError = () => {
  console.error("Login failed");
};
</script>