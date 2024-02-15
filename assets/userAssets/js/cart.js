// async function removeItem(productId) {
//     try {
//         const response = await fetch(`/remove-item/${productId}`, {
//             method: 'DELETE',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });

//         if (!response.ok) {
//             throw new Error('Failed to remove item');
//         }

//         // Optional: Update the page content dynamically without a page refresh
//         const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
//         cartItem.parentNode.removeChild(cartItem); // Remove the HTML element from the page

//     } catch (error) {
//         console.error(error);
//     }
// }