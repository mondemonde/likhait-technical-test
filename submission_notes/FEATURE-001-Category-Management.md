# FEATURE-001: Category Management Feature

## Overview

This feature implements the ability to create new expense categories dynamically through the UI, allowing users to customize categories beyond the predefined list.

## Summary

### Problem Statement
Users can only select from a predefined list of expense categories. There is no way to add custom categories.

### Solution
Implemented a full category management system with:
- A dedicated Categories page for viewing and managing categories
- An "Add Category" button in a prominent location
- A modal dialog for inputting new category details
- Backend endpoint to persist new categories
- Automatic category list refresh after creation
- Dynamic category loading in the expense form

## Implementation Details

### Backend Changes

#### 1. Routes (`backend/config/routes.rb`)
```ruby
namespace :api do
  resources :categories, only: [ :index, :create ]
  resources :expenses, only: [ :index, :create, :update, :destroy ]
end
```

#### 2. Categories Controller (`backend/app/controllers/api/categories_controller.rb`)
```ruby
class Api::CategoriesController < ApplicationController
  def index
    categories = Category.order(:name)
    render json: categories
  end

  def create
    category = Category.new(category_params)

    if category.save
      render json: category, status: :created
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def category_params
    params.require(:category).permit(:name)
  end
end
```

#### 3. Category Model (`backend/app/models/category.rb`)
```ruby
class Category < ApplicationRecord
  has_many :expenses, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: 100 }

  before_validation :strip_name

  private

  def strip_name
    self.name = name&.strip
  end
end
```

### Frontend Changes

#### 1. Types (`frontend/src/types.ts`)
```typescript
export interface Category {
  id: number;
  name: string;
}
```

#### 2. API Service (`frontend/src/services/api.ts`)
```typescript
export async function createCategory(name: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category: { name } }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.errors?.[0] || "Failed to create category");
  }

  return response.json();
}
```

#### 3. New Components

**AddCategoryModal** (`frontend/src/components/AddCategoryModal.tsx`)
- Modal component for adding new categories
- Form validation for required field
- Duplicate category detection (case-insensitive)
- Error handling and display

**CategoriesPage** (`frontend/src/pages/CategoriesPage.tsx`)
- Displays all categories in a grid layout
- "Add Category" button prominently displayed
- Empty state when no categories exist
- Automatic refresh after category creation

#### 4. Updated Components

**ExpenseForm** (`frontend/src/components/ExpenseForm.tsx`)
- Now fetches categories dynamically from API
- Removed dependency on hardcoded `EXPENSE_CATEGORIES` constant
- Category dropdown disabled while loading

**Sidebar** (`frontend/src/components/Sidebar.tsx`)
- Added "Categories" navigation item with folder icon
- Active state styling for categories page

**App** (`frontend/src/App.tsx`)
- Added routing for Categories page

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a new category |

### POST /api/categories Request Body
```json
{
  "category": {
    "name": "New Category Name"
  }
}
```

### POST /api/categories Response (Success)
```json
{
  "id": 11,
  "name": "New Category Name"
}
```

### POST /api/categories Response (Error)
```json
{
  "errors": ["Name has already been taken"]
}
```

## User Flow

1. User clicks "Categories" in the sidebar navigation
2. User is taken to the Categories page showing all existing categories
3. User clicks the "Add Category" button (top-right corner)
4. A modal dialog opens with a text input field
5. User enters a category name and clicks "Add Category"
6. If valid, the category is created and the modal closes
7. The category list refreshes to show the new category
8. The new category is now available in the expense form dropdown

## Validation Rules

- **Presence**: Category name is required
- **Uniqueness**: Category names must be unique (case-insensitive)
- **Length**: Maximum 100 characters
- **Whitespace**: Leading and trailing whitespace is automatically trimmed

## Files Modified/Created

| File | Action |
|------|--------|
| `backend/config/routes.rb` | Modified |
| `backend/app/controllers/api/categories_controller.rb` | Modified |
| `backend/app/models/category.rb` | Modified |
| `frontend/src/types.ts` | Modified |
| `frontend/src/services/api.ts` | Modified |
| `frontend/src/components/AddCategoryModal.tsx` | Created |
| `frontend/src/pages/CategoriesPage.tsx` | Created |
| `frontend/src/components/Sidebar.tsx` | Modified |
| `frontend/src/App.tsx` | Modified |
| `frontend/src/components/ExpenseForm.tsx` | Modified |

## Testing

To test the feature:

1. Start the backend and frontend servers
2. Navigate to the Categories page via the sidebar
3. Click "Add Category"
4. Enter a valid category name and submit
5. Verify the category appears in the list
6. Navigate to History page
7. Open "Add Expense" modal
8. Verify the new category appears in the dropdown

## Future Enhancements

- Category editing functionality
- Category deletion (with cascade handling for existing expenses)
- Category color customization
- Category icons/emojis
- Category reordering