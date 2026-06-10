/**
 * Categories management page
 */

import React, { useState, useEffect } from "react";
import { fetchCategories, createCategory } from "../services/api";
import { Category } from "../types";
import { Button } from "../vibes";
import { AddCategoryModal } from "../components/AddCategoryModal";
import { COLORS } from "../constants/colors";

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    const newCategory = await createCategory(name);
    setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const pageStyle: React.CSSProperties = {
    padding: "48px 64px",
    minHeight: "100vh",
    background: COLORS.secondary.s01,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "40px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
    margin: 0,
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px",
    fontSize: "18px",
    color: COLORS.secondary.s08,
  };

  const categoriesContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  };

  const categoryCardStyle: React.CSSProperties = {
    background: COLORS.background.main,
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const categoryNameStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    color: COLORS.secondary.s10,
    margin: 0,
  };

  const emptyStateStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px",
    background: COLORS.background.main,
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const emptyStateTextStyle: React.CSSProperties = {
    fontSize: "18px",
    color: COLORS.secondary.s08,
    marginBottom: "16px",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Categories</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Add Category
        </Button>
      </div>

      <div style={categoriesContainerStyle}>
        {categories.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyStateTextStyle}>No categories yet</div>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Create your first category
            </Button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} style={categoryCardStyle}>
              <h3 style={categoryNameStyle}>{category.name}</h3>
            </div>
          ))
        )}
      </div>

      <AddCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCategory}
        existingCategories={categories.map((c) => c.name)}
      />
    </div>
  );
};

export default CategoriesPage;