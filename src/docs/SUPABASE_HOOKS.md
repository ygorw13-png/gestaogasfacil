# Supabase Hooks Documentation

This document provides a comprehensive guide to the Supabase hooks architecture in our application. These hooks are designed to provide standardized, reusable, and type-safe ways to interact with our Supabase database.

## Table of Contents

1. [Overview](#overview)
2. [Hook Categories](#hook-categories)
3. [Base Hooks](#base-hooks)
4. [CRUD Hooks](#crud-hooks)
5. [Specialized Hooks](#specialized-hooks)
6. [Utilities](#utilities)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

## Overview

Our Supabase hooks architecture follows a layered approach:

- **Base Utilities**: Shared error handling and query building (`useSupabaseHelpers.ts`)
- **Core CRUD Operations**: Generic database operations (`useSupabaseCRUD.ts`)
- **Table-specific Hooks**: Specialized hooks for specific tables (`useSupabaseTable.ts`)
- **Application Hooks**: Domain-specific hooks that use the core hooks (`useStockConfiguration.ts`, etc.)

This layered approach allows for code reuse, standardized error handling, and consistent user experiences across the application.

## Hook Categories

### Base Hooks

- **useSupabaseErrorHandler**: Provides standardized error handling with toast notifications.
- **useBaseSupabaseTable**: A comprehensive hook that provides full CRUD operations for a table.

### CRUD Hooks

- **useSupabaseCRUD**: A simpler hook focused on CRUD operations without state management.
- **useSupabaseTable**: A stateful hook that manages data, loading state, and provides CRUD operations.

### Specialized Hooks

These hooks build on the core hooks, adding domain-specific logic:

- **useStockConfiguration**: Manages stock configuration settings.
- **useUserManagement**: Manages users within an organization.

## Base Hooks

### useSupabaseErrorHandler

This hook provides standardized error handling for Supabase operations.

```typescript
import { useSupabaseErrorHandler } from "@/hooks/useSupabaseHelpers";

// Inside your component or hook
const { handleError, handleSuccess } = useSupabaseErrorHandler({
  defaultErrorMessage: "Operation failed",
  showToasts: true
});

// Example usage
try {
  // Perform operation
  handleSuccess("Operation completed successfully");
} catch (error) {
  handleError(error, "Custom error message");
}
```

### useBaseSupabaseTable

A comprehensive hook that provides full CRUD operations with integrated state management.

```typescript
import { useBaseSupabaseTable } from "@/hooks/useBaseSupabaseTable";

// Inside your component
const {
  data,                // Array of items from the table
  loading,             // Loading state
  error,               // Error state
  fetchData,           // Function to fetch data with filters
  getById,             // Function to get a single item by ID
  addItem,             // Function to add a new item
  updateItem,          // Function to update an existing item
  deleteItem,          // Function to delete an item
  refresh              // Function to refresh all data
} = useBaseSupabaseTable("your_table_name", {
  idField: "id",
  defaultErrorMessage: "Error in table operation",
  defaultSuccessMessage: "Operation successful",
  showToasts: true
});
```

## CRUD Hooks

### useSupabaseCRUD

A lightweight hook that provides CRUD operations without managing state.

```typescript
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";

// Inside your component
const {
  loading,             // Loading state
  error,               // Error state
  getAll,              // Function to get all items
  getById,             // Function to get a single item by ID
  create,              // Function to create a new item
  update,              // Function to update an existing item
  remove,              // Function to delete an item
  resetError           // Function to reset the error state
} = useSupabaseCRUD("your_table_name");

// Example: Get all items with filters
const items = await getAll({
  columns: "id, name, created_at",
  filters: { status: "active" },
  orderBy: { column: "created_at", ascending: false }
});
```

### useSupabaseTable

A stateful hook that manages data and provides CRUD operations.

```typescript
import { useSupabaseTable } from "@/services/supabase/hooks";

// Inside your component
const {
  data,                // Array of items from the table
  loading,             // Loading state
  error,               // Error state
  fetchData,           // Function to fetch data with options
  getById,             // Function to get a single item by ID
  createRecord,        // Function to create a new record
  updateRecord,        // Function to update an existing record
  deleteRecord,        // Function to delete a record
  refresh,             // Function to refresh all data
  setData              // Function to manually set the data state
} = useSupabaseTable("your_table_name", {
  fetchOnMount: true,
  idField: "id",
  initialQueryOptions: {
    filters: { status: "active" },
    orderBy: { column: "created_at", ascending: false }
  },
  toastMessages: {
    fetchError: "Failed to fetch data",
    createSuccess: "Record created successfully",
    // ... other custom messages
  }
});
```

## Utilities

### buildSupabaseQuery

A utility function for building consistent Supabase queries with filtering, sorting, and pagination.

```typescript
import { buildSupabaseQuery } from "@/hooks/useSupabaseHelpers";
import { supabase } from "@/integrations/supabase/client";

// Example usage
const query = supabase.from("your_table").select("*");
const modifiedQuery = buildSupabaseQuery(query, {
  filters: { status: "active" },
  orderBy: { column: "created_at", ascending: false },
  pagination: { page: 1, pageSize: 10 }
});

const { data, error } = await modifiedQuery;
```

## Best Practices

1. **Choose the right hook for your use case**:
   - For simple CRUD operations: `useSupabaseCRUD`
   - For comprehensive state management: `useSupabaseTable`
   - For low-level error handling: `useSupabaseErrorHandler`

2. **Use typed data**:
   ```typescript
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   const { data } = useSupabaseTable<User>("users");
   ```

3. **Implement error handling**:
   Always handle errors and provide user feedback.

4. **Cache data appropriately**:
   Use the state management in `useSupabaseTable` to avoid unnecessary refetches.

5. **Use the idField parameter**:
   Some tables might use a different primary key than 'id'.

## Examples

### Example 1: User Management

```typescript
function UserList() {
  const { 
    data: users, 
    loading, 
    error, 
    createRecord, 
    deleteRecord 
  } = useSupabaseTable("profiles", {
    toastMessages: {
      createSuccess: "User created successfully",
      deleteSuccess: "User deleted successfully"
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onDelete={() => deleteRecord(user.id)} 
        />
      ))}
      <Button onClick={() => createRecord({ name: "New User", role: "user" })}>
        Add User
      </Button>
    </div>
  );
}
```

### Example 2: Filtered Data

```typescript
function ActiveOrders() {
  const [filter, setFilter] = useState("pending");
  
  const { 
    data: orders, 
    loading, 
    fetchData 
  } = useSupabaseTable("orders", {
    initialQueryOptions: {
      filters: { status: "pending" },
      orderBy: { column: "created_at", ascending: false }
    }
  });

  // Update filters when filter state changes
  useEffect(() => {
    fetchData({
      filters: { status: filter }
    });
  }, [filter, fetchData]);

  return (
    <div>
      <FilterControls value={filter} onChange={setFilter} />
      {loading ? <LoadingSpinner /> : <OrdersList orders={orders} />}
    </div>
  );
}
```

## When to Use Which Hook

| Hook                      | Use When                                                    |
|---------------------------|-------------------------------------------------------------|
| useSupabaseErrorHandler   | You need low-level error handling and success notifications |
| useSupabaseCRUD           | You need simple CRUD operations without state management    |
| useSupabaseTable          | You need CRUD operations with state management              |
| useBaseSupabaseTable      | You need comprehensive table operations with state          |
| Specialized hooks         | You have domain-specific logic for a particular table       |

By following these guidelines and using the appropriate hooks, you can maintain a consistent and efficient approach to database operations throughout your application.
