/**
 * Modal component for adding a new category
 */

import React, { useState } from "react";
import { Modal, Button, TextField } from "../vibes";
import { COLORS } from "../constants/colors";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  existingCategories?: string[];
}

export function AddCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  existingCategories = [],
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    // Check for duplicate (case-insensitive)
    const isDuplicate = existingCategories.some(
      (cat) => cat.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (isDuplicate) {
      setError("A category with this name already exists");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedName);
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const errorStyle: React.CSSProperties = {
    color: COLORS.danger,
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Category">
      <form onSubmit={handleSubmit} style={modalContentStyle}>
        <TextField
          label="Category Name"
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          fullWidth
          required
          autoFocus
        />

        {error && <div style={errorStyle}>{error}</div>}

        <div style={buttonGroupStyle}>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !name.trim()}
            fullWidth
          >
            {isSubmitting ? "Creating..." : "Add Category"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}