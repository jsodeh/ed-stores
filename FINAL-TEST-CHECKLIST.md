# Final Test Checklist - Signed In/Out States

## ✅ **1. Products and Categories Display**

### **Anonymous User (Not Signed In)**
- [ ] **Page loads** → Products and categories should display immediately
- [ ] **Console logs** should show:
  ```
  🚀 StoreContext: Starting loadInitialData
  📊 StoreContext: Loading products and categories in parallel
  🔍 StoreContext: Starting refreshProducts
  🔍 StoreContext: Starting refreshCategories
  ✅ StoreContext: Initial data load completed
  ```
- [ ] **Network tab** should show successful API calls to Supabase
- [ ] **Products count** should be 32
- [ ] **Categories count** should be 7
- [ ] **No gray placeholders** - actual product/category data should display

### **Authenticated User (Signed In)**
- [ ] **Sign in** → Products and categories should display
- [ ] **Console logs** should show:
  ```
  🔄 AuthContext: Auth state change event: SIGNED_IN
  👤 AuthContext: User signed in, loading profile
  🔄 StoreContext: User authenticated, reloading data
  🚀 StoreContext: Starting loadInitialData
  📊 StoreContext: Loading products and categories in parallel
  ✅ StoreContext: Initial data load completed
  ```
- [ ] **Network tab** should show successful API calls to Supabase
- [ ] **Products count** should be 32
- [ ] **Categories count** should be 7
- [ ] **No gray placeholders** - actual product/category data should display

## ✅ **2. Cart Transfer Functionality**

### **Test Scenario: Guest → Authenticated**
1. [ ] **Start not signed in**
2. [ ] **Add 2-3 items to cart** → Cart count should show (e.g., "3")
3. [ ] **Sign in** → Should trigger cart transfer
4. [ ] **Console logs** should show:
   ```
   🛒 StoreContext: User signed in with guest cart, transferring items
   🛒 StoreContext: Transferring X items from guest cart to user cart
   ✅ StoreContext: Cart transferred successfully
   ```
5. [ ] **Cart count should remain the same** (e.g., still "3")
6. [ ] **Success notification** should appear: "Cart transferred - Your guest cart items have been added to your account"
7. [ ] **Cart items should persist** when refreshing the page

### **Test Scenario: No Guest Cart**
1. [ ] **Start not signed in**
2. [ ] **Don't add any items to cart**
3. [ ] **Sign in** → Should not trigger cart transfer
4. [ ] **Console logs** should show:
   ```
   🛒 StoreContext: No guest cart to transfer or user not authenticated
   ```

## ✅ **3. Sign Out Functionality**

### **Test Scenario: Sign Out**
1. [ ] **Be signed in** with items in cart
2. [ ] **Click "Sign Out" button**
3. [ ] **Console logs** should show:
   ```
   🚪 DesktopNavigation: Starting sign out
   🚪 AuthContext: Starting sign out process
   ✅ AuthContext: Sign out successful
   🔄 AuthContext: Auth state change event: SIGNED_OUT
   🚪 AuthContext: User signed out, clearing profile
   ✅ DesktopNavigation: Sign out completed, navigating to home
   ```
4. [ ] **Should navigate to home page**
5. [ ] **User should be signed out** (no "Hi, username" text)
6. [ ] **Sign In button should appear**
7. [ ] **Products and categories should still display** (anonymous state)

## ✅ **4. Edge Cases**

### **Multiple Sign In/Out Cycles**
1. [ ] **Sign in** → Products display
2. [ ] **Sign out** → Products still display
3. [ ] **Sign in again** → Products display
4. [ ] **Repeat 2-3 times** → Should work consistently

### **Cart Persistence**
1. [ ] **Add items while signed in**
2. [ ] **Refresh page** → Cart items should persist
3. [ ] **Sign out** → Cart should clear
4. [ ] **Sign back in** → Cart should be empty (unless guest cart transfer)

## ✅ **5. Error Handling**

### **Network Issues**
1. [ ] **Disconnect internet** → Should show connection error
2. [ ] **Reconnect** → Should retry and load data
3. [ ] **No infinite loading** → Should show error state

### **RLS Policy Issues**
1. [ ] **No 500 errors** in Network tab
2. [ ] **No permission denied errors** in console
3. [ ] **Data loads successfully** for both states

## 🎯 **Expected Final State**

After all tests pass:
- ✅ **Anonymous users**: See products, categories, can add to cart (localStorage)
- ✅ **Authenticated users**: See products, categories, can add to cart (database)
- ✅ **Cart transfer**: Guest cart → User cart works seamlessly
- ✅ **Sign out**: Works properly, clears user state
- ✅ **Data persistence**: Products/categories always load, cart persists appropriately
- ✅ **No errors**: Clean console, successful API calls

## 🚨 **If Any Test Fails**

1. **Check console logs** for specific error messages
2. **Check Network tab** for failed API calls
3. **Verify RLS policies** are applied correctly
4. **Check environment variables** in Netlify
5. **Try hard refresh** (Shift+Reload) to clear cache

---

**This checklist ensures both signed-in and signed-out states work perfectly with proper cart transfer functionality.**
