

<script setup>
import { ref, onMounted } from 'vue'

const products = ref([])
const selectedProduct = ref(null)
const loading = ref(true)
const error = ref('')

async function loadProducts() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3001/api/products')

    if (!response.ok) {
      throw new Error('Unable to retrieve products from Azure Cosmos DB')
    }

    const data = await response.json()

    products.value = data.map((product) => ({
      ...product,

      icon:
        product.name === 'Laptop'
          ? '💻'
          : product.name === 'Mouse'
            ? '🖱️'
            : product.name === 'Keyboard'
              ? '⌨️'
              : '📦',

      description:
        product.name === 'Laptop'
          ? `${product.brand} laptop with ${product.ram} RAM and ${product.storage}.`
          : product.name === 'Mouse'
            ? `${product.brand} ${product.wireless ? 'wireless' : 'wired'} mouse with ${product.dpi} DPI.`
            : product.name === 'Keyboard'
              ? `${product.switchType} keyboard with ${product.backlit ? 'backlighting' : 'no backlighting'}.`
              : product.category
    }))
  } catch (err) {
    error.value = err.message
    console.error('Product loading failed:', err)
  } finally {
    loading.value = false
  }
}

function selectProduct(product) {
  selectedProduct.value = product
}

onMounted(loadProducts)
</script>


<template>
  <section class="shop-home">
    <div class="hero">
      <h1>Welcome to Capstone Shop</h1>
      <p>
        Explore products powered by a polyglot persistence
        architecture using Azure SQL Database and Azure Cosmos DB.
      </p>
    </div>

    <h2>Our Products</h2>
    
<p v-if="loading">Loading products from Azure Cosmos DB...</p>

<p v-else-if="error" class="error-message">
  {{ error }}
</p>

<p v-else-if="products.length === 0">
  No products found.
</p>


    <div class="product-grid">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
      >
        <div class="product-icon">{{ product.icon }}</div>
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p class="price">${{ product.price.toFixed(2) }}</p>

        <button @click="selectProduct(product)">
          Select Product
        </button>
      </article>
    </div>

    <div v-if="selectedProduct" class="selection">
      <h2>Selected Product</h2>
      <p>
        You selected <strong>{{ selectedProduct.name }}</strong>
        for ${{ selectedProduct.price.toFixed(2) }}.
      </p>
      <p>Next, we'll connect this selection to the ordering system.</p>
    </div>
  </section>
</template>

<style scoped>
.shop-home {
  width: 100%;
}

.hero {
  padding: 36px;
  background: #e0f2fe;
  border-radius: 12px;
  margin-bottom: 36px;
}

.hero h1 {
  margin-top: 0;
  color: #0f172a;
}

.hero p {
  color: #475569;
  line-height: 1.7;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.product-card {
  background: white;
  padding: 26px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.product-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.product-card h3 {
  color: #0f172a;
}

.product-card p {
  line-height: 1.5;
}

.price {
  font-weight: bold;
  font-size: 22px;
  color: #0369a1;
}

button {
  background: #0284c7;
  color: white;
  padding: 12px 18px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background: #0369a1;
}

.selection {
  margin-top: 36px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 24px;
}


.error-message {
  color: #b91c1c;
  background: #fef2f2;
  padding: 16px;
  border-radius: 8px;
}

</style>
