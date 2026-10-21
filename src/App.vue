
<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="site-header">
      <div class="header-content">
        <RouterLink to="/" class="brand">
          🛒 Capstone Shop
        </RouterLink>

        <nav>
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <p>Database Decomposition & Polyglot Persistence</p>
      <p>Powered by Vue.js, Azure SQL Database, and Azure Cosmos DB</p>
    </footer>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f7fb;
  color: #1e293b;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  background: #0f172a;
  color: white;
  padding: 20px 32px;
}

.header-content {
  max-width: 1200px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.brand {
  color: white;
  text-decoration: none;
  font-size: 24px;
  font-weight: bold;
}

nav {
  display: flex;
  gap: 24px;
}

nav a {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
}

nav a:hover,
nav a.router-link-active {
  color: #38bdf8;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  flex: 1;
}

.site-footer {
  background: #0f172a;
  color: #cbd5e1;
  text-align: center;
  padding: 20px;
  font-size: 14px;
}
</style>

