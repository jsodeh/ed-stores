// Test script to verify order creation functionality
// Run this in the browser console after placing an order

console.log('🔍 Testing Order Creation Functionality...');

async function testOrderCreation() {
  console.log('🧪 Testing order creation process...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return;
    }
    
    if (!session || !session.user) {
      console.log('🚪 No active session - please sign in');
      return;
    }
    
    console.log('✅ Session found for user:', session.user.email);
    
    // Test creating an address
    console.log('📍 Creating test address...');
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert({
        user_id: session.user.id,
        type: "delivery",
        street_address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        postal_code: "12345",
        country: "Nigeria",
      })
      .select()
      .single();
    
    if (addressError) {
      console.error('❌ Address Creation Error:', addressError);
      return;
    }
    
    console.log('✅ Address created:', addressData);
    
    // Test creating order from cart (if cart has items)
    console.log('🛒 Testing order creation from cart...');
    const { data: cartData, error: cartError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", session.user.id);
    
    if (cartError) {
      console.error('❌ Cart Fetch Error:', cartError);
      return;
    }
    
    if (cartData && cartData.length > 0) {
      console.log('🛒 Cart items found:', cartData.length);
      
      // Test the createFromCart function
      const { data: orderData, error: orderError } = await orders.createFromCart(
        session.user.id,
        addressData.id,
        "Test order notes",
        "transfer"
      );
      
      if (orderError) {
        console.error('❌ Order Creation Error:', orderError);
      } else {
        console.log('✅ Order created successfully:', orderData);
        
        // Get the created order details
        const { data: orderDetails, error: orderDetailsError } = await supabase
          .from("order_details")
          .select("*")
          .eq("id", orderData)
          .single();
        
        if (orderDetailsError) {
          console.error('❌ Order Details Error:', orderDetailsError);
        } else {
          console.log('📄 Order Details:', orderDetails);
        }
      }
    } else {
      console.log('🛒 No items in cart - skipping order creation test');
    }
    
    // Test fetching user orders
    console.log('📦 Testing user orders fetch...');
    const { data: userOrders, error: ordersError } = await orders.getUserOrders(session.user.id);
    
    if (ordersError) {
      console.error('❌ User Orders Fetch Error:', ordersError);
    } else {
      console.log('✅ User orders fetched:', userOrders?.length || 0, 'orders');
      if (userOrders && userOrders.length > 0) {
        console.log('📄 Sample order:', userOrders[0]);
      }
    }
    
    // Test fetching all orders (for admin)
    console.log('📦 Testing all orders fetch...');
    const { data: allOrders, error: allOrdersError } = await supabase
      .from("order_details")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (allOrdersError) {
      console.error('❌ All Orders Fetch Error:', allOrdersError);
    } else {
      console.log('✅ All orders fetched:', allOrders?.length || 0, 'orders');
      if (allOrders && allOrders.length > 0) {
        console.log('📄 Latest order:', allOrders[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

// Run the test
testOrderCreation();

console.log('💡 Check the console for results:');
console.log('   - Look for "Order created successfully"');
console.log('   - Verify that orders appear in user orders list');
console.log('   - Confirm that orders appear in admin orders list');