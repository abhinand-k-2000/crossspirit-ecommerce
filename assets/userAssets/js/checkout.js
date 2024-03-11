				function submitForm() {
					var selectedAddress = document.getElementById('addressSelect').value;
			
					if (selectedAddress) {
						window.location.href = "/checkout-payment?id=" + selectedAddress;
					} else {
						Swal.fire({
							icon: 'warning',
							title: 'Oops...',
							text: 'Please select an address before proceeding to checkout.',
							confirmButtonColor: '#3085d6',
							confirmButtonText: 'OK'
						});
					}
				} 

			// <!--SCRIPT OF ADD ADDRESS -->

				$(document).ready(function() {
					// Show the modal when the "Add Address" link is clicked
					$('#addAddressLink').click(function() {
						$('#addAddressModal').modal('show');
					});
			
					// Optional: You may want to hide the modal on form submission
					$('#addAddressForm').submit(function() {
						$('#addAddressModal').modal('hide');
					});
				});
			

				function toggleCouponSection() {
					var couponSection = document.getElementById('couponSection');
					if (couponSection.style.display === 'none') {
						couponSection.style.display = 'block';
					} else {
						couponSection.style.display = 'none';
					}
				}
			

			
				function applyCoupon() {
					// Get the coupon code from the input field
					const couponCode = document.getElementById("couponCode").value;
				
					// Reset error message display
					document.getElementById("couponError").style.display = 'none';
				
					// Make a fetch request to the API endpoint
					fetch("/coupon/apply-coupon", {
						method: "POST", // Adjust the method based on your API requirements
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ couponCode }),
					})
					.then(response => {
						if (response.status === 400) {
							// Handle 400 Bad Request
							return response.json().then(data => {
								console.log("Invalid");
								document.getElementById("couponError").innerHTML = data.message;
								document.getElementById("couponError").style.display = 'block';
								// throw new Error("Invalid coupon code");
							});
						} else if (!response.ok) {
							// throw new Error("Network response was not ok");
						}
				
						return response.json();
					})
					.then(data => {
						if (data.success) {
							console.log("Coupon applied successfully:", data);
							document.getElementById("couponCode").style.display = 'none';
							document.getElementById("applyCouponBtn").style.display = 'none';
							document.getElementById("removeCouponBtn").style.display = 'block';
							document.getElementById("showDiscount").innerHTML = 'Rs. ' + data.couponAmount;
							document.getElementById("orderTotal").innerHTML = data.totalPrice - data.couponAmount;
				
							// Optionally, you can update the UI or provide a success message
						} else {
							// Display error message based on the server response
							document.getElementById("couponError").innerHTML = data.message;
							document.getElementById("couponError").style.display = 'block';
						}
					})
					.catch(error => {
						// Handle other errors
						console.error("Error applying coupon:", error);
						document.getElementById("couponError").innerHTML = 'Error applying coupon.';
						document.getElementById("couponError").style.display = 'block';
					});
				}
				




  async function removeCoupon() {
    try {
      const response = await fetch('/coupon/remove-coupon', {
        method: 'POST',
        // You can add headers or body if required
      });

      if (response.ok) {
        // Handle success (e.g., update UI or reload the page)
        console.log("Coupon removed successfully");

        // Access updatedCart data from the server response
        const data = await response.json();
        const updatedCart = data.updatedCart;

		console.log(data)
    
        // document.getElementById("applyCouponButton").style.display = 'block'

		// document.getElementById("removeCouponBtn").style.display = 'none';

        document.getElementById("showDiscount").style.display = 'none'
        document.getElementById("orderTotal").innerHTML = updatedCart.totalProductsPrice

		document.getElementById("couponCode").style.display = 'block'
		document.getElementById("applyCouponBtn").style.display = 'block'

		document.getElementById("removeCouponBtn").style.display = 'none';


        // Reload the page or update relevant UI elements
        // window.location.reload(); // You can use this or any other method to update your UI
      } else {
        // Handle errors based on the server response
        const data = await response.json();
        console.error("Failed to remove coupon:", data.message);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
      // Handle unexpected errors
    }
  }

//   async function removeCouponFormSubmit(event) {
//     event.preventDefault(); // Prevent the default form submission

//     try {
//         const response = await fetch('/coupon/remove-coupon', {
//             method: 'POST',
//             // You can add headers or body if required
//         });

//         if (response.ok) {
//             // Handle success (e.g., update UI or reload the page)
//             console.log("Coupon removed successfully");

//             // Access updatedCart data from the server response
//             const data = await response.json();
//             const updatedCart = data.updatedCart;

//             // document.getElementById("applyCouponButton").style.display = 'block'
//             // document.getElementById("removeCouponBtn").style.display = 'none';
//             document.getElementById("showDiscount").style.display = 'none';
//             document.getElementById("orderTotal").innerHTML = updatedCart.totalProductsPrice;

//             // Optionally, reload the page or update other relevant UI elements
//             // window.location.reload(); // You can use this or any other method to update your UI
//         } else {
//             // Handle errors based on the server response
//             const data = await response.json();
//             console.error("Failed to remove coupon:", data.message);
//         }
//     } catch (error) {
//         console.error("Error during fetch:", error);
//         // Handle unexpected errors
//     }
// }
 