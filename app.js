import { createGraphQLClient } from "@shopify/graphql-client";

// Getting argument from command line
const args = process.argv.slice(2);
const nameArgIndex = args.indexOf("--name");

if (nameArgIndex === -1 || !args[nameArgIndex + 1]) {
  console.error("Please provide a product name using --name argument.");
  process.exit(1);
}

const productName = args[nameArgIndex + 1]; // Get the value after --name

if (!productName) {
  console.error("Please provide a product name using --name argument.");
  process.exit(1);
}

// Env variables
const token = "6d6dda47f54e5a5ff4e04d4822b4de91";
const shopName = "anatta-test-store";

// Querying Values
async function getProductsByName(productName) {
  try {
    const client = createGraphQLClient({
      url: `https://${shopName}.myshopify.com/api/2024-10/graphql.json`,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": `${token}`,
      },
      retries: 1,
    });

    const queryString = `
    query($productName: String!) {
      products(first: 250, query: $productName) {
        edges {
          node {
            id
            title
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
    const res = await client.fetch(queryString, {
      variables: { productName },
    });
    const products = (await res.json())?.data?.products?.edges;

    // In case we have no products
    if (!products) {
      console.log("No Products found.");
      return;
    }

    // Gathering productVariants
    const productVariants = [];
    products.forEach((product) => {
      product.node.variants.edges.forEach((variant) => {
        productVariants.push({
          title: product?.node?.title,
          variantTitle: variant?.node?.title,
          price: variant?.node?.priceV2?.amount || 0,
        });
      });
    });

    // sort by price and display result
    productVariants
      .sort((a, b) => {
        return a.price - b.price;
      })
      .forEach((product) => {
        console.log(
          `${product.title} - ${product.variantTitle} - price $${product.price}`
        );
      });
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

getProductsByName(productName);
